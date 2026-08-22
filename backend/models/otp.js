import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
  verified: { type: Boolean, default: false }, // set true after OTP verified, before tweet post
  createdAt: { type: Date, default: Date.now },
});

// Auto-remove documents 15 minutes after creation (safety net cleanup)
OtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

export default mongoose.model("Otp", OtpSchema);
