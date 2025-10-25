import express from "express";
import auth from "../middleware/auth.js";
import Subscription from "../models/Subscription.js";
import Ride from "../models/Ride.js";
import DriverAssignment from "../models/DriverAssignment.js";
import Vehicle from "../models/Vehicle.js";

const router = express.Router();

// Check available capacity for a driver assignment
router.get("/check-capacity/:assignmentId", auth, async (req, res) => {
  try {
    const assignment = await DriverAssignment.findById(req.params.assignmentId)
      .populate("vehicle_id")
      .populate("presetRoute_id");

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    if (!assignment.vehicle_id) {
      return res
        .status(400)
        .json({ error: "No vehicle assigned to this route" });
    }

    // Count active subscriptions for this assignment
    const subscribedCount = await Subscription.countDocuments({
      driver_assignment_id: assignment._id,
      active: true,
    });

    const vehicleCapacity = assignment.vehicle_id.capacity;
    const availableSeats = vehicleCapacity - subscribedCount;

    res.json({
      vehicleCapacity,
      subscribedCount,
      availableSeats,
      isFull: availableSeats <= 0,
      assignment: {
        id: assignment._id,
        route: assignment.presetRoute_id,
        scheduledTime: assignment.scheduledStartTime,
        scheduledDate: assignment.scheduledDate,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all available driver assignments with capacity info
router.get("/available-routes", auth, async (req, res) => {
  try {
    const { date } = req.query;
    let query = {
      status: { $in: ["scheduled", "in-progress"] },
    };

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.scheduledDate = { $gte: startDate, $lte: endDate };
    } else {
      // Default to future assignments
      query.scheduledDate = { $gte: new Date() };
    }

    const assignments = await DriverAssignment.find(query)
      .populate("driver_id", "name email phone")
      .populate("presetRoute_id")
      .populate("vehicle_id")
      .sort({ scheduledDate: 1, scheduledStartTime: 1 });

    // Calculate capacity for each assignment
    const assignmentsWithCapacity = await Promise.all(
      assignments.map(async (assignment) => {
        if (!assignment.vehicle_id) {
          return {
            ...assignment.toObject(),
            vehicleCapacity: 0,
            subscribedCount: 0,
            availableSeats: 0,
            isFull: true,
          };
        }

        const subscribedCount = await Subscription.countDocuments({
          driver_assignment_id: assignment._id,
          active: true,
        });

        const vehicleCapacity = assignment.vehicle_id.capacity;
        const availableSeats = vehicleCapacity - subscribedCount;

        return {
          ...assignment.toObject(),
          vehicleCapacity,
          subscribedCount,
          availableSeats,
          isFull: availableSeats <= 0,
        };
      })
    );

    res.json(assignmentsWithCapacity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate subscription price based on distance and plan
const calculatePrice = (distance, planType) => {
  const baseRate = 50; // 50 taka per km
  const multipliers = {
    daily: 1,
    weekly: 6, // 7 days but 1 day free
    monthly: 25, // 30 days but 5 days free
  };

  return distance * baseRate * multipliers[planType];
};

// Create subscription
router.post("/", auth, async (req, res) => {
  try {
    const {
      plan_type,
      pickup_location,
      drop_location,
      schedule,
      distance,
      driver_assignment_id,
      preset_route_id,
    } = req.body;

    // If driver assignment is provided, check capacity
    if (driver_assignment_id) {
      const assignment = await DriverAssignment.findById(
        driver_assignment_id
      ).populate("vehicle_id");

      if (!assignment) {
        return res.status(404).json({ error: "Driver assignment not found" });
      }

      if (!assignment.vehicle_id) {
        return res
          .status(400)
          .json({ error: "No vehicle assigned to this route" });
      }

      // Check current subscriptions for this assignment
      const subscribedCount = await Subscription.countDocuments({
        driver_assignment_id: assignment._id,
        active: true,
      });

      const vehicleCapacity = assignment.vehicle_id.capacity;

      if (subscribedCount >= vehicleCapacity) {
        return res.status(400).json({
          error:
            "Vehicle is at full capacity. Please choose another route or time.",
          capacity: vehicleCapacity,
          currentSubscriptions: subscribedCount,
        });
      }
    }

    const price = calculatePrice(distance, plan_type);

    const startDate = new Date();
    const endDate = new Date();

    switch (plan_type) {
      case "daily":
        endDate.setDate(startDate.getDate() + 1);
        break;
      case "weekly":
        endDate.setDate(startDate.getDate() + 7);
        break;
      case "monthly":
        endDate.setMonth(startDate.getMonth() + 1);
        break;
    }

    const subscription = new Subscription({
      user_id: req.user._id,
      driver_assignment_id,
      preset_route_id,
      plan_type,
      start_date: startDate,
      end_date: endDate,
      price,
      pickup_location,
      drop_location,
      schedule,
      distance,
    });

    await subscription.save();

    // Create rides for the subscription period
    await createRidesForSubscription(subscription);

    // Populate the response
    const populatedSubscription = await Subscription.findById(subscription._id)
      .populate("driver_assignment_id")
      .populate("preset_route_id");

    res.status(201).json(populatedSubscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to create rides for subscription
const createRidesForSubscription = async (subscription) => {
  const rides = [];
  const currentDate = new Date(subscription.start_date);
  const endDate = new Date(subscription.end_date);

  while (currentDate < endDate) {
    const dayName = currentDate
      .toLocaleLowerCase("en-US", { weekday: "long" })
      .toLowerCase();

    if (subscription.schedule.days.includes(dayName)) {
      const ride = new Ride({
        user_id: subscription.user_id,
        subscription_id: subscription._id,
        date: new Date(currentDate),
      });
      rides.push(ride);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  await Ride.insertMany(rides);
};

// Get user subscriptions
router.get("/", auth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      user_id: req.user._id,
    }).sort({ createdAt: -1 });
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    subscription.active = false;
    await subscription.save();

    // Cancel future rides and process refunds
    const futureRides = await Ride.find({
      subscription_id: subscription._id,
      date: { $gte: new Date() },
      status: "scheduled",
    });

    for (const ride of futureRides) {
      ride.status = "cancelled";
      ride.refund_amount = (subscription.price * 0.5) / futureRides.length;
      await ride.save();
    }

    res.json({ message: "Subscription cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
