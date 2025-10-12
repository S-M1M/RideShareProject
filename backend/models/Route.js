import mongoose from "mongoose";

const routeSchema = new mongoose.Schema({
  driver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
  },
  vehicle_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  passengers: [
    {
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      pickup_location: {
        latitude: Number,
        longitude: Number,
        address: String,
      },
      drop_location: {
        latitude: Number,
        longitude: Number,
        address: String,
      },
      pickup_time: String,
      status: { type: String, default: "scheduled" },
    },
  ],
  stops: [
    {
      location: {
        latitude: Number,
        longitude: Number,
        address: String,
      },
      type: { type: String, enum: ["pickup", "drop"] },
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      time: String,
    },
  ],
  status: {
    type: String,
    enum: ["planned", "active", "completed"],
    default: "planned",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Route", routeSchema);
