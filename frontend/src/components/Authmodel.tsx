"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  X,
  Mail,
  User,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  AtSign,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/context/AuthContext";
import TwitterLogo from "./Twitterlogo";
import axiosInstance from "@/lib/axiosInstance";
import { getDeviceInfo } from "@/lib/deviceInfo";
import { Smartphone, Globe, Shield, Laptop, Monitor, Clock, Zap } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
  onSignupComplete?: () => void;
}

type LoginStep = "email" | "otp";
type SignupStep = "form" | "otp";

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
  onSignupComplete,
}: AuthModalProps) {
  const {
    sendLoginOtp,
    loginWithOtp,
    loginWithPassword,
    loginWithMicrosoftBrowser,
    sendSignupOtp,
    completeSignup,
    isLoading,
  } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [deviceInfo, setDeviceInfo] = useState(getDeviceInfo());

  useEffect(() => {
    setDeviceInfo(getDeviceInfo());
  }, [isOpen]);

  // ── Login state ─────────────────────────────────────────────────────────────
  const [loginStep, setLoginStep] = useState<LoginStep>("email");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginMethod, setLoginMethod] = useState<"otp" | "password">("otp");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // ── Signup state ─────────────────────────────────────────────────────────────
  const [signupStep, setSignupStep] = useState<SignupStep>("form");
  const [signupData, setSignupData] = useState({ displayName: "", username: "", email: "" });
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  // ── Shared OTP state ─────────────────────────────────────────────────────────
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Reset on open/mode change
  useEffect(() => {
    setLoginStep("email");
    setLoginEmail("");
    setLoginMethod("otp");
    setLoginPassword("");
    setShowLoginPassword(false);
    setSignupStep("form");
    setSignupData({ displayName: "", username: "", email: "" });
    setUsernameStatus("idle");
    setOtpDigits(["", "", "", "", "", ""]);
    setError("");
    setSuccess("");
    setCooldown(0);
  }, [mode, isOpen]);

  if (!isOpen) return null;

  const clearMessages = () => { setError(""); setSuccess(""); };
  const otpValue = otpDigits.join("");

  // ── Username live-check ──────────────────────────────────────────────────────
  let usernameTimer: ReturnType<typeof setTimeout>;
  const checkUsername = (value: string) => {
    clearTimeout(usernameTimer);
    if (!value || value.length < 3) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    usernameTimer = setTimeout(async () => {
      try {
        const res = await axiosInstance.get(`/auth/check-username?username=${encodeURIComponent(value)}`);
        setUsernameStatus(res.data.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 500);
  };

  // ── OTP helpers ──────────────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) otpRefs.current[index + 1]?.focus();
  };
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...otpDigits];
    pasted.split("").forEach((d, i) => { if (i < 6) next[i] = d; });
    setOtpDigits(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const resetOtp = () => {
    setOtpDigits(["", "", "", "", "", ""]);
    setTimeout(() => otpRefs.current[0]?.focus(), 50);
  };

  // ── LOGIN ────────────────────────────────────────────────────────────────────
  const handleSendLoginOtp = async () => {
    clearMessages();
    if (!loginEmail.trim() || !/\S+@\S+\.\S+/.test(loginEmail)) {
      setError("Please enter a valid email address."); return;
    }
    setSending(true);
    try {
      const res = await sendLoginOtp(loginEmail.trim());
      setLoginStep("otp");
      if (res?.otp && typeof res.otp === "string" && res.otp.length === 6) {
        setOtpDigits(res.otp.split(""));
        setSuccess(`Code sent to ${loginEmail} (Code: ${res.otp})`);
      } else {
        setOtpDigits(["", "", "", "", "", ""]);
        setSuccess(`Code sent to ${loginEmail}`);
      }
      setCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message || "Failed to send code.");
    } finally {
      setSending(false);
    }
  };

  const handleResendLoginOtp = async () => {
    if (cooldown > 0) return;
    clearMessages();
    setSending(true);
    try {
      const res = await sendLoginOtp(loginEmail.trim());
      resetOtp();
      if (res?.otp && typeof res.otp === "string" && res.otp.length === 6) {
        setOtpDigits(res.otp.split(""));
        setSuccess(`New code: ${res.otp}`);
      } else {
        setSuccess("New code sent.");
      }
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyLoginOtp = async () => {
    clearMessages();
    if (otpValue.length !== 6) { setError("Please enter the complete 6-digit code."); return; }
    setVerifying(true);
    try {
      await loginWithOtp(loginEmail.trim(), otpValue);
      onClose();
    } catch (err: any) {
      setError(err.message || "Invalid code. Please try again.");
      resetOtp();
    } finally {
      setVerifying(false);
    }
  };

  const handleLoginWithPassword = async () => {
    clearMessages();
    if (!loginEmail.trim() || !/\S+@\S+\.\S+/.test(loginEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!loginPassword.trim()) {
      setError("Please enter your password.");
      return;
    }
    setVerifying(true);
    try {
      const res = await loginWithPassword(loginEmail.trim(), loginPassword);
      if (res?.requiresOtp) {
        setLoginStep("otp");
        if (res.otp && typeof res.otp === "string" && res.otp.length === 6) {
          setOtpDigits(res.otp.split(""));
          setSuccess(res.message || `Code: ${res.otp}`);
        } else {
          setOtpDigits(["", "", "", "", "", ""]);
          setSuccess(res.message || "Google Chrome requires OTP verification: code sent to your email.");
        }
        setCooldown(60);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
        return;
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setVerifying(false);
    }
  };

  const handleMicrosoftDirectLogin = async () => {
    clearMessages();
    if (!loginEmail.trim() || !/\S+@\S+\.\S+/.test(loginEmail)) {
      setError("Please enter your registered email address.");
      return;
    }
    setVerifying(true);
    try {
      await loginWithMicrosoftBrowser(loginEmail.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || "Direct login failed.");
    } finally {
      setVerifying(false);
    }
  };


  // ── SIGNUP ────────────────────────────────────────────────────────────────────
  const handleSendSignupOtp = async () => {
    clearMessages();
    const { displayName, username, email } = signupData;
    if (!displayName.trim()) { setError("Display name is required."); return; }
    if (!username.trim() || username.length < 3) { setError("Username must be at least 3 characters."); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError("Username can only contain letters, numbers, and underscores."); return; }
    if (usernameStatus === "taken") { setError("This username is already taken. Please choose another."); return; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email address."); return; }

    setSending(true);
    try {
      const res = await sendSignupOtp(email.trim(), username.trim(), displayName.trim());
      setSignupStep("otp");
      if (res?.otp && typeof res.otp === "string" && res.otp.length === 6) {
        setOtpDigits(res.otp.split(""));
        setSuccess(`Verification code sent to ${email} (Code: ${res.otp})`);
      } else {
        setOtpDigits(["", "", "", "", "", ""]);
        setSuccess(`Verification code sent to ${email}`);
      }
      setCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message || "Failed to send verification code.");
    } finally {
      setSending(false);
    }
  };

  const handleResendSignupOtp = async () => {
    if (cooldown > 0) return;
    clearMessages();
    setSending(true);
    try {
      const res = await sendSignupOtp(signupData.email.trim(), signupData.username.trim(), signupData.displayName.trim());
      resetOtp();
      if (res?.otp && typeof res.otp === "string" && res.otp.length === 6) {
        setOtpDigits(res.otp.split(""));
        setSuccess(`New code: ${res.otp}`);
      } else {
        setSuccess("New code sent.");
      }
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setSending(false);
    }
  };

  const handleCompleteSignup = async () => {
    clearMessages();
    if (otpValue.length !== 6) { setError("Please enter the complete 6-digit code."); return; }
    setVerifying(true);
    try {
      await completeSignup(signupData.email.trim(), otpValue, signupData.username.trim(), signupData.displayName.trim());
      // Close modal, parent will show profile setup
      onSignupComplete?.();
      onClose();
    } catch (err: any) {
      setError(err.message || "Invalid code. Please try again.");
      resetOtp();
    } finally {
      setVerifying(false);
    }
  };

  // ── OTP BOX UI (shared between login & signup) ────────────────────────────────
  const renderOtpStep = (
    title: string,
    subtitle: string,
    emailDisplay: string,
    onBack: () => void,
    onVerify: () => void,
    onResend: () => void
  ) => (
    <>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-3xl font-extrabold text-white mb-2 text-center">{title}</h1>
      <p className="text-gray-500 text-sm text-center mb-1">{subtitle}</p>
      <p className="text-white text-sm font-semibold text-center mb-7">{emailDisplay}</p>

      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-5">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
      {success && !error && (
        <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-5">
          <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-green-300 text-sm">{success}</p>
        </div>
      )}

      {/* 6-box OTP */}
      <div className="flex gap-2 justify-center mb-6" onPaste={handleOtpPaste}>
        {otpDigits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { otpRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleOtpChange(i, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(i, e)}
            className={`w-11 h-14 text-center text-xl font-bold text-white bg-transparent border-2 rounded-xl transition-all outline-none ${
              d ? "border-blue-500 bg-blue-500/5" : "border-gray-700 focus:border-blue-500"
            }`}
          />
        ))}
      </div>

      <Button
        onClick={onVerify}
        disabled={verifying || otpValue.length !== 6}
        className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full text-base transition-all disabled:opacity-50 disabled:bg-gray-700"
      >
        {verifying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying…</> : "Verify & Continue"}
      </Button>

      <div className="text-center mt-5">
        {cooldown > 0 ? (
          <p className="text-gray-500 text-sm">
            Resend code in <span className="text-white font-semibold tabular-nums">{cooldown}s</span>
          </p>
        ) : (
          <button
            onClick={onResend}
            disabled={sending}
            className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-medium mx-auto transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${sending ? "animate-spin" : ""}`} />
            {sending ? "Sending…" : "Resend code"}
          </button>
        )}
      </div>
      <p className="text-center text-gray-600 text-xs mt-4">Code expires in 10 minutes · Single use only</p>
    </>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(91,112,131,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-[600px] bg-black border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-8 pt-8 pb-10">
          <div className="flex justify-center mb-8">
            <TwitterLogo size="lg" className="text-white" />
          </div>

          {/* ══ LOGIN ══════════════════════════════════════════════════════════ */}
          {mode === "login" && (
            <div className="max-w-xs mx-auto">
              {loginStep === "email" && (
                <>
                  <h1 className="text-3xl font-extrabold text-white mb-2 text-center">Sign in to Twiller</h1>

                  {/* Login method toggle */}
                  <div className="flex bg-gray-900 rounded-full p-1 mb-6">
                    <button
                      onClick={() => { setLoginMethod("otp"); clearMessages(); }}
                      className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
                        loginMethod === "otp"
                          ? "bg-blue-500 text-white"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Sign in with Code
                    </button>
                    <button
                      onClick={() => { setLoginMethod("password"); clearMessages(); }}
                      className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
                        loginMethod === "password"
                          ? "bg-blue-500 text-white"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Sign in with Password
                    </button>
                  </div>

                  {/* Environment Detection Badges */}
                  <div className="mb-4 space-y-2">
                    {deviceInfo.isGoogleChrome && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs">
                        <Shield className="h-4 w-4 text-blue-400 flex-shrink-0" />
                        <span>
                          <strong>Google Chrome:</strong> Email OTP identity verification required.
                        </span>
                      </div>
                    )}
                    {deviceInfo.isMicrosoftBrowser && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs">
                        <Zap className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        <span>
                          <strong>Microsoft Browser:</strong> Direct sign-in enabled without extra auth.
                        </span>
                      </div>
                    )}
                    {deviceInfo.isMobile && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
                        <Clock className="h-4 w-4 text-amber-400 flex-shrink-0" />
                        <span>
                          <strong>Mobile Access:</strong> Allowed only 10:00 AM – 1:00 PM IST.
                        </span>
                      </div>
                    )}
                  </div>

                  {loginMethod === "otp" && (
                    <p className="text-gray-500 text-sm text-center mb-6">Enter your email to receive a sign-in code.</p>
                  )}
                  {loginMethod === "password" && (
                    <p className="text-gray-500 text-sm text-center mb-6">Enter your email and recovery password.</p>
                  )}

                  {error && (
                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                      <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Email field (always shown) */}
                    <div className="space-y-1.5">
                      <label htmlFor="loginEmail" className="text-gray-300 text-sm font-medium block">Email address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                          id="loginEmail"
                          type="email"
                          placeholder="you@example.com"
                          value={loginEmail}
                          onChange={(e) => { setLoginEmail(e.target.value); clearMessages(); }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              loginMethod === "password" ? handleLoginWithPassword() : handleSendLoginOtp();
                            }
                          }}
                          className="w-full pl-10 pr-4 h-12 bg-transparent border border-gray-700 text-white placeholder-gray-600 focus:border-blue-500 outline-none rounded-xl text-base transition-colors"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Password field (only when method = password) */}
                    {loginMethod === "password" && (
                      <div className="space-y-1.5">
                        <label htmlFor="loginPassword" className="text-gray-300 text-sm font-medium block">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <input
                            id="loginPassword"
                            type={showLoginPassword ? "text" : "password"}
                            placeholder="Your recovery password"
                            value={loginPassword}
                            onChange={(e) => { setLoginPassword(e.target.value); clearMessages(); }}
                            onKeyDown={(e) => e.key === "Enter" && handleLoginWithPassword()}
                            className="w-full pl-10 pr-10 h-12 bg-transparent border border-gray-700 text-white placeholder-gray-600 focus:border-blue-500 outline-none rounded-xl text-base transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword((v) => !v)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                          >
                            {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {/* Forgot password link */}
                        <div className="text-right">
                          <Link
                            href="/forgot-password"
                            onClick={onClose}
                            className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
                          >
                            Forgot Password?
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Action button */}
                    {loginMethod === "otp" ? (
                      <>
                        <Button
                          onClick={handleSendLoginOtp}
                          disabled={sending || !loginEmail.trim()}
                          className="w-full h-12 bg-white hover:bg-gray-200 text-black font-bold rounded-full text-base disabled:opacity-50"
                        >
                          {sending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</> : "Send code"}
                        </Button>
                        {/* Forgot password link below OTP button too */}
                        <div className="text-center">
                          <Link
                            href="/forgot-password"
                            onClick={onClose}
                            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                          >
                            Forgot Password?
                          </Link>
                        </div>
                      </>
                    ) : (
                      <Button
                        onClick={handleLoginWithPassword}
                        disabled={verifying || !loginEmail.trim() || !loginPassword.trim()}
                        className="w-full h-12 bg-white hover:bg-gray-200 text-black font-bold rounded-full text-base disabled:opacity-50"
                      >
                        {verifying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in…</> : "Sign in"}
                      </Button>
                    )}

                    {/* Microsoft Browser Direct Login Button */}
                    {deviceInfo.isMicrosoftBrowser && (
                      <div className="pt-1">
                        <div className="relative flex py-2 items-center">
                          <div className="flex-grow border-t border-gray-800"></div>
                          <span className="flex-shrink mx-3 text-gray-500 text-xs uppercase">or</span>
                          <div className="flex-grow border-t border-gray-800"></div>
                        </div>
                        <Button
                          type="button"
                          onClick={handleMicrosoftDirectLogin}
                          disabled={verifying || !loginEmail.trim()}
                          className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                          {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                          Direct Sign In with Microsoft Browser
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-800 text-center">
                    <p className="text-gray-500 text-sm">
                      Don't have an account?{" "}
                      <button onClick={() => setMode("signup")} className="text-blue-400 hover:text-blue-300 font-semibold">Sign up</button>
                    </p>
                  </div>
                </>
              )}

              {loginStep === "otp" &&
                renderOtpStep(
                  "Check your email",
                  "We sent a 6-digit code to",
                  loginEmail,
                  () => { setLoginStep("email"); clearMessages(); },
                  handleVerifyLoginOtp,
                  handleResendLoginOtp
                )
              }
            </div>
          )}

          {/* ══ SIGNUP ═════════════════════════════════════════════════════════ */}
          {mode === "signup" && (
            <div className="max-w-xs mx-auto">
              {signupStep === "form" && (
                <>
                  <h1 className="text-3xl font-extrabold text-white mb-2 text-center">Create your account</h1>
                  <p className="text-gray-500 text-sm text-center mb-7">Join Twiller today. We'll verify your email.</p>

                  {error && (
                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                      <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Display Name */}
                    <div className="space-y-1.5">
                      <label htmlFor="displayName" className="text-gray-300 text-sm font-medium block">Display name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                          id="displayName"
                          type="text"
                          placeholder="Your name"
                          value={signupData.displayName}
                          onChange={(e) => { setSignupData((p) => ({ ...p, displayName: e.target.value })); clearMessages(); }}
                          className="w-full pl-10 pr-4 h-12 bg-transparent border border-gray-700 text-white placeholder-gray-600 focus:border-blue-500 outline-none rounded-xl text-base transition-colors"
                          maxLength={50}
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Username */}
                    <div className="space-y-1.5">
                      <label htmlFor="username" className="text-gray-300 text-sm font-medium block">Username</label>
                      <div className="relative">
                        <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                          id="username"
                          type="text"
                          placeholder="username"
                          value={signupData.username}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
                            setSignupData((p) => ({ ...p, username: val }));
                            clearMessages();
                            checkUsername(val);
                          }}
                          className={`w-full pl-10 pr-10 h-12 bg-transparent text-white placeholder-gray-600 focus:ring-1 outline-none rounded-xl text-base transition-colors border ${
                            usernameStatus === "available" ? "border-green-500 focus:border-green-500 focus:ring-green-500" :
                            usernameStatus === "taken" ? "border-red-500 focus:border-red-500 focus:ring-red-500" :
                            "border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                          }`}
                          maxLength={30}
                        />
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                          {usernameStatus === "checking" && <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />}
                          {usernameStatus === "available" && <CheckCircle className="h-4 w-4 text-green-400" />}
                          {usernameStatus === "taken" && <AlertCircle className="h-4 w-4 text-red-400" />}
                        </div>
                      </div>
                      {usernameStatus === "available" && (
                        <p className="text-green-400 text-xs flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> @{signupData.username} is available
                        </p>
                      )}
                      {usernameStatus === "taken" && (
                        <p className="text-red-400 text-xs flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> This username is already taken
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label htmlFor="signupEmail" className="text-gray-300 text-sm font-medium block">Email address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                          id="signupEmail"
                          type="email"
                          placeholder="you@example.com"
                          value={signupData.email}
                          onChange={(e) => { setSignupData((p) => ({ ...p, email: e.target.value })); clearMessages(); }}
                          className="w-full pl-10 pr-4 h-12 bg-transparent border border-gray-700 text-white placeholder-gray-600 focus:border-blue-500 outline-none rounded-xl text-base transition-colors"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleSendSignupOtp}
                      disabled={sending || usernameStatus === "taken" || usernameStatus === "checking"}
                      className="w-full h-12 bg-white hover:bg-gray-200 text-black font-bold rounded-full text-base mt-1 disabled:opacity-50"
                    >
                      {sending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending code…</> : "Continue"}
                    </Button>
                  </div>

                  <p className="text-xs text-gray-600 text-center mt-4 leading-relaxed">
                    By signing up, you agree to our{" "}
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>{" "}and{" "}
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>.
                  </p>

                  <div className="mt-7 pt-5 border-t border-gray-800 text-center">
                    <p className="text-gray-500 text-sm">
                      Already have an account?{" "}
                      <button onClick={() => setMode("login")} className="text-blue-400 hover:text-blue-300 font-semibold">Sign in</button>
                    </p>
                  </div>
                </>
              )}

              {signupStep === "otp" &&
                renderOtpStep(
                  "Verify your email",
                  "We sent a 6-digit code to",
                  signupData.email,
                  () => { setSignupStep("form"); clearMessages(); },
                  handleCompleteSignup,
                  handleResendSignupOtp
                )
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}