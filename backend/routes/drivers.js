import express from "express";
import jwt from "jsonwebtoken";
import Route from "../models/Route.js";
import Driver from "../models/Driver.js";
import DriverAssignment from "../models/DriverAssignment.js";

const router = express.Router();

// Driver middleware to authenticate drivers
const authenticateDriver = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Access denied" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret"
    );
    const driver = await Driver.findById(decoded.userId);

    if (!driver) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.driver = driver;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Get driver's routes for today
router.get("/routes/today", authenticateDriver, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const routes = await Route.find({
      driver_id: req.driver._id,
      date: { $gte: today, $lt: tomorrow },
    })
      .populate("passengers.user_id")
      .populate("vehicle_id");

    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update route status
router.put("/routes/:id/status", authenticateDriver, async (req, res) => {
  try {
    const { status } = req.body;

    const route = await Route.findOneAndUpdate(
      { _id: req.params.id, driver_id: req.driver._id },
      { status },
      { new: true }
    );

    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }

    res.json(route);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get driver's assignments for a specific date
router.get("/assignments", authenticateDriver, async (req, res) => {
  try {
    const { date } = req.query;
    let query = { driver_id: req.driver._id };

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.scheduledDate = { $gte: startDate, $lte: endDate };
    } else {
      // Default to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.scheduledDate = { $gte: today, $lt: tomorrow };
    }

    const assignments = await DriverAssignment.find(query)
      .populate("presetRoute_id")
      .populate("vehicle_id")
      .sort({ scheduledStartTime: 1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single assignment by id
router.get("/assignments/:id", authenticateDriver, async (req, res) => {
  try {
    const assignment = await DriverAssignment.findOne({
      _id: req.params.id,
      driver_id: req.driver._id,
    })
      .populate("presetRoute_id")
      .populate("vehicle_id");

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update assignment status directly (scheduled | in-progress | completed | cancelled)
router.put("/assignments/:id/status", authenticateDriver, async (req, res) => {
  try {
    const { status } = req.body;

    const assignment = await DriverAssignment.findOne({
      _id: req.params.id,
      driver_id: req.driver._id,
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    assignment.status = status;

    // If resetting to scheduled, also reset progress
    if (status === "scheduled") {
      assignment.currentStopIndex = 0;
      assignment.completedStops = [];
    }

    await assignment.save();

    const populated = await DriverAssignment.findById(assignment._id)
      .populate("presetRoute_id")
      .populate("vehicle_id");

    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update assignment progress (mark stop as reached)
router.put(
  "/assignments/:id/progress",
  authenticateDriver,
  async (req, res) => {
    try {
      const { stopIndex } = req.body;

      const assignment = await DriverAssignment.findOne({
        _id: req.params.id,
        driver_id: req.driver._id,
      }).populate("presetRoute_id");

      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      // Update current stop index
      assignment.currentStopIndex = stopIndex + 1;

      // Add to completed stops
      assignment.completedStops.push({
        stopIndex,
        completedAt: new Date(),
      });

      // Update status
      const totalStops = assignment.presetRoute_id.stops.length + 2; // +2 for start and end
      if (assignment.currentStopIndex >= totalStops) {
        assignment.status = "completed";
      } else if (assignment.status === "scheduled") {
        assignment.status = "in-progress";
      }

      await assignment.save();

      const updatedAssignment = await DriverAssignment.findById(assignment._id)
        .populate("presetRoute_id")
        .populate("vehicle_id");

      res.json(updatedAssignment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Reset assignment for next day
router.post("/assignments/:id/reset", authenticateDriver, async (req, res) => {
  try {
    const assignment = await DriverAssignment.findOne({
      _id: req.params.id,
      driver_id: req.driver._id,
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Reset progress
    assignment.currentStopIndex = 0;
    assignment.completedStops = [];
    assignment.status = "scheduled";

    await assignment.save();

    const updatedAssignment = await DriverAssignment.findById(assignment._id)
      .populate("presetRoute_id")
      .populate("vehicle_id");

    res.json({
      message: "Assignment reset successfully",
      assignment: updatedAssignment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get passengers for driver's assigned route
router.get("/passengers", authenticateDriver, async (req, res) => {
  try {
    const { date, routeId } = req.query;
    
    // Build query for driver's assignments
    let assignmentQuery = { driver_id: req.driver._id };
    
    if (routeId) {
      assignmentQuery.presetRoute_id = routeId;
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      assignmentQuery.scheduledDate = { $gte: startDate, $lte: endDate };
    }

    // Get driver's assignments
    const assignments = await DriverAssignment.find(assignmentQuery)
      .populate("presetRoute_id");

    if (assignments.length === 0) {
      return res.json([]);
    }

    // Get preset route IDs
    const presetRouteIds = assignments.map(a => a.presetRoute_id._id);

    // Find all active subscriptions for these routes
    const Subscription = (await import("../models/Subscription.js")).default;
    const User = (await import("../models/User.js")).default;
    
    const subscriptions = await Subscription.find({
      preset_route_id: { $in: presetRouteIds },
      active: true,
      end_date: { $gte: new Date() }
    })
    .populate("user_id", "name phone email")
    .populate("preset_route_id", "name description");

    // Group passengers by route and time
    const passengersByRoute = [];
    
    for (const assignment of assignments) {
      const routeSubscriptions = subscriptions.filter(
        sub => sub.preset_route_id._id.toString() === assignment.presetRoute_id._id.toString()
      );

      if (routeSubscriptions.length > 0) {
        passengersByRoute.push({
          assignment: {
            _id: assignment._id,
            scheduledStartTime: assignment.scheduledStartTime,
            scheduledDate: assignment.scheduledDate,
            status: assignment.status
          },
          route: {
            _id: assignment.presetRoute_id._id,
            name: assignment.presetRoute_id.name,
            description: assignment.presetRoute_id.description,
            startPoint: assignment.presetRoute_id.startPoint,
            endPoint: assignment.presetRoute_id.endPoint,
            stops: assignment.presetRoute_id.stops
          },
          passengers: routeSubscriptions.map(sub => ({
            user: {
              _id: sub.user_id._id,
              name: sub.user_id.name,
              phone: sub.user_id.phone,
              email: sub.user_id.email
            },
            pickup: {
              location: sub.pickup_location,
              stopName: sub.pickup_location.address
            },
            drop: {
              location: sub.drop_location,
              stopName: sub.drop_location.address
            },
            planType: sub.plan_type,
            subscriptionId: sub._id,
            schedule: sub.schedule
          }))
        });
      }
    }

    res.json(passengersByRoute);
  } catch (error) {
    console.error("Error fetching passengers:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get driver's assigned routes (preset routes)
router.get("/my-routes", authenticateDriver, async (req, res) => {
  try {
    const PresetRoute = (await import("../models/PresetRoute.js")).default;
    
    // Find all assignments for this driver
    const assignments = await DriverAssignment.find({
      driver_id: req.driver._id,
      status: { $in: ["scheduled", "in-progress"] }
    }).distinct("presetRoute_id");

    // Get the preset routes
    const routes = await PresetRoute.find({
      _id: { $in: assignments },
      active: true
    });

    res.json(routes);
  } catch (error) {
    console.error("Error fetching driver routes:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
