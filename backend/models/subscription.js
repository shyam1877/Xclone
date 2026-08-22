import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  plan: {
    type: String,
    enum: ["free", "bronze", "silver", "gold"],
    default: "free",
  },
  tweetsUsed: { type: Number, default: 0 },
  tweetLimit: { type: Number, default: 1 }, // -1 = unlimited (Gold)
  amount: { type: Number, default: 0 }, // amount in paise
  billingCycleStart: { type: Date, default: Date.now },
  billingCycleEnd: { type: Date, default: null },
  razorpayOrderId: { type: String, default: "" },
  razorpayPaymentId: { type: String, default: "" },
  razorpaySignature: { type: String, default: "" },
  status: {
    type: String,
    enum: ["active", "expired", "cancelled"],
    default: "active",
  },
  createdAt: { type: Date, default: Date.now },
});

SubscriptionSchema.index({ user: 1, status: 1 });
SubscriptionSchema.index({ billingCycleEnd: 1 });

export default mongoose.model("Subscription", SubscriptionSchema);
