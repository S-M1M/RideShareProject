import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import Ride from '../models/Ride.js';

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user stats
router.get('/stats', auth, async (req, res) => {
  try {
    const activeSubscriptions = await Subscription.countDocuments({
      user_id: req.user._id,
      active: true
    });

    const totalRides = await Ride.countDocuments({
      user_id: req.user._id
    });

    const totalRefunds = await Ride.aggregate([
      { $match: { user_id: req.user._id } },
      { $group: { _id: null, total: { $sum: '$refund_amount' } } }
    ]);

    res.json({
      activeSubscriptions,
      totalRides,
      totalRefunds: totalRefunds[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;