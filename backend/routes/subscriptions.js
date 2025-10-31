import express from "express";
import auth from "../middleware/auth.js";
import Subscription from "../models/Subscription.js";
import Ride from "../models/Ride.js";
import DriverAssignment from "../models/DriverAssignment.js";
import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";
import StarTransaction from "../models/StarTransaction.js";

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

export default router;
