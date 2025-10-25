import mongoose from "mongoose";

const driverAssignmentSchema = new mongoose.Schema({
  driver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
  },
  presetRoute_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PresetRoute",
    required: true,
  },
  vehicle_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
  },
  scheduledStartTime: {
    type: String, // e.g., "08:00 AM"
    required: true,
  },
  scheduledDate: {
    type: Date,
    required: true,
  },
  // NEW: Support for date ranges
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  recurringDays: {
    type: [String], // ["monday", "tuesday", "wednesday", "thursday", "friday"]
    default: [],
  },
  currentStopIndex: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["scheduled", "in-progress", "completed", "cancelled"],
    default: "scheduled",
  },
  completedStops: [
    {
      stopIndex: Number,
      completedAt: Date,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("DriverAssignment", driverAssignmentSchema);
