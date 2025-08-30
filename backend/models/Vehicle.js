import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  license_plate: {
    type: String,
    required: true,
    unique: true
  },
  available: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Vehicle', vehicleSchema);