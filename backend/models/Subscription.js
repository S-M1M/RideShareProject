import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  driver_assignment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DriverAssignment",
    required: false, // Optional for backward compatibility
  },
  preset_route_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PresetRoute",
    required: false, // Optional for backward compatibility
  },
  plan_type: {
    type: String,
    enum: ["daily", "weekly", "monthly"],
    required: true,
  },
  start_date: {
    type: Date,
    required: true,
  },
  end_date: {
    type: Date,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  starsCost: {
    type: Number,
    required: true,
    default: 0,
  },
  refunded: {
    type: Boolean,
    default: false,
  },
  refundAmount: {
    type: Number,
    default: 0,
  },
  refundedAt: {
    type: Date,
  },
  pickup_location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: String,
  },
  drop_location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: String,
  },
  active: {
    type: Boolean,
    default: true,
  },
  schedule: {
    days: [String], // ['monday', 'tuesday', etc.]
    time: String, // '08:30'
  },
  distance: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Subscription", subscriptionSchema);
