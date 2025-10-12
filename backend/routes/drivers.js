import express from "express";
import Route from "../models/Route.js";
import Driver from "../models/Driver.js";

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
      process.env.JWT_SECRET || "fallback_secret",
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
      { new: true },
    );

    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }

    res.json(route);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
