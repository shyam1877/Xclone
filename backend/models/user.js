import mongoose from "mongoose";
const UserSchema = mongoose.Schema({
  username: { type: String, required: true },
  displayName: { type: String, required: true },
  avatar: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  bio: { type: String, default: "" },
  location: { type: String, default: "" },
  website: { type: String, default: "" },
  coverImage: { type: String, default: "" },
  joinedDate: { type: Date, default: Date.now() },
  notificationsEnabled: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  // ── Multi-language support ──────────────────────────────────────────────────
  phone: { type: String, default: "" },
  language: { type: String, enum: ["en", "es", "hi", "pt", "zh", "fr"], default: "en" },
  // ── Forgot Password fields (added for account recovery) ──────────────────────
  passwordHash: { type: String, default: "" },
  lastPasswordResetRequest: { type: Date, default: null },
  // ── Subscription fields ─────────────────────────────────────────────────────
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", default: null },
  currentPlan: { type: String, enum: ["free", "bronze", "silver", "gold"], default: "free" },
});

export default mongoose.model("User", UserSchema);

