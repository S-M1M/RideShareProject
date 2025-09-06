import express from 'express';
import auth from '../middleware/auth.js';
import Subscription from '../models/Subscription.js';
import Ride from '../models/Ride.js';

const router = express.Router();

// Calculate subscription price based on distance and plan
const calculatePrice = (distance, planType) => {
  const baseRate = 50; // 50 taka per km
  const multipliers = {
    daily: 1,
    weekly: 6, // 7 days but 1 day free
    monthly: 25 // 30 days but 5 days free
  };
  
  return distance * baseRate * multipliers[planType];
};

// Create subscription
router.post('/', auth, async (req, res) => {
  try {
    const {
      plan_type,
      pickup_location,
      drop_location,
      schedule,
      distance
    } = req.body;

    const price = calculatePrice(distance, plan_type);
    
    const startDate = new Date();
    const endDate = new Date();
    
    switch (plan_type) {
      case 'daily':
        endDate.setDate(startDate.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(startDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(startDate.getMonth() + 1);
        break;
    }

    const subscription = new Subscription({
      user_id: req.user._id,
      plan_type,
      start_date: startDate,
      end_date: endDate,
      price,
      pickup_location,
      drop_location,
      schedule,
      distance
    });

    await subscription.save();

    // Create rides for the subscription period
    await createRidesForSubscription(subscription);

    res.status(201).json(subscription);
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
    const dayName = currentDate.toLocaleLowerCase('en-US', { weekday: 'long' }).toLowerCase();
    
    if (subscription.schedule.days.includes(dayName)) {
      const ride = new Ride({
        user_id: subscription.user_id,
        subscription_id: subscription._id,
        date: new Date(currentDate)
      });
      rides.push(ride);
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  await Ride.insertMany(rides);
};

// Get user subscriptions
router.get('/', auth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user_id: req.user._id })
      .sort({ createdAt: -1 });
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user_id: req.user._id
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    subscription.active = false;
    await subscription.save();

    // Cancel future rides and process refunds
    const futureRides = await Ride.find({
      subscription_id: subscription._id,
      date: { $gte: new Date() },
      status: 'scheduled'
    });

    for (const ride of futureRides) {
      ride.status = 'cancelled';
      ride.refund_amount = subscription.price * 0.5 / futureRides.length;
      await ride.save();
    }

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;