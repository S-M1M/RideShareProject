import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  assigned_vehicle_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

driverSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

driverSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("Driver", driverSchema);
