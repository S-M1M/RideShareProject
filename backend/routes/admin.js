import express from "express";
import auth from "../middleware/auth.js";
import checkRole from "../middleware/checkRole.js";
import User from "../models/User.js";
import Driver from "../models/Driver.js";
import Vehicle from "../models/Vehicle.js";
import Subscription from "../models/Subscription.js";
import Ride from "../models/Ride.js";
import Route from "../models/Route.js";
import PresetRoute from "../models/PresetRoute.js";
import DriverAssignment from "../models/DriverAssignment.js";

const router = express.Router();
const requireAdmin = checkRole(["admin"]);

// Dashboard stats
router.get("/dashboard", auth, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const activeSubscriptions = await Subscription.countDocuments({
      active: true,
    });
    const todayRides = await Ride.countDocuments({
      date: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    });
    const totalDrivers = await Driver.countDocuments();
    const totalVehicles = await Vehicle.countDocuments();

    const totalRevenue = await Subscription.aggregate([
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]);

    res.json({
      totalUsers,
      activeSubscriptions,
      todayRides,
      totalDrivers,
      totalVehicles,
      totalRevenue: totalRevenue[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User management
router.get("/users", auth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Driver management
router.get("/drivers", auth, async (req, res) => {
  try {
    const drivers = await Driver.find()
      .populate("assigned_vehicle_id")
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add driver
router.post("/drivers", auth, async (req, res) => {
  try {
    const { name, email, password, phone, assigned_vehicle_id } = req.body;

    const existingDriver = await Driver.findOne({ email });
    if (existingDriver) {
      return res.status(400).json({ error: "Driver already exists" });
    }

    const driver = new Driver({
      name,
      email,
      password,
      phone,
      assigned_vehicle_id,
    });

    await driver.save();
    res.status(201).json({ message: "Driver created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vehicle management
router.get("/vehicles", auth, async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single vehicle
router.get("/vehicles/:id", auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add vehicle
router.post("/vehicles", auth, async (req, res) => {
  try {
    const { type, model, year, color, capacity, license_plate, status } =
      req.body;

    // Check if vehicle with same license plate exists
    const existingVehicle = await Vehicle.findOne({ license_plate });
    if (existingVehicle) {
      return res
        .status(400)
        .json({ error: "Vehicle with this license plate already exists" });
    }

    const vehicle = new Vehicle({
      type,
      model,
      year,
      color,
      capacity,
      license_plate,
      status: status || "active",
    });

    await vehicle.save();
    res.status(201).json({ message: "Vehicle added successfully", vehicle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update vehicle
router.put("/vehicles/:id", auth, async (req, res) => {
  try {
    const {
      type,
      model,
      year,
      color,
      capacity,
      license_plate,
      available,
      status,
    } = req.body;

    // If updating license plate, check if it's already in use by another vehicle
    if (license_plate) {
      const existingVehicle = await Vehicle.findOne({
        license_plate,
        _id: { $ne: req.params.id },
      });
      if (existingVehicle) {
        return res
          .status(400)
          .json({ error: "Vehicle with this license plate already exists" });
      }
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { type, model, year, color, capacity, license_plate, available, status },
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    res.json({ message: "Vehicle updated successfully", vehicle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete vehicle
router.delete("/vehicles/:id", auth, async (req, res) => {
  try {
    // Check if vehicle is assigned to any driver
    const assignedDriver = await Driver.findOne({
      assigned_vehicle_id: req.params.id,
    });
    if (assignedDriver) {
      return res.status(400).json({
        error:
          "Cannot delete vehicle. It is assigned to a driver. Please unassign it first.",
      });
    }

    // Check if vehicle is in any active assignments
    const activeAssignments = await DriverAssignment.find({
      vehicle_id: req.params.id,
      status: { $in: ["scheduled", "in-progress"] },
    });
    if (activeAssignments.length > 0) {
      return res.status(400).json({
        error: "Cannot delete vehicle. It has active assignments.",
      });
    }

    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    res.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route assignment
router.post("/routes", auth, async (req, res) => {
  try {
    const { driver_id, vehicle_id, date, passengers } = req.body;

    const route = new Route({
      driver_id,
      vehicle_id,
      date: new Date(date),
      passengers,
      stops: generateStops(passengers),
    });

    await route.save();
    res.status(201).json({ message: "Route assigned successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to generate optimized stops
const generateStops = (passengers) => {
  const stops = [];

  // Add all pickup stops
  passengers.forEach((passenger) => {
    stops.push({
      location: passenger.pickup_location,
      type: "pickup",
      user_id: passenger.user_id,
      time: passenger.pickup_time,
    });
  });

  // Add all drop stops
  passengers.forEach((passenger) => {
    stops.push({
      location: passenger.drop_location,
      type: "drop",
      user_id: passenger.user_id,
    });
  });

  return stops;
};

// Preset Routes Management
// Get all preset routes
router.get("/preset-routes", auth, requireAdmin, async (req, res) => {
  try {
    const presetRoutes = await PresetRoute.find().sort({ createdAt: -1 });
    res.json(presetRoutes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single preset route
router.get("/preset-routes/:id", auth, requireAdmin, async (req, res) => {
  try {
    const presetRoute = await PresetRoute.findById(req.params.id);
    if (!presetRoute) {
      return res.status(404).json({ error: "Preset route not found" });
    }
    res.json(presetRoute);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create preset route
router.post("/preset-routes", auth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      startPoint,
      endPoint,
      stops,
      estimatedTime,
      fare,
    } = req.body;

    const presetRoute = new PresetRoute({
      name,
      description,
      startPoint,
      endPoint,
      stops,
      estimatedTime,
      fare,
    });

    await presetRoute.save();
    res
      .status(201)
      .json({
        message: "Preset route created successfully",
        route: presetRoute,
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update preset route
router.put("/preset-routes/:id", auth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      startPoint,
      endPoint,
      stops,
      estimatedTime,
      fare,
      active,
    } = req.body;

    const presetRoute = await PresetRoute.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        startPoint,
        endPoint,
        stops,
        estimatedTime,
        fare,
        active,
      },
      { new: true }
    );

    if (!presetRoute) {
      return res.status(404).json({ error: "Preset route not found" });
    }

    res.json({
      message: "Preset route updated successfully",
      route: presetRoute,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete preset route
router.delete("/preset-routes/:id", auth, requireAdmin, async (req, res) => {
  try {
    const presetRoute = await PresetRoute.findByIdAndDelete(req.params.id);

    if (!presetRoute) {
      return res.status(404).json({ error: "Preset route not found" });
    }

    res.json({ message: "Preset route deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Driver Assignment Management
// Get all driver assignments
router.get("/driver-assignments", auth, requireAdmin, async (req, res) => {
  try {
    const { date } = req.query;
    let query = {};

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.scheduledDate = { $gte: startDate, $lte: endDate };
    }

    const assignments = await DriverAssignment.find(query)
      .populate("driver_id", "name email")
      .populate("presetRoute_id")
      .populate("vehicle_id")
      .sort({ scheduledDate: -1, scheduledStartTime: 1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign route to driver
router.post("/driver-assignments", auth, requireAdmin, async (req, res) => {
  try {
    const {
      driver_id,
      presetRoute_id,
      vehicle_id,
      scheduledStartTime,
      scheduledDate,
    } = req.body;

    // Check if driver exists
    const driver = await Driver.findById(driver_id);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Check if preset route exists
    const presetRoute = await PresetRoute.findById(presetRoute_id);
    if (!presetRoute) {
      return res.status(404).json({ error: "Preset route not found" });
    }

    const assignment = new DriverAssignment({
      driver_id,
      presetRoute_id,
      vehicle_id,
      scheduledStartTime,
      scheduledDate: new Date(scheduledDate),
    });

    await assignment.save();

    const populatedAssignment = await DriverAssignment.findById(assignment._id)
      .populate("driver_id", "name email")
      .populate("presetRoute_id")
      .populate("vehicle_id");

    res.status(201).json({
      message: "Route assigned to driver successfully",
      assignment: populatedAssignment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update driver assignment
router.put("/driver-assignments/:id", auth, requireAdmin, async (req, res) => {
  try {
    const { scheduledStartTime, scheduledDate, status } = req.body;

    const assignment = await DriverAssignment.findByIdAndUpdate(
      req.params.id,
      { scheduledStartTime, scheduledDate, status },
      { new: true }
    )
      .populate("driver_id", "name email")
      .populate("presetRoute_id")
      .populate("vehicle_id");

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.json({ message: "Assignment updated successfully", assignment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete driver assignment
router.delete(
  "/driver-assignments/:id",
  auth,
  requireAdmin,
  async (req, res) => {
    try {
      const assignment = await DriverAssignment.findByIdAndDelete(
        req.params.id
      );

      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      res.json({ message: "Assignment deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
