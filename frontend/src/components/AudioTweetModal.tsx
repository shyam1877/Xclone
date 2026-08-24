"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import {
  Mic,
  MicOff,
  Upload,
  X,
  Send,
  Mail,
  CheckCircle,
  Clock,
  AlertTriangle,
  Play,
  Square,
  Loader2,
} from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://xclone-nesz.onrender.com";

type Step = "mode" | "otp-request" | "otp-verify" | "audio" | "posting";
type AudioMode = "record" | "upload" | null;

interface AudioTweetModalProps {
  onClose: () => void;
  onTweetPosted: (tweet: any) => void;
}

export default function AudioTweetModal({ onClose, onTweetPosted }: AudioTweetModalProps) {
  const { user } = useAuth();

  // Step state
  const [step, setStep] = useState<Step>("otp-request");
  const [audioMode, setAudioMode] = useState<AudioMode>(null);

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpId, setOtpId] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

  // Audio state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [content, setContent] = useState("");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check if within IST window on component mount
  const [istWarning, setIstWarning] = useState("");
  useEffect(() => {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const istMs = utcMs + 5.5 * 3600 * 1000;
    const istDate = new Date(istMs);
    const h = istDate.getHours();
    const m = istDate.getMinutes();
    const totalMin = h * 60 + m;
    const inWindow = totalMin >= 14 * 60 && totalMin < 19 * 60;
    if (!inWindow) {
      const pad = (n: number) => n.toString().padStart(2, "0");
      const timeStr = `${pad(h % 12 || 12)}:${pad(m)} ${h >= 12 ? "PM" : "AM"} IST`;
      setIstWarning(
        `Audio Tweets are only available between 2:00 PM and 7:00 PM IST. Current IST time: ${timeStr}`
      );
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl && audioUrl.startsWith("blob:")) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const clearError = () => setError("");

  // ─── OTP: Send ───────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!user?.email) return;
    setIsLoading(true);
    clearError();
    try {
      await axios.post(`${BACKEND_URL}/audio-tweet/send-otp`, { email: user.email });
      setOtpSent(true);
      setStep("otp-verify");
      setSuccessMessage(`OTP sent to ${user.email}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── OTP: Verify ─────────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!user?.email || !otpValue.trim()) return;
    setIsLoading(true);
    clearError();
    try {
      const res = await axios.post(`${BACKEND_URL}/audio-tweet/verify-otp`, {
        email: user.email,
        otp: otpValue.trim(),
      });
      setOtpId(res.data.otpId);
      setOtpVerified(true);
      setSuccessMessage("Email verified! Now choose how to add your audio.");
      setStep("audio");
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Recording ───────────────────────────────────────────────────────────────
  const startRecording = async () => {
    clearError();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };

      mr.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => {
          if (s >= 300) {
            // Auto-stop at 5 min
            stopRecording();
            return s;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone permissions.");
    }
  };

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  // ─── File upload ─────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setError("Audio file size cannot exceed 100 MB.");
      return;
    }

    const allowed = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/wave", "audio/x-wav",
      "audio/mp4", "audio/x-m4a", "audio/ogg", "audio/webm", "video/webm"];
    if (!allowed.includes(file.type)) {
      setError("Unsupported format. Please use MP3, WAV, M4A, OGG, or WebM.");
      return;
    }

    const url = URL.createObjectURL(file);
    setAudioFile(file);
    setAudioUrl(url);
  };

  // ─── Post tweet ──────────────────────────────────────────────────────────────
  const handlePostTweet = async () => {
    if (!user) return;
    clearError();

    const fileToSend = audioFile || (audioBlob ? new File([audioBlob], "recording.webm", { type: "audio/webm" }) : null);
    if (!fileToSend) {
      setError("Please record or upload an audio file first.");
      return;
    }

    setIsLoading(true);
    setStep("posting");

    try {
      const formData = new FormData();
      formData.append("audio", fileToSend);
      formData.append("authorId", user._id);
      formData.append("email", user.email);
      formData.append("otpId", otpId);
      formData.append("content", content.trim() || "🎵 Audio Tweet");

      const res = await axios.post(`${BACKEND_URL}/audio-tweet/post`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onTweetPosted(res.data);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to post audio tweet. Please try again.";
      setError(msg);
      setStep("audio");
    } finally {
      setIsLoading(false);
    }
  };

  const formatSeconds = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (!user) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg mx-4 bg-black border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Mic className="h-4 w-4 text-blue-400" />
            </div>
            <h2 className="text-white font-bold text-lg">Audio Tweet</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* IST Warning */}
        {istWarning && (
          <div className="mx-5 mt-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-amber-300 text-sm">{istWarning}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-5 mt-4 flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
            <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Success message */}
        {successMessage && !error && (
          <div className="mx-5 mt-4 flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl p-3">
            <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
            <p className="text-green-300 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-5 space-y-5">
          {/* User avatar + identity */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} alt={user.displayName} />
              <AvatarFallback>{user.displayName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-semibold text-sm">{user.displayName}</p>
              <p className="text-gray-500 text-xs">@{user.username}</p>
            </div>
          </div>

          {/* ── STEP: OTP Request ── */}
          {step === "otp-request" && (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span className="text-white text-sm font-semibold">Email Verification Required</span>
                </div>
                <p className="text-gray-400 text-sm">
                  To post an Audio Tweet, we'll send a one-time verification code to{" "}
                  <span className="text-blue-400 font-medium">{user.email}</span>
                </p>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-3 border border-gray-800">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-gray-500 text-xs">Available 2:00 PM – 7:00 PM IST only</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mic className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-gray-500 text-xs">Max 5 minutes · Max 100 MB · MP3, WAV, M4A, OGG, WebM</span>
                </div>
              </div>
              <Button
                onClick={handleSendOtp}
                disabled={isLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full h-11"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending OTP…</>
                ) : (
                  <><Mail className="h-4 w-4 mr-2" /> Send OTP to Email</>
                )}
              </Button>
            </div>
          )}

          {/* ── STEP: OTP Verify ── */}
          {step === "otp-verify" && (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-gray-300 text-sm mb-1">
                  Enter the 6-digit code sent to{" "}
                  <span className="text-blue-400 font-medium">{user.email}</span>
                </p>
                <p className="text-gray-500 text-xs">Valid for 10 minutes · Single use</p>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6-digit OTP"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-2xl font-bold tracking-widest placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => { setStep("otp-request"); setOtpValue(""); setSuccessMessage(""); }}
                  className="flex-1 text-gray-400 hover:text-white border border-gray-700 rounded-full"
                >
                  Resend OTP
                </Button>
                <Button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otpValue.length !== 6}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full h-11 disabled:bg-gray-700 disabled:text-gray-500"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying…</>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP: Audio ── */}
          {step === "audio" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Email verified</span>
              </div>

              {/* Caption */}
              <Textarea
                placeholder="Add a caption... (optional)"
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 200))}
                className="bg-transparent border-none text-white placeholder-gray-500 resize-none min-h-[60px] focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              />

              {/* Mode selector (if no audio yet) */}
              {!audioUrl && !audioMode && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAudioMode("record")}
                    className="flex flex-col items-center gap-2 p-5 bg-gray-900 border border-gray-700 hover:border-blue-500 rounded-xl transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30">
                      <Mic className="h-5 w-5 text-blue-400" />
                    </div>
                    <span className="text-white text-sm font-medium">Record</span>
                    <span className="text-gray-500 text-xs">Use microphone</span>
                  </button>
                  <button
                    onClick={() => { setAudioMode("upload"); fileInputRef.current?.click(); }}
                    className="flex flex-col items-center gap-2 p-5 bg-gray-900 border border-gray-700 hover:border-blue-500 rounded-xl transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30">
                      <Upload className="h-5 w-5 text-blue-400" />
                    </div>
                    <span className="text-white text-sm font-medium">Upload</span>
                    <span className="text-gray-500 text-xs">From device</span>
                  </button>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Record UI */}
              {audioMode === "record" && !audioUrl && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center space-y-4">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isRecording ? "bg-red-500/20 animate-pulse" : "bg-blue-500/20"}`}>
                    <Mic className={`h-7 w-7 ${isRecording ? "text-red-400" : "text-blue-400"}`} />
                  </div>
                  {isRecording && (
                    <div className="text-red-400 font-mono text-lg font-semibold">
                      ● {formatSeconds(recordingSeconds)} / 5:00
                    </div>
                  )}
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full px-6"
                    >
                      <Play className="h-4 w-4 mr-2" /> Start Recording
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      className="bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-full px-6"
                    >
                      <Square className="h-4 w-4 mr-2" /> Stop Recording
                    </Button>
                  )}
                  <button
                    onClick={() => setAudioMode(null)}
                    className="block mx-auto text-gray-500 hover:text-gray-300 text-sm"
                  >
                    Choose different method
                  </button>
                </div>
              )}

              {/* Audio preview */}
              {audioUrl && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Mic className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {audioFile ? audioFile.name : "Recorded Audio"}
                      </p>
                      {audioFile && (
                        <p className="text-gray-500 text-xs">
                          {(audioFile.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      )}
                      {!audioFile && recordingSeconds > 0 && (
                        <p className="text-gray-500 text-xs">{formatSeconds(recordingSeconds)}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (audioUrl.startsWith("blob:")) URL.revokeObjectURL(audioUrl);
                        setAudioUrl("");
                        setAudioFile(null);
                        setAudioBlob(null);
                        setAudioMode(null);
                        setRecordingSeconds(0);
                      }}
                      className="p-1.5 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <audio
                    controls
                    src={audioUrl}
                    className="w-full h-10"
                    preload="metadata"
                  />
                </div>
              )}

              {/* Post button */}
              <Button
                onClick={handlePostTweet}
                disabled={isLoading || !audioUrl || !!istWarning}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-full h-11"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Posting…</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> Post Audio Tweet</>
                )}
              </Button>
            </div>
          )}

          {/* ── STEP: Posting ── */}
          {step === "posting" && (
            <div className="text-center py-8 space-y-3">
              <Loader2 className="h-10 w-10 text-blue-400 animate-spin mx-auto" />
              <p className="text-white font-semibold">Posting your Audio Tweet…</p>
              <p className="text-gray-500 text-sm">This may take a moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
