import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import multer from "multer";
import nodemailer from "nodemailer";
import { parseBuffer } from "music-metadata";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import Razorpay from "razorpay";
import User from "./models/user.js";
import Tweet from "./models/tweet.js";
import Otp from "./models/otp.js";
import Notification from "./models/notification.js";
import Bookmark from "./models/bookmark.js";
import Subscription from "./models/subscription.js";
import LoginHistory from "./models/loginHistory.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ─── Static serving for uploaded files ─────────────────────────────────────────
const uploadsBaseDir = path.join(__dirname, "uploads");
const audioUploadsDir = path.join(uploadsBaseDir, "audio");
const imageUploadsDir = path.join(uploadsBaseDir, "images");
if (!fs.existsSync(audioUploadsDir)) fs.mkdirSync(audioUploadsDir, { recursive: true });
if (!fs.existsSync(imageUploadsDir)) fs.mkdirSync(imageUploadsDir, { recursive: true });

app.use("/audio", express.static(audioUploadsDir));
app.use("/uploads", express.static(uploadsBaseDir));

// ─── Multer config for audio ───────────────────────────────────────────────────
const SUPPORTED_MIME_TYPES = [
  "audio/mpeg",       // mp3
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/mp4",        // m4a
  "audio/x-m4a",
  "audio/ogg",
  "audio/webm",
  "video/webm",       // webm audio (MediaRecorder output)
];

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
const MAX_DURATION_SECONDS = 5 * 60;           // 5 minutes

const storage = multer.memoryStorage(); // keep in memory for validation before saving

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${file.mimetype}`));
    }
  },
});

// ─── Multer config for images (avatars, covers, tweet images) ──────────────────
const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, imageUploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `img-${uniqueSuffix}${ext}`);
  },
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// ─── Nodemailer transporter ───────────────────────────────────────────────────
const emailUser = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : "";
const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, "").trim() : "";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

// ─── Razorpay instance ────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── Subscription plan config ─────────────────────────────────────────────────
const SUBSCRIPTION_PLANS = {
  free:   { name: "Free",   price: 0,    priceInPaise: 0,      tweetLimit: 1,  description: "1 tweet per month" },
  bronze: { name: "Bronze", price: 100,  priceInPaise: 10000,  tweetLimit: 3,  description: "Up to 3 tweets per month" },
  silver: { name: "Silver", price: 300,  priceInPaise: 30000,  tweetLimit: 5,  description: "Up to 5 tweets per month" },
  gold:   { name: "Gold",   price: 1000, priceInPaise: 100000, tweetLimit: -1, description: "Unlimited tweets" },
};

// ─── Payment time window check (10:00 AM – 11:00 AM IST) ─────────────────────
function isWithinPaymentWindow() {
  const { hours, minutes } = getISTTimeInfo();
  const totalMinutes = hours * 60 + minutes;
  const start = 10 * 60; // 10:00 AM = 600
  const end   = 11 * 60; // 11:00 AM = 660
  return totalMinutes >= start && totalMinutes < end;
}

// ─── Subscription helper: get or create user subscription ─────────────────────
async function getOrCreateSubscription(userId) {
  let sub = await Subscription.findOne({ user: userId, status: "active" });
  if (!sub) {
    // Create default free subscription
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + 1);
    sub = await Subscription.create({
      user: userId,
      plan: "free",
      tweetLimit: 1,
      tweetsUsed: 0,
      billingCycleStart: now,
      billingCycleEnd: end,
      status: "active",
    });
    await User.findByIdAndUpdate(userId, { subscription: sub._id, currentPlan: "free" });
  }
  // Auto-reset if billing cycle has ended
  if (sub.billingCycleEnd && new Date() > sub.billingCycleEnd) {
    if (sub.plan === "free") {
      // Reset free plan cycle
      const now = new Date();
      const end = new Date(now);
      end.setMonth(end.getMonth() + 1);
      sub.tweetsUsed = 0;
      sub.billingCycleStart = now;
      sub.billingCycleEnd = end;
      await sub.save();
    } else {
      // Paid plan expired → downgrade to free
      sub.status = "expired";
      await sub.save();
      const now = new Date();
      const end = new Date(now);
      end.setMonth(end.getMonth() + 1);
      sub = await Subscription.create({
        user: userId,
        plan: "free",
        tweetLimit: 1,
        tweetsUsed: 0,
        billingCycleStart: now,
        billingCycleEnd: end,
        status: "active",
      });
      await User.findByIdAndUpdate(userId, { subscription: sub._id, currentPlan: "free" });
    }
  }
  return sub;
}

// ─── OTP helpers ─────────────────────────────────────────────────────────────
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

// ─── Recovery password generator ─────────────────────────────────────────────
// Generates a cryptographically secure 14-character password using only A-Z and
// a-z (no numbers, no special characters) as required by the spec.
function generateRecoveryPassword(length = 14) {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const alphabet = upper + lower; // 52 chars
  let password = "";
  // Generate extra bytes to avoid bias from modulo (rejection sampling)
  const bytesNeeded = length * 3;
  const randomBytes = crypto.randomBytes(bytesNeeded);
  let count = 0;
  for (let i = 0; i < randomBytes.length && count < length; i++) {
    const value = randomBytes[i];
    // Reject values ≥ 208 (256 - 256 % 52 = 208) to eliminate modulo bias
    if (value >= 208) continue;
    password += alphabet[value % 52];
    count++;
  }
  // Fallback if we somehow didn't get enough characters (extremely unlikely)
  if (password.length < length) {
    const extra = crypto.randomBytes(length * 5);
    for (let i = 0; i < extra.length && password.length < length; i++) {
      if (extra[i] >= 208) continue;
      password += alphabet[extra[i] % 52];
    }
  }
  return password;
}

// ─── Date helpers for 1-per-day reset enforcement ────────────────────────────
function getUTCDateString(date) {
  return date.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function getISTTimeInfo() {
  // IST = UTC+5:30
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istMs = utcMs + 5.5 * 3600 * 1000;
  const ist = new Date(istMs);
  return {
    hours: ist.getHours(),
    minutes: ist.getMinutes(),
    ist,
  };
}

function isWithinAudioTweetWindow() {
  const { hours, minutes } = getISTTimeInfo();
  const totalMinutes = hours * 60 + minutes;
  const start = 14 * 60; // 2:00 PM = 840
  const end = 19 * 60;   // 7:00 PM = 1140
  return totalMinutes >= start && totalMinutes < end;
}

// ─── Mobile Login Time Window (10:00 AM – 1:00 PM IST) ────────────────────────
function isWithinMobileLoginWindow() {
  const { hours, minutes } = getISTTimeInfo();
  const totalMinutes = hours * 60 + minutes;
  const start = 10 * 60; // 10:00 AM = 600
  const end   = 13 * 60; // 1:00 PM  = 780
  return totalMinutes >= start && totalMinutes < end;
}

// ─── Client Environment Telemetry & Parsing ──────────────────────────────────
function getClientIp(req) {
  let ip =
    req.headers["x-forwarded-for"] ||
    req.socket?.remoteAddress ||
    req.ip ||
    "127.0.0.1";
  if (typeof ip === "string") {
    if (ip.includes(",")) ip = ip.split(",")[0].trim();
    if (ip === "::1" || ip === "::ffff:127.0.0.1") ip = "127.0.0.1";
    if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");
  }
  return ip;
}

function detectClientEnvironment(req, clientData = {}) {
  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = clientData.ipAddress || getClientIp(req);

  let browser = clientData.browser;
  let os = clientData.os;
  let deviceCategory = clientData.deviceCategory;

  // Fallback / Parse from User-Agent if not explicitly provided
  if (!browser || browser === "Unknown") {
    if (/Edg|Edge|MSIE|Trident/i.test(userAgent)) {
      browser = "Microsoft Edge";
    } else if (/Chrome|CriOS/i.test(userAgent) && !/OPR|Brave/i.test(userAgent)) {
      browser = "Google Chrome";
    } else if (/Firefox|FxiOS/i.test(userAgent)) {
      browser = "Mozilla Firefox";
    } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
      browser = "Safari";
    } else if (/OPR|Opera/i.test(userAgent)) {
      browser = "Opera";
    } else {
      browser = "Chrome Compatible Browser";
    }
  }

  if (!os || os === "Unknown") {
    if (/Windows/i.test(userAgent)) os = "Windows";
    else if (/iPhone|iPad|iPod/i.test(userAgent)) os = "iOS";
    else if (/Android/i.test(userAgent)) os = "Android";
    else if (/Macintosh|Mac OS/i.test(userAgent)) os = "macOS";
    else if (/Linux/i.test(userAgent)) os = "Linux";
    else os = "Desktop OS";
  }

  if (!deviceCategory || !["desktop", "laptop", "mobile"].includes(deviceCategory)) {
    if (/Mobile|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      deviceCategory = "mobile";
    } else {
      deviceCategory = "desktop";
    }
  }

  const isMicrosoftBrowser =
    /Microsoft|Edge|Edg|MSIE|Trident/i.test(browser) ||
    /Edg|Edge|MSIE|Trident/i.test(userAgent);

  const isChrome =
    (/Chrome/i.test(browser) || /Chrome|CriOS/i.test(userAgent)) &&
    !isMicrosoftBrowser &&
    !/OPR|Opera/i.test(browser) &&
    !/OPR|Opera/i.test(userAgent);

  const isMobile =
    deviceCategory === "mobile" ||
    /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);

  return {
    browser,
    os,
    deviceCategory: isMobile ? "mobile" : deviceCategory,
    ipAddress,
    isMicrosoftBrowser,
    isChrome,
    isMobile,
  };
}

async function recordLoginHistory({ user, email, env, status, reason = "" }) {
  try {
    await LoginHistory.create({
      user: user?._id || user || null,
      email: (email || user?.email || "").toLowerCase(),
      browser: env?.browser || "Unknown",
      os: env?.os || "Unknown",
      deviceCategory: env?.deviceCategory || "desktop",
      ipAddress: env?.ipAddress || "127.0.0.1",
      status: status || "success",
      reason: reason || "",
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("Failed to record login history:", err.message);
  }
}



// ─────────────────────────────────────────────────────────────────────────────
// EXISTING ROUTES (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({
    message: "Twiller backend is running successfully",
    status: "online",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(isDbConnected ? 200 : 503).json({
    server: "ok",
    database: isDbConnected ? "connected" : "disconnected",
    dbState: mongoose.connection.readyState,
  });
});

// Register
app.post("/register", async (req, res) => {
  try {
    const env = detectClientEnvironment(req, req.body);
    if (env.isMobile && !isWithinMobileLoginWindow()) {
      const { ist } = getISTTimeInfo();
      await recordLoginHistory({
        email: req.body.email,
        env,
        status: "blocked",
        reason: "Mobile registration attempt blocked outside 10:00 AM - 1:00 PM IST window",
      });
      return res.status(403).json({
        error: "Mobile access is only allowed between 10:00 AM and 1:00 PM IST.",
        blocked: true,
        currentIST: ist.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }),
      });
    }

    const existinguser = await User.findOne({ email: req.body.email });
    if (existinguser) {
      await recordLoginHistory({
        user: existinguser,
        email: existinguser.email,
        env,
        status: "success",
        reason: "User Login",
      });
      return res.status(200).send(existinguser);
    }
    const newUser = new User(req.body);
    await newUser.save();
    await recordLoginHistory({
      user: newUser,
      email: newUser.email,
      env,
      status: "success",
      reason: "Account Registration & Initial Sign In",
    });
    return res.status(201).send(newUser);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// Image Upload (avatars, covers, tweet images)
app.post("/upload/image", imageUpload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }
    const host = req.get("host") || `localhost:${PORT}`;
    const protocol = req.protocol || "http";
    const fileUrl = `${protocol}://${host}/uploads/images/${req.file.filename}`;
    return res.status(200).json({
      url: fileUrl,
      filename: req.file.filename,
      relativeUrl: `/uploads/images/${req.file.filename}`,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({ error: error.message || "Image upload failed" });
  }
});

