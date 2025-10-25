import mongoose from "mongoose";

const presetRouteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  startPoint: {
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  endPoint: {
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  stops: [
    {
      name: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      order: { type: Number, required: true },
    },
  ],
  estimatedTime: {
    type: String, // e.g., "45 min"
  },
  fare: {
    type: String, // e.g., "৳35"
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("PresetRoute", presetRouteSchema);
