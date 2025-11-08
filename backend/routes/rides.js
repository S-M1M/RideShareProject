import express from "express";
import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";
import PresetRoute from "../models/PresetRoute.js";
import Vehicle from "../models/Vehicle.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import checkRole from "../middleware/checkRole.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get all rides (Admin only) with filters
router.get("/", auth, async (req, res) => {
  try {
    const { date, status, driverId, routeId } = req.query;

    let query = {};

    // Filter by date
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      query.rideDate = { $gte: targetDate, $lt: nextDay };
    }

    // Filter by status
    if (status && status !== "all") {
      query.status = status;
    }

    // Filter by driver
    if (driverId) {
      query.driver_id = driverId;
    }

    // Filter by route
    if (routeId) {
      query.presetRoute_id = routeId;
    }

    const rides = await Ride.find(query)
      .populate("driver_id", "name email phone")
      .populate(
        "presetRoute_id",
        "name description startPoint endPoint stops fare"
      )
      .populate("vehicle_id", "license_plate model capacity")
      .sort({ rideDate: 1, scheduledStartTime: 1 });

    // Get passenger count for each ride
    const ridesWithPassengers = await Promise.all(
      rides.map(async (ride) => {
        const rideDate = new Date(ride.rideDate);
        rideDate.setHours(0, 0, 0, 0);

        let passengerCount = 0;

        // Only count passengers if presetRoute_id exists (not null)
        if (ride.presetRoute_id && ride.presetRoute_id._id) {
          passengerCount = await Subscription.countDocuments({
            preset_route_id: ride.presetRoute_id._id,
            active: true,
            start_date: { $lte: rideDate },
            end_date: { $gte: rideDate },
          });
        }

        return {
          ...ride.toObject(),
          passengerCount,
        };
      })
    );

    res.json(ridesWithPassengers);
  } catch (error) {
    console.error("Error fetching rides:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create rides (Admin only) - supports multi-day creation
router.post("/", auth, checkRole(["admin"]), async (req, res) => {
  try {
    const {
      driver_id,
      presetRoute_id,
      vehicle_id,
      scheduledStartTime,
      startDate,
      endDate,
    } = req.body;

    // Validate required fields
    if (
      !driver_id ||
      !presetRoute_id ||
      !vehicle_id ||
      !scheduledStartTime ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Verify driver, route, and vehicle exist
    const driver = await Driver.findById(driver_id);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    const route = await PresetRoute.findById(presetRoute_id);
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }

    const vehicle = await Vehicle.findById(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    // Generate individual rides for each day
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const rides = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const ride = await Ride.create({
        driver_id,
        presetRoute_id,
        vehicle_id,
        scheduledStartTime,
        rideDate: new Date(currentDate),
        status: "scheduled",
        currentStopIndex: 0,
      });

      rides.push(ride);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Update driver's assigned vehicle
    driver.assigned_vehicle_id = vehicle_id;
    await driver.save();

    res.json({
      message: `${rides.length} ride(s) created successfully`,
      rides,
    });
  } catch (error) {
    console.error("Error creating rides:", error);
    res.status(500).json({ error: error.message });
  }
});

// User: Get available rides for subscription (by route and date)
// MUST come before /:id route to avoid matching "available-for-subscription" as an ID
router.get("/available-for-subscription", auth, async (req, res) => {
  try {
    const { route_id, date } = req.query;

    if (!route_id || !date) {
      return res.status(400).json({ error: "route_id and date are required" });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find rides for this route on this date
    const rides = await Ride.find({
      presetRoute_id: route_id,
      rideDate: { $gte: targetDate, $lt: nextDay },
      status: { $in: ["scheduled", "in-progress"] }, // Don't show completed/cancelled
    })
      .populate("presetRoute_id")
      .populate("driver_id", "name email phone")
      .populate("vehicle_id", "license_plate model capacity")
      .sort({ scheduledStartTime: 1 });

    // Add capacity information to each ride
    const ridesWithCapacity = await Promise.all(
      rides.map(async (ride) => {
        const subscribedCount = await Subscription.countDocuments({
          ride_ids: ride._id,
          active: true,
        });

        const capacity = ride.vehicle_id?.capacity || 0;
        const availableSeats = capacity - subscribedCount;

        return {
          ...ride.toObject(),
          subscribedCount,
          availableSeats,
          isFull: availableSeats <= 0,
        };
      })
    );

    res.json(ridesWithCapacity);
  } catch (error) {
    console.error("Error fetching available rides:", error);
    res.status(500).json({ error: error.message });
  }
});

// Driver: Get users at a specific stop for a ride (MUST be before /:id route)
router.get("/:id/users-at-stop/:stopId", auth, async (req, res) => {
  try {
    const { id: rideId, stopId } = req.params;

    const ride = await Ride.findById(rideId).populate("presetRoute_id");
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    // Verify driver owns this ride (or is admin)
    if (
      req.user.role !== "admin" &&
      ride.driver_id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Find all subscriptions for this ride where pickup_stop_id matches
    const subscriptions = await Subscription.find({
      ride_ids: rideId,
      pickup_stop_id: stopId,
      active: true,
    }).populate("user_id", "name email phone");

    // Get attendance data for these users at this stop
    const usersWithAttendance = subscriptions.map((sub) => {
      const attendanceRecord = ride.attendance?.find(
        (a) =>
          a.userId.toString() === sub.user_id._id.toString() &&
          a.stopId === stopId
      );

      return {
        userId: sub.user_id._id,
        name: sub.user_id.name,
        email: sub.user_id.email,
        phone: sub.user_id.phone,
        subscriptionId: sub._id,
        pickupStopName: sub.pickup_stop_name,
        dropStopName: sub.drop_stop_name,
        attendance: attendanceRecord
          ? {
              status: attendanceRecord.status,
              timestamp: attendanceRecord.timestamp,
            }
          : null,
      };
    });

    res.json({
      stopId,
      stopName: null, // Will be determined on frontend
      users: usersWithAttendance,
    });
  } catch (error) {
    console.error("Error fetching users at stop:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get single ride details
router.get("/:id", auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate("driver_id", "name email phone")
      .populate("presetRoute_id")
      .populate("vehicle_id", "license_plate model capacity");

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    // Get passenger count
    const rideDate = new Date(ride.rideDate);
    rideDate.setHours(0, 0, 0, 0);

    const passengerCount = await Subscription.countDocuments({
      preset_route_id: ride.presetRoute_id._id,
      active: true,
      start_date: { $lte: rideDate },
      end_date: { $gte: rideDate },
    });

    const rideObj = {
      ...ride.toObject(),
      passengerCount,
    };

    // If user is viewing (not admin/driver), add user-specific data
    if (req.user.role === "user") {
      // Find user's subscription for this ride
      const subscription = await Subscription.findOne({
        user_id: req.user._id,
        ride_ids: ride._id,
        active: true,
      });

      if (subscription) {
        rideObj.userSubscription = {
          subscription_id: subscription._id,
          pickup_stop_id: subscription.pickup_stop_id,
          pickup_stop_name: subscription.pickup_stop_name,
          drop_stop_id: subscription.drop_stop_id,
          drop_stop_name: subscription.drop_stop_name,
          plan_type: subscription.plan_type,
        };

        // Check attendance
        const attendance = ride.attendance?.find(
          (a) => a.userId.toString() === req.user._id.toString()
        );

        if (attendance) {
          rideObj.attendanceStatus = attendance.status;
          rideObj.attendanceTimestamp = attendance.timestamp;
        }
      }
    }

    res.json(rideObj);
  } catch (error) {
    console.error("Error fetching ride:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update ride (Admin only) - can change driver and vehicle
router.put("/:id", auth, checkRole(["admin"]), async (req, res) => {
  try {
    const { driver_id, vehicle_id, scheduledStartTime, status } = req.body;

    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    // Update fields if provided
    if (driver_id) {
      const driver = await Driver.findById(driver_id);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      ride.driver_id = driver_id;
    }

    if (vehicle_id) {
      const vehicle = await Vehicle.findById(vehicle_id);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      ride.vehicle_id = vehicle_id;
    }

    if (scheduledStartTime) {
      ride.scheduledStartTime = scheduledStartTime;
    }

    if (status) {
      ride.status = status;
    }

    await ride.save();

    const updatedRide = await Ride.findById(req.params.id)
      .populate("driver_id", "name email phone")
      .populate("presetRoute_id")
      .populate("vehicle_id", "license_plate model capacity");

    res.json({
      message: "Ride updated successfully",
      ride: updatedRide,
    });
  } catch (error) {
    console.error("Error updating ride:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete ride (Admin only)
router.delete("/:id", auth, checkRole(["admin"]), async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    await Ride.findByIdAndDelete(req.params.id);

    res.json({ message: "Ride deleted successfully" });
  } catch (error) {
    console.error("Error deleting ride:", error);
    res.status(500).json({ error: error.message });
  }
});

// Driver: Start a ride
router.put("/:id/start", auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    // Verify driver owns this ride
    if (ride.driver_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (ride.status !== "scheduled") {
      return res.status(400).json({ error: "Ride is not in scheduled status" });
    }

    ride.status = "in-progress";
    await ride.save();

    res.json({
      message: "Ride started successfully",
      ride,
    });
  } catch (error) {
    console.error("Error starting ride:", error);
    res.status(500).json({ error: error.message });
  }
});

// Driver: Update ride progress (mark stop as reached)
router.put("/:id/progress", auth, async (req, res) => {
  try {
    const { stopIndex } = req.body;

    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    // Verify driver owns this ride
    if (ride.driver_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (ride.status !== "in-progress") {
      return res.status(400).json({ error: "Ride must be in progress" });
    }

    // Update current stop index
    ride.currentStopIndex = stopIndex + 1;

    // Add to completed stops
    ride.completedStops.push({
      stopIndex,
      completedAt: new Date(),
    });

    // Check if all stops are completed
    const route = await PresetRoute.findById(ride.presetRoute_id);
    const stoppagesData = route.stoppages || route.stops || [];
    const totalStops =
      (route.startPoint ? 1 : 0) +
      stoppagesData.length +
      (route.endPoint ? 1 : 0);

    if (ride.currentStopIndex >= totalStops) {
      ride.status = "completed";
    }

    await ride.save();

    res.json({
      message: "Progress updated successfully",
      ride,
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({ error: error.message });
  }
});

// Driver: Get passengers at a specific stop
router.get("/:id/passengers-at-stop", auth, async (req, res) => {
  try {
    const { stopId } = req.query;
    const ride = await Ride.findById(req.params.id).populate("presetRoute_id");

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    // Verify driver owns this ride
    if (ride.driver_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const rideDate = new Date(ride.rideDate);
    rideDate.setHours(0, 0, 0, 0);

    // Find subscriptions for this stop
    const subscriptions = await Subscription.find({
      preset_route_id: ride.presetRoute_id._id,
      pickup_stop_id: stopId,
      active: true,
      start_date: { $lte: rideDate },
      end_date: { $gte: rideDate },
    }).populate("user_id", "name email phone");

    // Map to passenger format
    const passengers = subscriptions.map((sub) => ({
      subscriptionId: sub._id,
      user: {
        id: sub.user_id._id,
        name: sub.user_id.name,
        email: sub.user_id.email,
        phone: sub.user_id.phone,
      },
      pickupStop: {
        id: sub.pickup_stop_id,
        name: sub.pickup_stop_name,
      },
      dropStop: {
        id: sub.drop_stop_id,
        name: sub.drop_stop_name,
      },
      attendance: ride.attendance?.find(
        (a) =>
          a.userId.toString() === sub.user_id._id.toString() &&
          a.stopId === stopId
      ),
    }));

    res.json({
      rideId: ride._id,
      stopId,
      passengers,
    });
  } catch (error) {
    console.error("Error fetching passengers:", error);
    res.status(500).json({ error: error.message });
  }
});

// Driver: Mark attendance
router.put("/:id/attendance", auth, async (req, res) => {
  try {
    const { userId, stopId, status } = req.body;

    if (!userId || !stopId || !status) {
      return res
        .status(400)
        .json({ error: "userId, stopId, and status are required" });
    }

    if (!["present", "absent"].includes(status)) {
      return res
        .status(400)
        .json({ error: "status must be 'present' or 'absent'" });
    }

    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    // Verify driver owns this ride
    if (ride.driver_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Initialize attendance array if not exists
    if (!ride.attendance) {
      ride.attendance = [];
    }

    // Find existing attendance record
    const existingIndex = ride.attendance.findIndex(
      (a) => a.userId.toString() === userId && a.stopId === stopId
    );

    const attendanceRecord = {
      userId,
      stopId,
      status,
      timestamp: new Date(),
    };

    if (existingIndex >= 0) {
      ride.attendance[existingIndex] = attendanceRecord;
    } else {
      ride.attendance.push(attendanceRecord);
    }

    await ride.save();

    res.json({
      message: "Attendance marked successfully",
      attendance: attendanceRecord,
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ error: error.message });
  }
});

// Driver: Get my rides (filtered by date)
router.get("/driver/my-rides", auth, async (req, res) => {
  try {
    const { date } = req.query;

    let query = { driver_id: req.user._id };

    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      query.rideDate = { $gte: targetDate, $lt: nextDay };
    }

    const rides = await Ride.find(query)
      .populate("presetRoute_id")
      .populate("vehicle_id", "license_plate model")
      .sort({ rideDate: 1, scheduledStartTime: 1 });

    res.json(rides);
  } catch (error) {
    console.error("Error fetching driver rides:", error);
    res.status(500).json({ error: error.message });
  }
});

// User: Get my rides (linked through subscriptions)
router.get("/user/my-rides", auth, async (req, res) => {
  try {
    const { status } = req.query; // all, scheduled, in-progress, completed, cancelled

    // Get user's subscriptions
    const subscriptions = await Subscription.find({
      user_id: req.user._id,
      active: true,
    });

    if (subscriptions.length === 0) {
      return res.json([]);
    }

    // Collect all ride IDs from subscriptions
    const allRideIds = [];
    const cancelledRideIdsMap = new Map(); // Map ride_id to cancellation details

    subscriptions.forEach((sub) => {
      sub.ride_ids.forEach((rideId) => {
        const rideIdStr = rideId.toString();
        if (!allRideIds.includes(rideIdStr)) {
          allRideIds.push(rideIdStr);
        }
      });

      // Track cancelled rides
      sub.cancelled_ride_ids.forEach((cr) => {
        cancelledRideIdsMap.set(cr.ride_id.toString(), {
          subscription_id: sub._id,
          cancelled_at: cr.cancelled_at,
          refund_amount: cr.refund_amount,
        });
      });
    });

    // Find all rides
    let query = { _id: { $in: allRideIds } };

    // Apply status filter
    if (status && status !== "all") {
      if (status === "cancelled") {
        // Only show cancelled rides
        query._id = { $in: Array.from(cancelledRideIdsMap.keys()) };
      } else {
        query.status = status;
        // Exclude cancelled rides for other filters
        query._id = {
          $in: allRideIds.filter((id) => !cancelledRideIdsMap.has(id)),
        };
      }
    }

    const rides = await Ride.find(query)
      .populate("presetRoute_id")
      .populate("driver_id", "name email phone")
      .populate("vehicle_id", "license_plate model")
      .sort({ rideDate: 1, scheduledStartTime: 1 });

    // Enrich rides with user-specific data
    const enrichedRides = rides.map((ride) => {
      const rideObj = ride.toObject();

      // Find which subscription this ride belongs to
      const subscription = subscriptions.find((sub) =>
        sub.ride_ids.some((id) => id.toString() === ride._id.toString())
      );

      // Check if cancelled
      const cancellationInfo = cancelledRideIdsMap.get(ride._id.toString());
      const isCancelled = !!cancellationInfo;

      // Check attendance status
      const attendance = ride.attendance?.find(
        (a) => a.userId.toString() === req.user._id.toString()
      );

      return {
        ...rideObj,
        userSubscription: subscription
          ? {
              subscription_id: subscription._id,
              pickup_stop_id: subscription.pickup_stop_id,
              pickup_stop_name: subscription.pickup_stop_name,
              drop_stop_id: subscription.drop_stop_id,
              drop_stop_name: subscription.drop_stop_name,
              plan_type: subscription.plan_type,
            }
          : null,
        isCancelled,
        cancellationInfo: cancellationInfo || null,
        attendanceStatus: attendance ? attendance.status : null,
        attendanceTimestamp: attendance ? attendance.timestamp : null,
        effectiveStatus: isCancelled ? "cancelled" : ride.status,
      };
    });

    res.json(enrichedRides);
  } catch (error) {
    console.error("Error fetching user rides:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