// Logged-in user
app.get("/loggedinuser", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).send({ error: "Email required" });
    }
    const decodedEmail = decodeURIComponent(email).trim();
    const emailRegex = new RegExp("^" + decodedEmail.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + "$", "i");
    const user = await User.findOne({ email: emailRegex });
    return res.status(200).send(user);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// Update Profile
app.patch("/userupdate/:email", async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ error: "Email or identifier is required" });
    }
    const decodedEmail = decodeURIComponent(email).trim();
    const emailRegex = new RegExp("^" + decodedEmail.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + "$", "i");

    // Don't allow changing email to an existing email of another user
    const updateData = { ...req.body };
    delete updateData._id;

    let updated = await User.findOneAndUpdate(
      { email: emailRegex },
      { $set: updateData },
      { new: true, upsert: false }
    );

    // Fallback: search by _id if ObjectId
    if (!updated && mongoose.Types.ObjectId.isValid(decodedEmail)) {
      updated = await User.findByIdAndUpdate(
        decodedEmail,
        { $set: updateData },
        { new: true, upsert: false }
      );
    }

    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).send(updated);
  } catch (error) {
    console.error("User update error:", error);
    return res.status(400).send({ error: error.message });
  }
});

// POST text tweet (with subscription tweet limit enforcement)
app.post("/post", async (req, res) => {
  try {
    const { author } = req.body;
    if (!author) {
      return res.status(400).send({ error: "Author is required." });
    }

    // Check subscription tweet limit
    const sub = await getOrCreateSubscription(author);
    if (sub.tweetLimit !== -1 && sub.tweetsUsed >= sub.tweetLimit) {
      const planConfig = SUBSCRIPTION_PLANS[sub.plan];
      return res.status(403).json({
        error: "Tweet limit reached",
        message: `You've used all ${sub.tweetLimit} tweet${sub.tweetLimit === 1 ? "" : "s"} for your ${planConfig.name} plan this month. Upgrade to post more!`,
        tweetsUsed: sub.tweetsUsed,
        tweetLimit: sub.tweetLimit,
        currentPlan: sub.plan,
      });
    }

    const tweet = new Tweet(req.body);
    await tweet.save();

    // Increment tweets used
    sub.tweetsUsed += 1;
    await sub.save();

    return res.status(201).send(tweet);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// GET all tweets
app.get("/post", async (req, res) => {
  try {
    const tweet = await Tweet.find().sort({ timestamp: -1 }).populate("author");
    return res.status(200).send(tweet);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// LIKE TWEET
app.post("/like/:tweetid", async (req, res) => {
  try {
    const { userId } = req.body;
    const tweet = await Tweet.findById(req.params.tweetid).populate("author");
    if (!tweet.likedBy.includes(userId)) {
      tweet.likes += 1;
      tweet.likedBy.push(userId);
      await tweet.save();
      // Create notification (don't notify self)
      if (tweet.author && tweet.author._id.toString() !== userId) {
        await Notification.create({
          recipient: tweet.author._id,
          sender: userId,
          type: "like",
          tweet: tweet._id,
        }).catch(() => {});
      }
    }
    res.send(tweet);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// RETWEET
app.post("/retweet/:tweetid", async (req, res) => {
  try {
    const { userId } = req.body;
    const tweet = await Tweet.findById(req.params.tweetid).populate("author");
    if (!tweet.retweetedBy.includes(userId)) {
      tweet.retweets += 1;
      tweet.retweetedBy.push(userId);
      await tweet.save();
      // Create notification (don't notify self)
      if (tweet.author && tweet.author._id.toString() !== userId) {
        await Notification.create({
          recipient: tweet.author._id,
          sender: userId,
          type: "retweet",
          tweet: tweet._id,
        }).catch(() => {});
      }
    }
    res.send(tweet);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO TWEET ROUTES (new)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /audio-tweet/send-otp
 * Body: { email }
 * Generates a 6-digit OTP and emails it to the user's registered address.
 */
app.post("/audio-tweet/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    // Verify user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "No account found with this email." });
    }

    // Invalidate any existing unused OTPs for this email
    await Otp.updateMany(
      { email: email.toLowerCase(), used: false },
      { $set: { used: true } }
    );

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await Otp.create({
      email: email.toLowerCase(),
      otp,
      expiresAt,
      used: false,
      verified: false,
    });

    try {
      await transporter.sendMail({
        from: `"Twiller" <${emailUser}>`,
        to: email,
        subject: "Your Audio Tweet OTP — Twiller",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;background:#000;color:#fff;padding:32px;border-radius:12px;border:1px solid #333;">
            <div style="text-align:center;margin-bottom:24px;">
              <span style="font-size:32px;font-weight:900;color:#fff;">𝕏</span>
              <p style="color:#71767b;margin:4px 0 0;">Twiller</p>
            </div>
            <h2 style="font-size:20px;margin:0 0 8px;">Audio Tweet Verification</h2>
            <p style="color:#71767b;margin:0 0 24px;">Use the OTP below to verify your Audio Tweet. It expires in <strong style="color:#fff;">10 minutes</strong> and can only be used once.</p>
            <div style="background:#111;border:1px solid #333;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
              <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#1d9bf0;">${otp}</span>
            </div>
            <p style="color:#71767b;font-size:13px;">If you did not request this OTP, please ignore this email.</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.warn("Audio OTP mail error (proceeding):", mailErr.message);
    }

    return res.status(200).json({ message: "OTP sent to your registered email.", otp });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({ error: "Failed to send OTP. Please try again." });
  }
});

/**
 * POST /audio-tweet/verify-otp
 * Body: { email, otp }
 * Verifies the OTP. Marks it as verified so the upload can proceed.
 */
app.post("/audio-tweet/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required." });
    }

    const record = await Otp.findOne({
      email: email.toLowerCase(),
      used: false,
      verified: false,
    }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({ error: "No active OTP found. Please request a new one." });
    }

    if (new Date() > record.expiresAt) {
      record.used = true;
      await record.save();
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ error: "Invalid OTP. Please try again." });
    }

    // Mark as verified (not yet used — will be consumed when tweet is posted)
    record.verified = true;
    await record.save();

    return res.status(200).json({
      message: "OTP verified successfully. You may now post your Audio Tweet.",
      otpId: record._id.toString(),
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ error: "Verification failed. Please try again." });
  }
});

/**
 * POST /audio-tweet/post
 * Multipart form data: audio file + fields (authorId, email, otpId, content)
 * Full server-side validation: OTP, time window, file size, duration, format.
 */
app.post("/audio-tweet/post", upload.single("audio"), async (req, res) => {
  try {
    const { authorId, email, otpId, content } = req.body;

    // 1. Auth check — user must exist
    if (!authorId || !email) {
      return res.status(401).json({ error: "Authentication required." });
    }
    const user = await User.findById(authorId);
    if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    // 2. OTP verification check
    if (!otpId) {
      return res.status(403).json({ error: "OTP verification required before posting an Audio Tweet." });
    }
    const otpRecord = await Otp.findById(otpId);
    if (!otpRecord) {
      return res.status(403).json({ error: "Invalid OTP session. Please verify again." });
    }
    if (otpRecord.email !== email.toLowerCase()) {
      return res.status(403).json({ error: "OTP email mismatch. Please verify again." });
    }
    if (!otpRecord.verified || otpRecord.used) {
      return res.status(403).json({ error: "OTP not verified or already used. Please verify again." });
    }
    if (new Date() > otpRecord.expiresAt) {
      return res.status(403).json({ error: "OTP has expired. Please request a new one." });
    }

    // 3. IST time window check (2:00 PM – 7:00 PM IST)
    if (!isWithinAudioTweetWindow()) {
      const { ist } = getISTTimeInfo();
      return res.status(403).json({
        error: "Audio Tweets are available only between 2:00 PM and 7:00 PM IST.",
        currentIST: ist.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }),
      });
    }

    // 4. File present
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded." });
    }

    // 5. File size (multer already rejects >100MB, but double-check)
    if (req.file.size > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({ error: "Audio file size cannot exceed 100 MB." });
    }

    // 6. MIME type validation
    if (!SUPPORTED_MIME_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: "Unsupported audio format. Supported: MP3, WAV, M4A, OGG, WebM.",
      });
    }

    // 7. Duration validation via music-metadata
    let durationSeconds = 0;
    try {
      const metadata = await parseBuffer(
        req.file.buffer,
        { mimeType: req.file.mimetype },
        { duration: true }
      );
      durationSeconds = metadata.format.duration || 0;
    } catch (metaErr) {
      console.warn("Could not parse audio duration:", metaErr.message);
      // For webm/ogg from MediaRecorder, duration may be unknown — allow but log
      durationSeconds = 0;
    }

    if (durationSeconds > 0 && durationSeconds > MAX_DURATION_SECONDS) {
      return res.status(400).json({
        error: `Audio duration cannot exceed 5 minutes. Your audio is ${Math.ceil(durationSeconds / 60)} minutes long.`,
      });
    }

    // 8. Save file to disk
    const ext = req.file.originalname.split(".").pop() || "webm";
    const filename = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, req.file.buffer);

    const audioUrl = `/audio/${filename}`;

    // 9. Mark OTP as used (consumed)
    otpRecord.used = true;
    await otpRecord.save();

    // 10. Create the tweet
    const tweet = new Tweet({
      author: authorId,
      content: content || "🎵 Audio Tweet",
      tweetType: "audio",
      audio: {
        url: audioUrl,
        duration: Math.round(durationSeconds),
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
    await tweet.save();

    // Populate author for immediate frontend use
    await tweet.populate("author");

    return res.status(201).json(tweet);
  } catch (error) {
    console.error("Audio tweet post error:", error);

    // Multer file-size error
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Audio file size cannot exceed 100 MB." });
    }
    // Multer file-filter error
    if (error.message && error.message.startsWith("Unsupported audio format")) {
      return res.status(400).json({ error: "Unsupported audio format. Supported: MP3, WAV, M4A, OGG, WebM." });
    }

    return res.status(500).json({ error: "Failed to post audio tweet. Please try again." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// LANGUAGE SWITCH OTP ROUTES
// ─────────────────────────────────────────────────────────────────────────────

const SUPPORTED_LANGUAGES = {
  en: "English",
  es: "Spanish",
  hi: "Hindi",
  pt: "Portuguese",
  zh: "Chinese",
  fr: "French",
};

/**
 * POST /language/send-otp
 * Body: { email, targetLanguage }
 * Sends OTP for language change verification.
 * French → OTP sent to email; others → OTP sent to email (simulating mobile).
 */
app.post("/language/send-otp", async (req, res) => {
  try {
    const { email, targetLanguage } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });
    if (!targetLanguage || !SUPPORTED_LANGUAGES[targetLanguage]) {
      return res.status(400).json({ error: "Invalid target language." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "No account found with this email." });
    }

    if (user.language === targetLanguage) {
      return res.status(400).json({ error: `Your language is already set to ${SUPPORTED_LANGUAGES[targetLanguage]}.` });
    }

    // For non-French languages, check if user has a phone number
    if (targetLanguage !== "fr" && !user.phone) {
      return res.status(400).json({
        error: "Phone number required for language verification.",
        requiresPhone: true,
      });
    }

    // Rate limit: 1 OTP per 60 seconds
    const recent = await Otp.findOne({
      email: email.toLowerCase(),
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
    }).sort({ createdAt: -1 });

    if (recent) {
      const secondsLeft = Math.ceil((recent.createdAt.getTime() + 60000 - Date.now()) / 1000);
      return res.status(429).json({
        error: `Please wait ${secondsLeft} seconds before requesting a new OTP.`,
        secondsLeft,
      });
    }

    // Invalidate previous unused OTPs
    await Otp.updateMany(
      { email: email.toLowerCase(), used: false },
      { $set: { used: true } }
    );

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.create({
      email: email.toLowerCase(),
      otp,
      expiresAt,
      used: false,
      verified: false,
    });

    const isFrench = targetLanguage === "fr";
    const langName = SUPPORTED_LANGUAGES[targetLanguage];

    await transporter.sendMail({
      from: `"Twiller" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Language Change Verification — ${langName} — Twiller`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;background:#000;color:#fff;padding:32px;border-radius:12px;border:1px solid #333;">
          <div style="text-align:center;margin-bottom:24px;">
            <span style="font-size:36px;font-weight:900;color:#fff;">𝕏</span>
            <p style="color:#71767b;margin:4px 0 0;font-size:13px;">Twiller</p>
          </div>
          <h2 style="font-size:20px;margin:0 0 8px;">🌐 Language Change Verification</h2>
          <p style="color:#71767b;margin:0 0 24px;font-size:14px;">
            Hi <strong style="color:#fff;">${user.displayName}</strong>, you requested to change your language to
            <strong style="color:#1d9bf0;">${langName}</strong>.
            Use the OTP below to confirm. It expires in <strong style="color:#fff;">10 minutes</strong>.
          </p>
          <div style="background:#111;border:1px solid #333;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
            <span style="font-size:42px;font-weight:700;letter-spacing:14px;color:#1d9bf0;">${otp}</span>
          </div>
          <p style="color:#71767b;font-size:12px;">
            ${isFrench ? "This OTP was sent to your registered email address." : "This OTP was sent to verify your identity via your registered mobile number."}
          </p>
          <p style="color:#71767b;font-size:12px;">If you did not request this change, please ignore this email.</p>
        </div>
      `,
    });

    return res.status(200).json({
      message: isFrench
        ? "OTP sent to your registered email address."
        : "OTP sent to your registered mobile number.",
      method: isFrench ? "email" : "mobile",
    });
  } catch (error) {
    console.error("Language OTP send error:", error);
    return res.status(500).json({ error: "Failed to send OTP. Please try again." });
  }
});

/**
 * POST /language/verify-otp
 * Body: { email, otp, targetLanguage }
 * Verifies OTP and updates user's language preference.
 */
app.post("/language/verify-otp", async (req, res) => {
  try {
    const { email, otp, targetLanguage } = req.body;
    if (!email || !otp || !targetLanguage) {
      return res.status(400).json({ error: "Email, OTP, and target language are required." });
    }

    if (!SUPPORTED_LANGUAGES[targetLanguage]) {
      return res.status(400).json({ error: "Invalid target language." });
    }

    const record = await Otp.findOne({
      email: email.toLowerCase(),
      used: false,
    }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({ error: "No active OTP found. Please request a new one." });
    }

    if (new Date() > record.expiresAt) {
      record.used = true;
      await record.save();
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ error: "Invalid OTP. Please try again." });
    }

    // Consume OTP
    record.used = true;
    record.verified = true;
    await record.save();

    // Update user's language
    const updatedUser = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: { language: targetLanguage } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json({
      message: `Language changed to ${SUPPORTED_LANGUAGES[targetLanguage]} successfully.`,
      user: updatedUser,
      language: targetLanguage,
    });
  } catch (error) {
    console.error("Language OTP verify error:", error);
    return res.status(500).json({ error: "Verification failed. Please try again." });
  }
});

/**
 * PATCH /user/phone
 * Body: { email, phone }
 * Saves/updates user's phone number.
 */
app.patch("/user/phone", async (req, res) => {
  try {
    const { email, phone } = req.body;
    if (!email || !phone) {
      return res.status(400).json({ error: "Email and phone number are required." });
    }

    // Basic phone validation (allow +, digits, spaces, hyphens)
    const phoneClean = phone.replace(/[\s\-()]/g, "");
    if (!/^\+?\d{7,15}$/.test(phoneClean)) {
      return res.status(400).json({ error: "Please enter a valid phone number." });
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: { phone: phoneClean } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json({ message: "Phone number updated.", user: updatedUser });
  } catch (error) {
    console.error("Phone update error:", error);
    return res.status(500).json({ error: "Failed to update phone number." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /subscription/plans
 * Returns all available subscription plans with pricing.
 */
app.get("/subscription/plans", (req, res) => {
  const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
    id: key,
    ...plan,
    priceFormatted: plan.price === 0 ? "Free" : `₹${plan.price}/month`,
    tweetLimitDisplay: plan.tweetLimit === -1 ? "Unlimited" : `${plan.tweetLimit} tweets`,
  }));
  return res.json(plans);
});

/**
 * GET /subscription/status/:userId
 * Returns the user's current subscription status.
 */
app.get("/subscription/status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const sub = await getOrCreateSubscription(userId);
    const planConfig = SUBSCRIPTION_PLANS[sub.plan];

    return res.json({
      plan: sub.plan,
      planName: planConfig.name,
      tweetsUsed: sub.tweetsUsed,
      tweetLimit: sub.tweetLimit,
      tweetsRemaining: sub.tweetLimit === -1 ? -1 : Math.max(0, sub.tweetLimit - sub.tweetsUsed),
      billingCycleStart: sub.billingCycleStart,
      billingCycleEnd: sub.billingCycleEnd,
      status: sub.status,
      subscriptionId: sub._id,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /subscription/create-order
 * Body: { userId, plan }
 * Creates a Razorpay order. Enforces 10:00-11:00 AM IST payment window.
 */
app.post("/subscription/create-order", async (req, res) => {
  try {
    const { userId, plan } = req.body;
    if (!userId || !plan) {
      return res.status(400).json({ error: "userId and plan are required." });
    }

    if (!SUBSCRIPTION_PLANS[plan] || plan === "free") {
      return res.status(400).json({ error: "Invalid plan selected." });
    }

    // Time window enforcement
    if (!isWithinPaymentWindow()) {
      const { ist } = getISTTimeInfo();
      return res.status(403).json({
        error: "Payments are only allowed between 10:00 AM and 11:00 AM IST.",
        currentIST: ist.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }),
        windowStart: "10:00 AM IST",
        windowEnd: "11:00 AM IST",
      });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const planConfig = SUBSCRIPTION_PLANS[plan];

    const order = await razorpay.orders.create({
      amount: planConfig.priceInPaise,
      currency: "INR",
      receipt: `twiller_${plan}_${userId}_${Date.now()}`,
      notes: {
        userId,
        plan,
        userEmail: user.email,
      },
    });

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan,
      planName: planConfig.name,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({ error: "Failed to create payment order." });
  }
});

/**
 * POST /subscription/verify-payment
 * Body: { userId, plan, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Verifies Razorpay payment, activates subscription, sends invoice email.
 */
app.post("/subscription/verify-payment", async (req, res) => {
  try {
    const { userId, plan, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!userId || !plan || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "All payment fields are required." });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed. Invalid signature." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const planConfig = SUBSCRIPTION_PLANS[plan];

    // Expire any existing active subscription
    await Subscription.updateMany(
      { user: userId, status: "active" },
      { $set: { status: "expired" } }
    );

    // Create new subscription
    const now = new Date();
    const billingEnd = new Date(now);
    billingEnd.setMonth(billingEnd.getMonth() + 1);

    const subscription = await Subscription.create({
      user: userId,
      plan,
      tweetLimit: planConfig.tweetLimit,
      tweetsUsed: 0,
      amount: planConfig.priceInPaise,
      billingCycleStart: now,
      billingCycleEnd: billingEnd,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: "active",
    });

    // Update user
    user.subscription = subscription._id;
    user.currentPlan = plan;
    await user.save();

    // Send invoice email
    const invoiceDate = now.toLocaleDateString("en-IN", {
      year: "numeric", month: "long", day: "numeric",
    });
    const nextBillingDate = billingEnd.toLocaleDateString("en-IN", {
      year: "numeric", month: "long", day: "numeric",
    });

    const planColors = {
      bronze: { bg: "#CD7F32", gradient: "linear-gradient(135deg, #CD7F32, #A0522D)" },
      silver: { bg: "#C0C0C0", gradient: "linear-gradient(135deg, #C0C0C0, #A8A9AD)" },
      gold:   { bg: "#FFD700", gradient: "linear-gradient(135deg, #FFD700, #FFA500)" },
    };
    const colors = planColors[plan] || planColors.bronze;

    try {
      await transporter.sendMail({
        from: `"Twiller" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `Your ${planConfig.name} Plan Invoice — Twiller`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#000;color:#fff;border-radius:16px;border:1px solid #333;overflow:hidden;">
            <!-- Header -->
            <div style="background:${colors.gradient};padding:32px;text-align:center;">
              <span style="font-size:36px;font-weight:900;color:#000;">𝕏</span>
              <h1 style="font-size:24px;font-weight:800;color:#000;margin:8px 0 0;">Payment Successful!</h1>
            </div>

            <div style="padding:32px;">
              <!-- Greeting -->
              <p style="color:#e7e9ea;font-size:16px;margin:0 0 24px;">Hi <strong>${user.displayName}</strong>,</p>
              <p style="color:#71767b;font-size:14px;margin:0 0 24px;line-height:1.6;">Thank you for subscribing to the <strong style="color:${colors.bg};">${planConfig.name} Plan</strong>. Here's your invoice:</p>

              <!-- Invoice Box -->
              <div style="background:#111;border:1px solid #333;border-radius:12px;padding:24px;margin-bottom:24px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="color:#71767b;padding:8px 0;font-size:13px;">Plan</td><td style="color:#fff;text-align:right;padding:8px 0;font-weight:700;font-size:14px;">${planConfig.name}</td></tr>
                  <tr><td style="color:#71767b;padding:8px 0;font-size:13px;">Amount</td><td style="color:#fff;text-align:right;padding:8px 0;font-weight:700;font-size:14px;">₹${planConfig.price}.00</td></tr>
                  <tr><td style="color:#71767b;padding:8px 0;font-size:13px;">Tweet Limit</td><td style="color:#fff;text-align:right;padding:8px 0;font-weight:700;font-size:14px;">${planConfig.tweetLimit === -1 ? "Unlimited" : planConfig.tweetLimit + " tweets/month"}</td></tr>
                  <tr style="border-top:1px solid #333;"><td style="color:#71767b;padding:12px 0 8px;font-size:13px;">Transaction ID</td><td style="color:#1d9bf0;text-align:right;padding:12px 0 8px;font-size:12px;font-family:monospace;">${razorpay_payment_id}</td></tr>
                  <tr><td style="color:#71767b;padding:8px 0;font-size:13px;">Payment Date</td><td style="color:#fff;text-align:right;padding:8px 0;font-size:14px;">${invoiceDate}</td></tr>
                  <tr><td style="color:#71767b;padding:8px 0;font-size:13px;">Next Billing Date</td><td style="color:#fff;text-align:right;padding:8px 0;font-size:14px;">${nextBillingDate}</td></tr>
                </table>
              </div>

              <p style="color:#71767b;font-size:12px;margin:0;text-align:center;">If you have questions, contact us at ${process.env.EMAIL_USER}</p>
            </div>

            <!-- Footer -->
            <div style="background:#111;padding:16px;text-align:center;border-top:1px solid #333;">
              <p style="color:#71767b;font-size:11px;margin:0;">© ${new Date().getFullYear()} Twiller. All rights reserved.</p>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Invoice email error:", emailErr.message);
      // Don't fail the whole request if email fails
    }

    return res.json({
      success: true,
      message: `${planConfig.name} plan activated successfully! Invoice sent to ${user.email}.`,
      subscription: {
        id: subscription._id,
        plan: subscription.plan,
        tweetLimit: subscription.tweetLimit,
        billingCycleStart: subscription.billingCycleStart,
        billingCycleEnd: subscription.billingCycleEnd,
        status: subscription.status,
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({ error: "Payment verification failed." });
  }
});

/**
 * GET /subscription/history/:userId
 * Returns payment/subscription history for a user.
 */
app.get("/subscription/history/:userId", async (req, res) => {
  try {
    const subs = await Subscription.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json(subs.map(s => ({
      ...s,
      planName: SUBSCRIPTION_PLANS[s.plan]?.name || s.plan,
      priceFormatted: SUBSCRIPTION_PLANS[s.plan]?.price ? `₹${SUBSCRIPTION_PLANS[s.plan].price}` : "Free",
    })));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN OTP ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /auth/send-login-otp
 * Body: { email, browser, os, deviceCategory, ipAddress }
 * Rate-limited: 1 OTP per 60 seconds per email.
 * Checks mobile time window (10 AM - 1 PM IST), generates OTP, emails it.
 */
app.post("/auth/send-login-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });

    const env = detectClientEnvironment(req, req.body);

    // ── Mobile Time Window Enforcement (10:00 AM – 1:00 PM IST) ─────────────
    if (env.isMobile && !isWithinMobileLoginWindow()) {
      const { ist } = getISTTimeInfo();
      await recordLoginHistory({
        email,
        env,
        status: "blocked",
        reason: "Mobile login attempt blocked outside 10:00 AM - 1:00 PM IST window",
      });
      return res.status(403).json({
        error: "Mobile access is only allowed between 10:00 AM and 1:00 PM IST.",
        blocked: true,
        currentIST: ist.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }),
        allowedWindow: "10:00 AM – 1:00 PM IST",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        error: "No account found with this email. Please sign up first.",
      });
    }

    // Rate limit: check if an OTP was sent in the last 60 seconds
    const recent = await Otp.findOne({
      email: email.toLowerCase(),
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
    }).sort({ createdAt: -1 });

    if (recent) {
      const secondsLeft = Math.ceil(
        (recent.createdAt.getTime() + 60000 - Date.now()) / 1000
      );
      return res.status(429).json({
        error: `Please wait ${secondsLeft} seconds before requesting a new OTP.`,
        secondsLeft,
      });
    }

    // Invalidate any previous unused OTPs
    await Otp.updateMany(
      { email: email.toLowerCase(), used: false },
      { $set: { used: true } }
    );

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await Otp.create({
      email: email.toLowerCase(),
      otp,
      expiresAt,
      used: false,
      verified: false,
    });

    const isChrome = env.isChrome;

    try {
      await transporter.sendMail({
        from: `"Twiller" <${emailUser}>`,
        to: email,
        subject: isChrome
          ? "Your Google Chrome Login Verification OTP — Twiller"
          : "Your Login OTP — Twiller",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;background:#000;color:#fff;padding:32px;border-radius:12px;border:1px solid #333;">
            <div style="text-align:center;margin-bottom:24px;">
              <span style="font-size:36px;font-weight:900;color:#fff;">𝕏</span>
              <p style="color:#71767b;margin:4px 0 0;font-size:13px;">Twiller</p>
            </div>
            <h2 style="font-size:20px;margin:0 0 8px;">
              ${isChrome ? "🌐 Google Chrome Security Verification" : "Sign in to Twiller"}
            </h2>
            <p style="color:#71767b;margin:0 0 24px;font-size:14px;">
              Hi <strong style="color:#fff;">${user.displayName}</strong>, ${
                isChrome
                  ? "you are logging in from Google Chrome. Use the OTP below to verify your identity."
                  : "use the code below to sign in."
              }
              It expires in <strong style="color:#fff;">10 minutes</strong> and can only be used once.
            </p>
            <div style="background:#111;border:1px solid #333;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
              <span style="font-size:42px;font-weight:700;letter-spacing:14px;color:#1d9bf0;">${otp}</span>
            </div>
            <p style="color:#71767b;font-size:12px;">If you did not request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.warn("Login OTP mail error (proceeding with generated OTP):", mailErr.message);
    }

    return res.status(200).json({
      message: isChrome
        ? "OTP sent to your email (Google Chrome verification required)."
        : "OTP sent to your email.",
      email: user.email,
      isChrome,
      otp,
    });
  } catch (error) {
    console.error("Login OTP send error:", error);
    return res.status(500).json({ error: "Failed to send OTP. Please try again." });
  }
});

/**
 * POST /auth/verify-login-otp
 * Body: { email, otp, browser, os, deviceCategory, ipAddress }
 * Verifies the OTP, enforces mobile time window, records login history, and returns user object.
 */
app.post("/auth/verify-login-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required." });
    }

    const env = detectClientEnvironment(req, req.body);

    // ── Mobile Time Window Check (10:00 AM – 1:00 PM IST) ─────────────────────
    if (env.isMobile && !isWithinMobileLoginWindow()) {
      const { ist } = getISTTimeInfo();
      await recordLoginHistory({
        email,
        env,
        status: "blocked",
        reason: "Mobile login attempt blocked outside 10:00 AM - 1:00 PM IST window",
      });
      return res.status(403).json({
        error: "Mobile access is only allowed between 10:00 AM and 1:00 PM IST.",
        blocked: true,
        currentIST: ist.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }),
      });
    }

    const record = await Otp.findOne({
      email: email.toLowerCase(),
      used: false,
    }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({ error: "No active OTP found. Please request a new one." });
    }

    if (new Date() > record.expiresAt) {
      record.used = true;
      await record.save();
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ error: "Invalid OTP. Please check and try again." });
    }

    // Consume the OTP
    record.used = true;
    record.verified = true;
    await record.save();

    // Fetch and return the real user object
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Record login in history
    await recordLoginHistory({
      user,
      email: user.email,
      env,
      status: "success",
      reason: env.isChrome
        ? "Google Chrome Identity OTP Verified"
        : "Email OTP Verification",
    });

    return res.status(200).json({ user, message: "Login successful." });
  } catch (error) {
    console.error("Login OTP verify error:", error);
    return res.status(500).json({ error: "Verification failed. Please try again." });
  }
});

