import express from "express";
import auth from "../middleware/auth.js";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import Ride from "../models/Ride.js";
import StarTransaction from "../models/StarTransaction.js";

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
      { new: true },
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

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    // Update user stars balance
    const user = await User.findById(req.user._id);
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
    res.status(500).json({ error: error.message });
  }
});

// Get stars balance
router.get("/stars/balance", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("stars");
    res.json({ stars: user.stars });
  } catch (error) {
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

export default router;
