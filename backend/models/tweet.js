import mongoose from "mongoose";

const AudioMetaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    duration: { type: Number, required: true }, // in seconds
    fileSize: { type: Number, required: true }, // in bytes
    mimeType: { type: String, required: true },
  },
  { _id: false }
);

const TweetSchema = mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  likes: { type: Number, default: 0 },
  retweets: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  retweetedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  image: { type: String, default: null },
  timestamp: { type: Date, default: Date.now() },
  // Audio Tweet fields
  tweetType: { type: String, enum: ["text", "audio"], default: "text" },
  audio: { type: AudioMetaSchema, default: null },
  // Reply support
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Tweet", default: null },
});

export default mongoose.model("Tweet", TweetSchema);