/**
 * POST /auth/direct-login
 * Body: { email, browser, os, deviceCategory, ipAddress }
 *
 * For Microsoft browsers (Edge/IE): allows logging in without additional authentication.
 */
app.post("/auth/direct-login", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });

    const env = detectClientEnvironment(req, req.body);

    // ── Mobile Time Window Check (10:00 AM – 1:00 PM IST) ─────────────────────
    if (env.isMobile && !isWithinMobileLoginWindow()) {
      const { ist } = getISTTimeInfo();
      await recordLoginHistory({
        email,
        env,
        status: "blocked",
        reason: "Mobile login attempt blocked outside 10:00 AM - 1:00 PM IST window",
      });
      return res.status(403).json({
        error: "Mobile access is only allowed between 10:00 AM and 1:00 PM IST.",
        blocked: true,
        currentIST: ist.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }),
      });
    }

    // Check that client is accessing from a Microsoft Browser
    if (!env.isMicrosoftBrowser) {
      return res.status(400).json({
        error:
          "Direct login without additional authentication is only allowed for Microsoft browsers (Edge/IE).",
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({
        error: "No account found with this email. Please sign up first.",
      });
    }

    // Record login in history
    await recordLoginHistory({
      user,
      email: user.email,
      env,
      status: "success",
      reason: "Microsoft Browser Direct Login (No additional auth required)",
    });

    return res.status(200).json({
      user,
      message: "Direct login successful via Microsoft browser.",
    });
  } catch (error) {
    console.error("Direct login error:", error);
    return res.status(500).json({ error: "Direct login failed. Please try again." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SIGNUP OTP ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /auth/check-username?username=xxx
 * Returns { available: true/false }
 */
app.get("/auth/check-username", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: "Username required." });
    const existing = await User.findOne({ username: username.toLowerCase() });
    return res.status(200).json({ available: !existing });
  } catch (error) {
    return res.status(500).json({ error: "Could not check username." });
  }
});

