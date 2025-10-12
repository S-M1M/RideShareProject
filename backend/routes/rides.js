import express from "express";
import auth from "../middleware/auth.js";
import Ride from "../models/Ride.js";
import Subscription from "../models/Subscription.js";

const router = express.Router();

// Get user rides
router.get("/", auth, async (req, res) => {
  try {
    const rides = await Ride.find({ user_id: req.user._id })
      .populate("subscription_id")
      .populate("driver_id")
      .populate("vehicle_id")
      .sort({ date: -1 });

    res.json(rides);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel ride
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const ride = await Ride.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    }).populate("subscription_id");

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    if (ride.status !== "scheduled") {
      return res.status(400).json({ error: "Cannot cancel this ride" });
    }

    ride.status = "cancelled";
    ride.refund_amount = ride.subscription_id.price * 0.5;
    await ride.save();

    res.json({
      message: "Ride cancelled successfully",
      refund_amount: ride.refund_amount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get today's rides
router.get("/today", auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const rides = await Ride.find({
      user_id: req.user._id,
      date: { $gte: today, $lt: tomorrow },
    })
      .populate("subscription_id")
      .populate("driver_id")
      .populate("vehicle_id");

    res.json(rides);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
