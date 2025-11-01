import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
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
    required: true,
  },
  scheduledStartTime: {
    type: String, // e.g., "08:00 AM"
    required: true,
  },
  rideDate: {
    type: Date,
    required: true,
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
  attendance: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      stopId: {
        type: String, // stop ID from route
        required: true,
      },
      status: {
        type: String,
        enum: ["present", "absent"],
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
rideSchema.index({ driver_id: 1, rideDate: 1 });
rideSchema.index({ presetRoute_id: 1, rideDate: 1 });
rideSchema.index({ status: 1, rideDate: 1 });

export default mongoose.model("Ride", rideSchema);