/**
 * POST /auth/send-signup-otp
 * Body: { email, username, displayName }
 * Validates that email + username are both available, then emails an OTP.
 */
app.post("/auth/send-signup-otp", async (req, res) => {
  try {
    const { email, username, displayName } = req.body;
    if (!email || !username || !displayName) {
      return res.status(400).json({ error: "Email, username, and display name are required." });
    }

    // Check email uniqueness
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ error: "An account with this email already exists. Please sign in instead." });
    }

    // Check username uniqueness
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return res.status(409).json({ error: "This username is already taken. Please choose another." });
    }

    // Rate limit
    const recent = await Otp.findOne({
      email: email.toLowerCase(),
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
    }).sort({ createdAt: -1 });

    if (recent) {
      const secondsLeft = Math.ceil((recent.createdAt.getTime() + 60000 - Date.now()) / 1000);
      return res.status(429).json({
        error: `Please wait ${secondsLeft} seconds before requesting a new code.`,
        secondsLeft,
      });
    }

    // Invalidate old OTPs for this email
    await Otp.updateMany({ email: email.toLowerCase(), used: false }, { $set: { used: true } });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.create({ email: email.toLowerCase(), otp, expiresAt, used: false, verified: false });

    try {
      await transporter.sendMail({
        from: `"Twiller" <${emailUser}>`,
        to: email,
        subject: "Verify your email — Twiller",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;background:#000;color:#fff;padding:32px;border-radius:12px;border:1px solid #333;">
            <div style="text-align:center;margin-bottom:24px;">
              <span style="font-size:36px;font-weight:900;">𝕏</span>
              <p style="color:#71767b;margin:4px 0 0;font-size:13px;">Twiller</p>
            </div>
            <h2 style="font-size:20px;margin:0 0 8px;">Verify your email address</h2>
            <p style="color:#71767b;margin:0 0 24px;font-size:14px;">
              Hi <strong style="color:#fff;">${displayName}</strong>, use the code below to verify your email and complete your Twiller sign-up.
              It expires in <strong style="color:#fff;">10 minutes</strong>.
            </p>
            <div style="background:#111;border:1px solid #333;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
              <span style="font-size:42px;font-weight:700;letter-spacing:14px;color:#1d9bf0;">${otp}</span>
            </div>
            <p style="color:#71767b;font-size:12px;">If you didn't create a Twiller account, you can safely ignore this email.</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.warn("Nodemailer send error (proceeding with generated OTP):", mailErr.message);
    }

    return res.status(200).json({
      message: "Verification code sent to your email.",
      otp,
    });
  } catch (error) {
    console.error("Signup OTP send error:", error);
    return res.status(500).json({ error: "Failed to send verification code. Please try again." });
  }
});

