import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import Subscription from '../models/Subscription.js';
import Ride from '../models/Ride.js';
import Route from '../models/Route.js';

const router = express.Router();

// Dashboard stats
router.get('/dashboard', auth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeSubscriptions = await Subscription.countDocuments({ active: true });
    const todayRides = await Ride.countDocuments({
      date: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });
    const totalDrivers = await Driver.countDocuments();
    const totalVehicles = await Vehicle.countDocuments();

    const totalRevenue = await Subscription.aggregate([
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    res.json({
      totalUsers,
      activeSubscriptions,
      todayRides,
      totalDrivers,
      totalVehicles,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User management
router.get('/users', auth, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Driver management
router.get('/drivers', auth, async (req, res) => {
  try {
    const drivers = await Driver.find()
      .populate('assigned_vehicle_id')
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add driver
router.post('/drivers', auth, async (req, res) => {
  try {
    const { name, email, password, phone, assigned_vehicle_id } = req.body;
    
    const existingDriver = await Driver.findOne({ email });
    if (existingDriver) {
      return res.status(400).json({ error: 'Driver already exists' });
    }

    const driver = new Driver({
      name,
      email,
      password,
      phone,
      assigned_vehicle_id
    });

    await driver.save();
    res.status(201).json({ message: 'Driver created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vehicle management
router.get('/vehicles', auth, async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add vehicle
router.post('/vehicles', auth, async (req, res) => {
  try {
    const { type, capacity, license_plate } = req.body;
    
    const vehicle = new Vehicle({
      type,
      capacity,
      license_plate
    });

    await vehicle.save();
    res.status(201).json({ message: 'Vehicle added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route assignment
router.post('/routes', auth, async (req, res) => {
  try {
    const { driver_id, vehicle_id, date, passengers } = req.body;
    
    const route = new Route({
      driver_id,
      vehicle_id,
      date: new Date(date),
      passengers,
      stops: generateStops(passengers)
    });

    await route.save();
    res.status(201).json({ message: 'Route assigned successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to generate optimized stops
const generateStops = (passengers) => {
  const stops = [];
  
  // Add all pickup stops
  passengers.forEach(passenger => {
    stops.push({
      location: passenger.pickup_location,
      type: 'pickup',
      user_id: passenger.user_id,
      time: passenger.pickup_time
    });
  });
  
  // Add all drop stops
  passengers.forEach(passenger => {
    stops.push({
      location: passenger.drop_location,
      type: 'drop',
      user_id: passenger.user_id
    });
  });
  
  return stops;
};

export default router;