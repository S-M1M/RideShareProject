import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Driver from "../models/Driver.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get Logged in User
router.get("/me", auth, async (req, res) => {
  try {
    let user;
    const { userId, role } = req.user;

    switch (role) {
      case "driver":
        user = await Driver.findById(userId).select("-password");
        break;
      case "admin":
        user = await User.findOne({ _id: userId, role: "admin" }).select(
          "-password"
        );
        break;
      default:
        user = await User.findOne({ _id: userId, role: "user" }).select(
          "-password"
        );
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: { ...user.toObject(), role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Registration
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const user = new User({ name, email, password, phone });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Driver Registration
router.post("/driver/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingDriver = await Driver.findOne({ email });
    if (existingDriver) {
      return res.status(400).json({ error: "Driver already exists" });
    }

    const driver = new Driver({ name, email, password, phone });
    await driver.save();

    const token = jwt.sign(
      { userId: driver._id, role: "driver" },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        role: "driver",
      },
    });
  } catch (error) {
    console.error("Driver Registration Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Admin Registration
router.post("/admin/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingAdmin = await User.findOne({ email, role: "admin" });
    if (existingAdmin) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    const admin = new User({ name, email, password, phone, role: "admin" });
    await admin.save();

    const token = jwt.sign(
      { userId: admin._id, role: "admin" },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: "admin",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Driver Login
router.post("/driver/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const driver = await Driver.findOne({ email }).populate(
      "assigned_vehicle_id"
    );
    if (!driver) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await driver.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: driver._id, role: "driver" },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      driver: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        vehicle: driver.assigned_vehicle_id,
        role: "driver",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Login
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: admin._id, role: "admin" },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: "admin",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
