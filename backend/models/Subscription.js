import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  ride_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ride",
  }],
  cancelled_ride_ids: [{
    ride_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
    },
    cancelled_at: {
      type: Date,
      default: Date.now,
    },
    refund_amount: {
      type: Number,
      default: 0,
    },
  }],
  driver_assignment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DriverAssignment",
    required: false, // Deprecated - for backward compatibility
  },
  preset_route_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PresetRoute",
    required: true,
  },
  scheduledTime: {
    type: String, // e.g., "08:30 AM"
    required: true,
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
  pickup_stop_id: {
    type: String, // Can be stop._id or special IDs like "start" or "end"
    required: false,
  },
  pickup_stop_name: {
    type: String,
    required: false,
  },
  drop_location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: String,
  },
  drop_stop_id: {
    type: String, // Can be stop._id or special IDs like "start" or "end"
    required: false,
  },
  drop_stop_name: {
    type: String,
    required: false,
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