/**
 * POST /auth/complete-signup
 * Body: { email, otp, username, displayName, browser, os, deviceCategory, ipAddress }
 * Verifies OTP, creates the user account, returns the user, and records login history.
 */
app.post("/auth/complete-signup", async (req, res) => {
  try {
    const { email, otp, username, displayName } = req.body;
    if (!email || !otp || !username || !displayName) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const env = detectClientEnvironment(req, req.body);

    // ── Mobile Time Window Check (10:00 AM – 1:00 PM IST) ─────────────────────
    if (env.isMobile && !isWithinMobileLoginWindow()) {
      const { ist } = getISTTimeInfo();
      await recordLoginHistory({
        email,
        env,
        status: "blocked",
        reason: "Mobile signup attempt blocked outside 10:00 AM - 1:00 PM IST window",
      });
      return res.status(403).json({
        error: "Mobile access is only allowed between 10:00 AM and 1:00 PM IST.",
        blocked: true,
        currentIST: ist.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }),
      });
    }

    // Re-check uniqueness (race condition guard)
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return res.status(409).json({ error: "This username is already taken." });
    }

    // Verify OTP
    const record = await Otp.findOne({ email: email.toLowerCase(), used: false }).sort({ createdAt: -1 });
    if (!record) {
      return res.status(400).json({ error: "No active code found. Please request a new one." });
    }
    if (new Date() > record.expiresAt) {
      record.used = true;
      await record.save();
      return res.status(400).json({ error: "Code has expired. Please request a new one." });
    }
    if (record.otp !== otp.trim()) {
      return res.status(400).json({ error: "Invalid code. Please check and try again." });
    }

    // Consume OTP
    record.used = true;
    record.verified = true;
    await record.save();

    // Create user
    const autoAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=200&bold=true&format=png`;
    const newUser = new User({
      username: username.toLowerCase(),
      displayName,
      email: email.toLowerCase(),
      avatar: autoAvatar,
      bio: "",
      location: "",
      website: "",
    });
    await newUser.save();

    // Record login in history
    await recordLoginHistory({
      user: newUser,
      email: newUser.email,
      env,
      status: "success",
      reason: "Account Registration & Initial Sign In",
    });

    return res.status(201).json({ user: newUser, message: "Account created successfully." });
  } catch (error) {
    console.error("Complete signup error:", error);
    return res.status(500).json({ error: "Failed to create account. Please try again." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD / ACCOUNT RECOVERY ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /auth/forgot-password
 * Body: { email }
 */
app.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    // ── Input validation ──────────────────────────────────────────────────────
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required." });
    }
    const emailTrimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    // ── Account existence check ───────────────────────────────────────────────
    const user = await User.findOne({ email: emailTrimmed });
    if (!user) {
      return res.status(404).json({ error: "No account found with this email address." });
    }

    // ── One-per-day enforcement (server-side, UTC date comparison) ────────────
    const todayUTC = getUTCDateString(new Date());
    if (user.lastPasswordResetRequest) {
      const lastRequestUTC = getUTCDateString(new Date(user.lastPasswordResetRequest));
      if (todayUTC === lastRequestUTC) {
        return res.status(429).json({
          error: "You can use this option only one time per day.",
        });
      }
    }

    // ── Generate recovery password ────────────────────────────────────────────
    const newPassword = generateRecoveryPassword(14);

    // ── Hash and persist ──────────────────────────────────────────────────────
    const BCRYPT_ROUNDS = 12;
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    user.passwordHash = passwordHash;
    user.lastPasswordResetRequest = new Date();
    await user.save();

    // ── Return the plain password once (never log it) ─────────────────────────
    return res.status(200).json({
      message: "Password reset successful.",
      newPassword,
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    return res.status(500).json({ error: "Password reset failed. Please try again." });
  }
});

/**
 * POST /auth/login-with-password
 * Body: { email, password, browser, os, deviceCategory, ipAddress }
 *
 * Validates password using bcrypt. If logging in via Google Chrome, requires OTP verification.
 */
app.post("/auth/login-with-password", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Input validation ──────────────────────────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const env = detectClientEnvironment(req, req.body);

    // ── Mobile Time Window Check (10:00 AM – 1:00 PM IST) ─────────────────────
    if (env.isMobile && !isWithinMobileLoginWindow()) {
      const { ist } = getISTTimeInfo();
      await recordLoginHistory({
        email,
        env,
        status: "blocked",
        reason: "Mobile login attempt blocked outside 10:00 AM - 1:00 PM IST window",
      });
      return res.status(403).json({
        error: "Mobile access is only allowed between 10:00 AM and 1:00 PM IST.",
        blocked: true,
        currentIST: ist.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }),
      });
    }

    // ── Find user ─────────────────────────────────────────────────────────────
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // ── Check that a recovery password was set ────────────────────────────────
    if (!user.passwordHash) {
      return res.status(401).json({
        error: "No password has been set for this account. Please use OTP login or reset your password first.",
      });
    }

    // ── Verify password ───────────────────────────────────────────────────────
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // ── Google Chrome Environment Check: requires OTP verification ───────────
    if (env.isChrome) {
      // Invalidate existing unused OTPs
      await Otp.updateMany(
        { email: user.email.toLowerCase(), used: false },
        { $set: { used: true } }
      );

      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await Otp.create({
        email: user.email.toLowerCase(),
        otp,
        expiresAt,
        used: false,
        verified: false,
      });

      try {
        await transporter.sendMail({
          from: `"Twiller" <${emailUser}>`,
          to: user.email,
          subject: "Google Chrome Login Verification Code — Twiller",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;background:#000;color:#fff;padding:32px;border-radius:12px;border:1px solid #333;">
              <div style="text-align:center;margin-bottom:24px;">
                <span style="font-size:36px;font-weight:900;color:#fff;">𝕏</span>
                <p style="color:#71767b;margin:4px 0 0;font-size:13px;">Twiller</p>
              </div>
              <h2 style="font-size:20px;margin:0 0 8px;">🌐 Google Chrome Login Verification</h2>
              <p style="color:#71767b;margin:0 0 24px;font-size:14px;">
                Hi <strong style="color:#fff;">${user.displayName}</strong>, your password was accepted.
                Because you are accessing Twiller from <strong>Google Chrome</strong>, please enter the OTP below to complete login.
              </p>
              <div style="background:#111;border:1px solid #333;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
                <span style="font-size:42px;font-weight:700;letter-spacing:14px;color:#1d9bf0;">${otp}</span>
              </div>
              <p style="color:#71767b;font-size:12px;">Expires in 10 minutes.</p>
            </div>
          `,
        });
      } catch (mailErr) {
        console.warn("Chrome OTP mail error (proceeding):", mailErr.message);
      }

      return res.status(200).json({
        requiresOtp: true,
        email: user.email,
        otp,
        message:
          "Google Chrome security requirement: An identity verification OTP has been sent to your email.",
      });
    }

    // ── Non-Chrome: Record success in LoginHistory ─────────────────────────────
    await recordLoginHistory({
      user,
      email: user.email,
      env,
      status: "success",
      reason: env.isMicrosoftBrowser
        ? "Microsoft Browser Password Login"
        : "Password Login",
    });

    return res.status(200).json({ user, message: "Login successful." });
  } catch (error) {
    console.error("Login with password error:", error.message);
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
});

