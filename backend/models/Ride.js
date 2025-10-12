import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subscription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
    required: true,
  },
  driver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
  },
  vehicle_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["scheduled", "in_progress", "completed", "cancelled"],
    default: "scheduled",
  },
  refund_amount: {
    type: Number,
    default: 0,
  },
  pickup_time: String,
  drop_time: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Ride", rideSchema);
