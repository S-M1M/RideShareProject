import mongoose from "mongoose";

const starTransactionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["purchase", "spend", "refund"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  relatedSubscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("StarTransaction", starTransactionSchema);
