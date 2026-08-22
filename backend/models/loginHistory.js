import mongoose from "mongoose";

const LoginHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  email: { type: String, required: true, lowercase: true },
  browser: { type: String, default: "Unknown" },
  os: { type: String, default: "Unknown" },
  deviceCategory: {
    type: String,
    enum: ["desktop", "laptop", "mobile"],
    default: "desktop",
  },
  ipAddress: { type: String, default: "127.0.0.1" },
  status: {
    type: String,
    enum: ["success", "blocked", "failed", "otp_sent"],
    default: "success",
  },
  reason: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now },
});

// Index for fast retrieval by user or email, sorted by recent timestamp
LoginHistorySchema.index({ user: 1, timestamp: -1 });
LoginHistorySchema.index({ email: 1, timestamp: -1 });

export default mongoose.model("LoginHistory", LoginHistorySchema);
