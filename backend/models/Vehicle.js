import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["bus", "van", "microbus", "sedan", "suv"],
  },
  model: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  license_plate: {
    type: String,
    required: true,
    unique: true,
  },
  available: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ["active", "maintenance", "inactive"],
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Vehicle", vehicleSchema);