/**
 * GET /auth/login-history/:userId
 * Returns recent login history sessions for the user.
 */
app.get("/auth/login-history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await LoginHistory.find({ user: userId })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();
    return res.json(history);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /auth/login-history
 * Query: ?email=...
 */
app.get("/auth/login-history", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email or userId is required." });
    const history = await LoginHistory.find({ email: email.toLowerCase() })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();
    return res.json(history);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// NEW SOCIAL ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// ── Follow / Unfollow ────────────────────────────────────────────────────────
app.post("/follow/:targetId", async (req, res) => {
  try {
    const { userId } = req.body;
    const targetId = req.params.targetId;
    if (!userId || !targetId) return res.status(400).json({ error: "userId and targetId required" });
    if (userId === targetId) return res.status(400).json({ error: "Cannot follow yourself" });

    const follower = await User.findById(userId);
    const target   = await User.findById(targetId);
    if (!follower || !target) return res.status(404).json({ error: "User not found" });

    const alreadyFollowing = follower.following.map(String).includes(String(targetId));

    if (alreadyFollowing) {
      // Unfollow
      follower.following = follower.following.filter(id => String(id) !== String(targetId));
      target.followers   = target.followers.filter(id => String(id) !== String(userId));
      await follower.save();
      await target.save();
      return res.json({ following: false, followerCount: target.followers.length });
    } else {
      // Follow
      follower.following.push(targetId);
      target.followers.push(userId);
      await follower.save();
      await target.save();
      // Notification
      await Notification.create({ recipient: targetId, sender: userId, type: "follow" }).catch(() => {});
      return res.json({ following: true, followerCount: target.followers.length });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ── Who to Follow (suggestions) ──────────────────────────────────────────────
app.get("/users/suggestions", async (req, res) => {
  try {
    const { userId } = req.query;
    const currentUser = userId ? await User.findById(userId) : null;
    const excludeIds = currentUser
      ? [currentUser._id, ...currentUser.following]
      : [];
    const suggestions = await User.find({ _id: { $nin: excludeIds } })
      .select("username displayName avatar verified followers")
      .limit(5)
      .lean();
    return res.json(suggestions);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ── User Search ───────────────────────────────────────────────────────────────
app.get("/users/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return res.json([]);
    const regex = new RegExp(q.trim(), "i");
    const users = await User.find({
      $or: [{ username: regex }, { displayName: regex }]
    }).select("username displayName avatar verified followers following").limit(20).lean();
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ── Get user by ID ────────────────────────────────────────────────────────────
app.get("/users/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-passwordHash -lastPasswordResetRequest")
      .lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ── Get followers list ────────────────────────────────────────────────────────
app.get("/users/:userId/followers", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("followers", "username displayName avatar verified followers following")
      .lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user.followers);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ── Get following list ────────────────────────────────────────────────────────
app.get("/users/:userId/following", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("following", "username displayName avatar verified followers following")
      .lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user.following);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ── Tweets by user ────────────────────────────────────────────────────────────
app.get("/post/user/:userId", async (req, res) => {
  try {
    const tweets = await Tweet.find({ author: req.params.userId })
      .sort({ timestamp: -1 })
      .populate("author")
      .lean();
    return res.json(tweets);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ── Bookmarks ─────────────────────────────────────────────────────────────────
app.post("/bookmark/:tweetId", async (req, res) => {
  try {
    const { userId } = req.body;
    const tweetId = req.params.tweetId;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const existing = await Bookmark.findOne({ user: userId, tweet: tweetId });
    if (existing) {
      await existing.deleteOne();
      return res.json({ bookmarked: false });
    } else {
      await Bookmark.create({ user: userId, tweet: tweetId });
      return res.json({ bookmarked: true });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/bookmarks", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const bookmarks = await Bookmark.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate({ path: "tweet", populate: { path: "author" } })
      .lean();
    const tweets = bookmarks.map(b => b.tweet).filter(Boolean);
    return res.json(tweets);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Check if a tweet is bookmarked by user
app.get("/bookmark/check/:tweetId", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.json({ bookmarked: false });
    const exists = await Bookmark.findOne({ user: userId, tweet: req.params.tweetId });
    return res.json({ bookmarked: !!exists });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ── Notifications ─────────────────────────────────────────────────────────────
app.get("/notifications", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "username displayName avatar verified")
      .populate("tweet", "content")
      .lean();
    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.patch("/notifications/read", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId required" });
    await Notification.updateMany({ recipient: userId, read: false }, { $set: { read: true } });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/notifications/unread-count", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.json({ count: 0 });
    const count = await Notification.countDocuments({ recipient: userId, read: false });
    return res.json({ count });
  } catch (error) {
    return res.status(500).json({ count: 0 });
  }
});

// ── Replies ───────────────────────────────────────────────────────────────────
app.post("/reply/:tweetId", async (req, res) => {
  try {
    const { author, content } = req.body;
    const parentId = req.params.tweetId;
    if (!author || !content) return res.status(400).json({ error: "author and content required" });

    const reply = new Tweet({ author, content, replyTo: parentId });
    await reply.save();

    // Increment comment count on parent
    await Tweet.findByIdAndUpdate(parentId, { $inc: { comments: 1 } });

    // Notify parent tweet author
    const parent = await Tweet.findById(parentId);
    if (parent && String(parent.author) !== String(author)) {
      await Notification.create({
        recipient: parent.author,
        sender: author,
        type: "reply",
        tweet: parentId,
      }).catch(() => {});
    }

    const populated = await reply.populate("author");
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/replies/:tweetId", async (req, res) => {
  try {
    const replies = await Tweet.find({ replyTo: req.params.tweetId })
      .sort({ timestamp: 1 })
      .populate("author")
      .lean();
    return res.json(replies);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ── Global Error Handling Middleware ───────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }
  if (err) {
    console.error("Server error:", err.message);
    return res.status(err.status || 500).json({ error: err.message || "Internal server error" });
  }
  next();
});

const PORT = process.env.PORT || 5000;
const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/twiller";

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

mongoose
  .connect(MONGODB_URL)
  .then(() => {
    console.log("Connected to MongoDB successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    console.warn("Please verify your MONGODB_URL environment variable and ensure IP 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access.");
  });