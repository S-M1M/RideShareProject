import express from "express";
import auth from "../middleware/auth.js";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import Ride from "../models/Ride.js";
import StarTransaction from "../models/StarTransaction.js";
import PresetRoute from "../models/PresetRoute.js";
import DriverAssignment from "../models/DriverAssignment.js";

const router = express.Router();

// Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user stats
router.get("/stats", auth, async (req, res) => {
  try {
    const activeSubscriptions = await Subscription.countDocuments({
      user_id: req.user._id,
      active: true,
    });

    const totalRides = await Ride.countDocuments({
      user_id: req.user._id,
    });

    const totalRefunds = await Ride.aggregate([
      { $match: { user_id: req.user._id } },
      { $group: { _id: null, total: { $sum: "$refund_amount" } } },
    ]);

    res.json({
      activeSubscriptions,
      totalRides,
      totalRefunds: totalRefunds[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buy stars (no payment for now)
router.post("/stars/buy", auth, async (req, res) => {
  try {
    const { amount } = req.body;

    console.log(
      "Buy stars request - User ID from token:",
      req.user._id || req.user.id
    );
    console.log("Buy stars request - Full user object:", req.user);
    console.log("Buy stars request - Amount:", amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    // Update user stars balance
    // Try both _id and id fields
    const userId = req.user._id || req.user.id;
    console.log("Looking up user with ID:", userId);
    const user = await User.findById(userId);

    if (!user) {
      console.error("User not found with ID:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    console.log("User found:", user.email);

    // Initialize stars if undefined
    if (typeof user.stars !== "number") {
      user.stars = 0;
    }

    user.stars += amount;
    await user.save();

    // Create transaction record
    const transaction = await StarTransaction.create({
      user_id: req.user._id,
      type: "purchase",
      amount: amount,
      description: `Purchased ${amount} stars`,
      balanceAfter: user.stars,
    });

    res.json({
      message: "Stars purchased successfully",
      stars: user.stars,
      transaction,
    });
  } catch (error) {
    console.error("Error buying stars:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get stars balance
router.get("/stars/balance", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("stars");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Ensure stars field exists, default to 0 if not
    const stars = typeof user.stars === "number" ? user.stars : 0;

    res.json({ stars });
  } catch (error) {
    console.error("Error fetching stars balance:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get star transaction history
router.get("/stars/transactions", auth, async (req, res) => {
  try {
    const transactions = await StarTransaction.find({ user_id: req.user._id })
      .populate("relatedSubscription")
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active preset routes (for subscription) - Public endpoint
router.get("/routes", async (req, res) => {
  try {
    const routes = await PresetRoute.find({ active: true }).sort({
      createdAt: -1,
    });
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's subscribed routes
router.get("/my-routes", auth, async (req, res) => {
  try {
    // Find active subscriptions for user
    const subscriptions = await Subscription.find({
      user_id: req.user._id,
      active: true,
      end_date: { $gte: new Date() }
    }).populate("preset_route_id");

    // Extract unique routes
    const routes = subscriptions
      .map(sub => sub.preset_route_id)
      .filter((route, index, self) => 
        route && self.findIndex(r => r._id.toString() === route._id.toString()) === index
      );

    // For each route, find today's active driver assignment to get progress
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const routesWithProgress = await Promise.all(routes.map(async (route) => {
      // Find active assignment for this route today
      const assignment = await DriverAssignment.findOne({
        presetRoute_id: route._id,
        startDate: { $lte: today },
        endDate: { $gte: today },
        status: { $ne: "cancelled" }
      }).populate("driver_id", "name email");

      return {
        ...route.toObject(),
        activeAssignment: assignment ? {
          _id: assignment._id,
          currentStopIndex: assignment.currentStopIndex || 0,
          status: assignment.status,
          scheduledStartTime: assignment.scheduledStartTime,
          driver: assignment.driver_id ? {
            _id: assignment.driver_id._id,
            name: assignment.driver_id.name,
            email: assignment.driver_id.email
          } : null
        } : null
      };
    }));

    res.json(routesWithProgress);
  } catch (error) {
    console.error("Error fetching user routes:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's TODAY routes (similar to driver's today routes)
router.get("/today-routes", auth, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Find user's active subscriptions
    const subscriptions = await Subscription.find({
      user_id: req.user._id,
      active: true,
      start_date: { $lte: targetDate },
      end_date: { $gte: targetDate }
    });

    // Get route IDs from subscriptions
    const routeIds = subscriptions.map(sub => sub.preset_route_id);

    // Find driver assignments for these routes TODAY
    const assignments = await DriverAssignment.find({
      presetRoute_id: { $in: routeIds },
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate },
      status: { $ne: "cancelled" }
    })
      .populate("presetRoute_id")
      .populate("driver_id", "name email phone")
      .populate("vehicle_id", "license_plate model");

    res.json(assignments);
  } catch (error) {
    console.error("Error fetching today's routes:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
