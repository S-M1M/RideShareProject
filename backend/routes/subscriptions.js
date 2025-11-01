import express from "express";
import auth from "../middleware/auth.js";
import Subscription from "../models/Subscription.js";
import Ride from "../models/Ride.js";
import DriverAssignment from "../models/DriverAssignment.js";
import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";
import StarTransaction from "../models/StarTransaction.js";
import PresetRoute from "../models/PresetRoute.js";

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

// Purchase subscription with stars
router.post("/purchase", auth, async (req, res) => {
  try {
    const {
      driver_assignment_id,
      pickup_stop_id,
      drop_stop_id,
      plan_type, // 'daily', 'weekly', 'monthly'
    } = req.body;

    // Validate plan type
    if (!["daily", "weekly", "monthly"].includes(plan_type)) {
      return res.status(400).json({ error: "Invalid plan type" });
    }

    // Calculate stars cost based on plan type
    const starsCostMap = {
      daily: 10,
      weekly: 60, // 10% discount (10*7 = 70, but 60)
      monthly: 200, // ~33% discount (10*30 = 300, but 200)
    };
    const starsCost = starsCostMap[plan_type];

    // Check user's stars balance
    const user = await User.findById(req.user._id);
    if (user.stars < starsCost) {
      return res.status(400).json({
        error: "Insufficient stars balance",
        required: starsCost,
        current: user.stars,
      });
    }

    // Check assignment exists
    const assignment = await DriverAssignment.findById(driver_assignment_id)
      .populate("presetRoute_id")
      .populate("vehicle_id");

    if (!assignment) {
      return res.status(404).json({ error: "Driver assignment not found" });
    }

    // Check capacity
    const subscribedCount = await Subscription.countDocuments({
      driver_assignment_id: assignment._id,
      active: true,
    });

    if (subscribedCount >= assignment.vehicle_id.capacity) {
      return res.status(400).json({ error: "No available seats" });
    }

    // Calculate end date
    const startDate = new Date();
    let endDate = new Date();
    if (plan_type === "daily") {
      endDate.setDate(endDate.getDate() + 1);
    } else if (plan_type === "weekly") {
      endDate.setDate(endDate.getDate() + 7);
    } else if (plan_type === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Deduct stars from user
    user.stars -= starsCost;
    await user.save();

    // Create subscription
    const subscription = await Subscription.create({
      user_id: req.user._id,
      driver_assignment_id,
      pickup_stop_id,
      drop_stop_id,
      start_date: startDate,
      end_date: endDate,
      plan_type,
      price: 0, // No money, only stars
      starsCost,
      active: true,
    });

    // Create star transaction
    await StarTransaction.create({
      user_id: req.user._id,
      type: "spend",
      amount: starsCost,
      description: `Purchased ${plan_type} subscription`,
      relatedSubscription: subscription._id,
      balanceAfter: user.stars,
    });

    res.json({
      message: "Subscription purchased successfully",
      subscription,
      starsRemaining: user.stars,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refund subscription (50% stars back)
router.post("/:id/refund", auth, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    if (subscription.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!subscription.active) {
      return res.status(400).json({ error: "Subscription is not active" });
    }

    if (subscription.refunded) {
      return res.status(400).json({ error: "Subscription already refunded" });
    }

    // Calculate refund amount (50% of stars cost)
    const refundAmount = Math.floor(subscription.starsCost * 0.5);

    // Update user's stars balance
    const user = await User.findById(req.user._id);
    user.stars += refundAmount;
    await user.save();

    // Update subscription
    subscription.active = false;
    subscription.refunded = true;
    subscription.refundAmount = refundAmount;
    subscription.refundedAt = new Date();
    await subscription.save();

    // Create star transaction for refund
    await StarTransaction.create({
      user_id: req.user._id,
      type: "refund",
      amount: refundAmount,
      description: `Refund for ${subscription.plan_type} subscription (50%)`,
      relatedSubscription: subscription._id,
      balanceAfter: user.stars,
    });

    res.json({
      message: "Subscription refunded successfully",
      refundAmount,
      starsBalance: user.stars,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create subscription with stars (new simplified endpoint)
router.post("/create-with-stars", auth, async (req, res) => {
  try {
    const {
      preset_route_id,
      pickup_stop_id,
      pickup_stop_name,
      drop_stop_id,
      drop_stop_name,
      plan_type,
      time_slot,
      pickup_location,
      drop_location,
      distance,
    } = req.body;

    // Validate plan type
    if (!["daily", "weekly", "monthly"].includes(plan_type)) {
      return res.status(400).json({ error: "Invalid plan type" });
    }

    // Verify preset route exists
    const presetRoute = await PresetRoute.findById(preset_route_id);
    if (!presetRoute) {
      return res.status(404).json({ error: "Route not found" });
    }

    // Find active driver assignment for this route today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const assignment = await DriverAssignment.findOne({
      presetRoute_id: preset_route_id,
      startDate: { $lte: today },
      endDate: { $gte: today },
      status: { $ne: "cancelled" },
    });

    // Validate subscription time against route schedule
    if (assignment && assignment.scheduledStartTime && time_slot) {
      // Convert times to comparable format (HH:MM)
      const routeStartTime = assignment.scheduledStartTime;
      const userPickupTime = time_slot;

      // Compare times (basic string comparison works for HH:MM format)
      if (userPickupTime < routeStartTime) {
        return res.status(400).json({
          error: `Cannot subscribe for pickup before route start time. Route starts at ${routeStartTime}, you selected ${userPickupTime}`,
          routeStartTime: routeStartTime,
          selectedTime: userPickupTime,
        });
      }
    }

    // Calculate stars cost based on plan type
    const starsCostMap = {
      daily: 10,
      weekly: 60,
      monthly: 200,
    };
    const starsCost = starsCostMap[plan_type];

    // Check user's stars balance
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Initialize stars if not set
    if (typeof user.stars !== "number") {
      user.stars = 0;
    }

    if (user.stars < starsCost) {
      return res.status(400).json({
        error: "Insufficient stars balance",
        required: starsCost,
        current: user.stars,
      });
    }

    // Calculate dates
    const startDate = new Date();
    let endDate = new Date();
    if (plan_type === "daily") {
      endDate.setDate(endDate.getDate() + 1);
    } else if (plan_type === "weekly") {
      endDate.setDate(endDate.getDate() + 7);
    } else if (plan_type === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Deduct stars from user
    user.stars -= starsCost;
    await user.save();

    // Create subscription
    const subscription = await Subscription.create({
      user_id: req.user._id,
      preset_route_id,
      plan_type,
      start_date: startDate,
      end_date: endDate,
      price: 0,
      starsCost,
      pickup_location,
      pickup_stop_id,
      pickup_stop_name,
      drop_location,
      drop_stop_id,
      drop_stop_name,
      distance,
      active: true,
      schedule: {
        days: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
        time: time_slot,
      },
    });

    // Create star transaction
    await StarTransaction.create({
      user_id: req.user._id,
      type: "spend",
      amount: starsCost,
      description: `Purchased ${plan_type} subscription`,
      relatedSubscription: subscription._id,
      balanceAfter: user.stars,
    });

    res.json({
      message: "Subscription created successfully",
      subscription,
      starsRemaining: user.stars,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ error: error.message });
  }
});

// NEW: Purchase subscription based on rides
router.post("/purchase-with-rides", auth, async (req, res) => {
  try {
    const {
      ride_id, // Initial ride user selected
      preset_route_id,
      pickup_stop_id,
      pickup_stop_name,
      drop_stop_id,
      drop_stop_name,
      plan_type,
      stops_count, // Number of stops between pickup and drop
    } = req.body;

    // Validate required fields
    if (!ride_id || !preset_route_id || !pickup_stop_id || !drop_stop_id || !plan_type || !stops_count) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get the initial ride to extract scheduledTime and start date
    const initialRide = await Ride.findById(ride_id)
      .populate("presetRoute_id")
      .populate("vehicle_id");
    
    if (!initialRide) {
      return res.status(404).json({ error: "Ride not found" });
    }

    // Calculate duration based on plan
    let durationDays;
    let payableDays;
    
    switch (plan_type) {
      case "daily":
        durationDays = 1;
        payableDays = 1;
        break;
      case "weekly":
        durationDays = 7;
        payableDays = 6; // 1 day free
        break;
      case "monthly":
        durationDays = 30;
        payableDays = 25; // 5 days free
        break;
      default:
        return res.status(400).json({ error: "Invalid plan type" });
    }

    // Calculate date range
    const startDate = new Date(initialRide.rideDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays - 1);
    endDate.setHours(23, 59, 59, 999);

    // Find all matching rides (same route + time) in date range
    const matchingRides = await Ride.find({
      presetRoute_id: preset_route_id,
      scheduledStartTime: initialRide.scheduledStartTime,
      rideDate: { $gte: startDate, $lte: endDate },
      status: { $ne: "cancelled" },
    }).populate("vehicle_id");

    if (matchingRides.length === 0) {
      return res.status(404).json({ error: "No matching rides found for the selected period" });
    }

    // Check capacity for ALL rides
    for (const ride of matchingRides) {
      const subscribedCount = await Subscription.countDocuments({
        ride_ids: ride._id,
        active: true,
      });

      if (!ride.vehicle_id) {
        return res.status(400).json({ 
          error: `No vehicle assigned to ride on ${ride.rideDate.toLocaleDateString()}` 
        });
      }

      if (subscribedCount >= ride.vehicle_id.capacity) {
        return res.status(400).json({
          error: `Ride on ${ride.rideDate.toLocaleDateString()} is full`,
          fullRideDate: ride.rideDate,
        });
      }
    }

    // Calculate pricing
    const dailyCost = stops_count * 10; // 10 stars per stop
    const totalCost = dailyCost * payableDays;

    // Check user's stars balance
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.stars < totalCost) {
      return res.status(400).json({
        error: "Insufficient stars",
        required: totalCost,
        available: user.stars,
        shortage: totalCost - user.stars,
      });
    }

    // Deduct stars
    user.stars -= totalCost;
    await user.save();

    // Create subscription
    const subscription = new Subscription({
      user_id: req.user._id,
      ride_ids: matchingRides.map(r => r._id),
      preset_route_id,
      scheduledTime: initialRide.scheduledStartTime,
      plan_type,
      start_date: startDate,
      end_date: endDate,
      pickup_stop_id,
      pickup_stop_name,
      drop_stop_id,
      drop_stop_name,
      pickup_location: {
        latitude: 0, // These can be populated from stop data if needed
        longitude: 0,
      },
      drop_location: {
        latitude: 0,
        longitude: 0,
      },
      price: totalCost,
      starsCost: totalCost,
      distance: stops_count, // Reusing distance field to store stops count
      active: true,
      cancelled_ride_ids: [],
    });

    await subscription.save();

    // Create star transaction
    await StarTransaction.create({
      user_id: req.user._id,
      type: "spend",
      amount: totalCost,
      description: `Purchased ${plan_type} subscription (${durationDays} days, ${matchingRides.length} rides)`,
      relatedSubscription: subscription._id,
      balanceAfter: user.stars,
    });

    res.json({
      message: "Subscription purchased successfully",
      subscription,
      ridesCount: matchingRides.length,
      totalCost,
      starsRemaining: user.stars,
    });
  } catch (error) {
    console.error("Error purchasing subscription:", error);
    res.status(500).json({ error: error.message });
  }
});

// NEW: Cancel a ride from subscription
router.post("/cancel-ride", auth, async (req, res) => {
  try {
    const { subscription_id, ride_id } = req.body;

    if (!subscription_id || !ride_id) {
      return res.status(400).json({ error: "Missing subscription_id or ride_id" });
    }

    // Get subscription
    const subscription = await Subscription.findById(subscription_id);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    // Verify user owns this subscription
    if (subscription.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Check if ride is in subscription
    if (!subscription.ride_ids.includes(ride_id)) {
      return res.status(400).json({ error: "Ride not found in subscription" });
    }

    // Check if already cancelled
    const alreadyCancelled = subscription.cancelled_ride_ids.some(
      cr => cr.ride_id.toString() === ride_id.toString()
    );
    if (alreadyCancelled) {
      return res.status(400).json({ error: "Ride already cancelled" });
    }

    // Get ride details
    const ride = await Ride.findById(ride_id);
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    // Check cancellation deadline (12 hours before scheduled start)
    const rideDateTime = new Date(ride.rideDate);
    const [time, period] = ride.scheduledStartTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    rideDateTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const hoursUntilRide = (rideDateTime - now) / (1000 * 60 * 60);
    
    if (hoursUntilRide < 12) {
      return res.status(400).json({
        error: "Cannot cancel ride within 12 hours of scheduled start time",
        hoursUntilRide: hoursUntilRide.toFixed(1),
      });
    }

    // Check ride status
    if (ride.status !== "scheduled") {
      return res.status(400).json({
        error: `Cannot cancel ride with status: ${ride.status}`,
      });
    }

    // Calculate refund (50% of single day cost)
    const dailyCost = subscription.distance * 10; // distance stores stops_count
    const refundAmount = dailyCost * 0.5;

    // Update user stars
    const user = await User.findById(req.user._id);
    user.stars += refundAmount;
    await user.save();

    // Add to cancelled rides
    subscription.cancelled_ride_ids.push({
      ride_id: ride_id,
      cancelled_at: new Date(),
      refund_amount: refundAmount,
    });
    await subscription.save();

    // Create refund transaction
    await StarTransaction.create({
      user_id: req.user._id,
      type: "earn",
      amount: refundAmount,
      description: `Refund for cancelled ride on ${ride.rideDate.toLocaleDateString()}`,
      relatedSubscription: subscription._id,
      balanceAfter: user.stars,
    });

    res.json({
      message: "Ride cancelled successfully",
      refundAmount,
      starsBalance: user.stars,
      cancelledRide: {
        ride_id,
        rideDate: ride.rideDate,
        scheduledTime: ride.scheduledStartTime,
      },
    });
  } catch (error) {
    console.error("Error cancelling ride:", error);
    res.status(500).json({ error: error.message });
  }
});

// NEW: Get active subscriptions with upcoming rides
router.get("/active-with-rides", auth, async (req, res) => {
  try {
    const now = new Date();
    
    const subscriptions = await Subscription.find({
      user_id: req.user._id,
      active: true,
      end_date: { $gte: now }, // Only subscriptions that haven't ended
    })
      .populate("preset_route_id", "name description")
      .populate("ride_ids");

    // Filter to only show subscriptions with upcoming rides
    const activeSubscriptions = subscriptions
      .map(sub => {
        // Filter out cancelled rides and past rides
        const upcomingRides = sub.ride_ids.filter(ride => {
          const isCancelled = sub.cancelled_ride_ids.some(
            cr => cr.ride_id.toString() === ride._id.toString()
          );
          const rideDate = new Date(ride.rideDate);
          return !isCancelled && rideDate >= now;
        });

        if (upcomingRides.length === 0) return null;

        return {
          _id: sub._id,
          route: sub.preset_route_id,
          scheduledTime: sub.scheduledTime,
          planType: sub.plan_type,
          pickupStop: sub.pickup_stop_name,
          dropStop: sub.drop_stop_name,
          startDate: sub.start_date,
          endDate: sub.end_date,
          upcomingRidesCount: upcomingRides.length,
          nextRideDate: upcomingRides[0]?.rideDate,
        };
      })
      .filter(sub => sub !== null);

    res.json(activeSubscriptions);
  } catch (error) {
    console.error("Error fetching active subscriptions:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

