"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import TwitterLogo from "@/components/Twitterlogo";
import { AuthProvider } from "@/context/AuthContext";
import axiosInstance from "@/lib/axiosInstance";

type Step = "input" | "loading" | "success";

function ForgotPasswordContent() {
  const [step, setStep] = useState<Step>("input");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const clearError = () => setError("");

  const validateEmail = (value: string): string | null => {
    if (!value.trim()) return "Please enter your email address.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) return "Please enter a valid email address.";
    return null;
  };

  const handleSubmit = async () => {
    clearError();
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep("loading");
    try {
      const res = await axiosInstance.post("/auth/forgot-password", {
        email: email.trim(),
      });
      setGeneratedPassword(res.data.newPassword);
      setStep("success");
    } catch (err: any) {
      const msg = err.response?.data?.error || "Something went wrong. Please try again.";
      setError(msg);
      setStep("input");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = generatedPassword;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-8">
          <TwitterLogo size="lg" className="text-white" />
        </div>

        {step === "input" && (
          <div className="bg-black border border-gray-800 rounded-2xl shadow-2xl px-8 pt-8 pb-10">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>

            <div className="flex items-center gap-3 mb-2">
              <KeyRound className="h-6 w-6 text-blue-400 flex-shrink-0" />
              <h1 className="text-2xl font-extrabold text-white">Forgot Password?</h1>
            </div>
            <p className="text-gray-500 text-sm mb-7 leading-relaxed">
              Enter your registered email address. We will generate a new secure password for you instantly.
            </p>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-5">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="forgotEmail" className="text-gray-300 text-sm font-medium">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="forgotEmail"
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError(); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    className="pl-10 h-12 bg-transparent border-gray-700 text-white placeholder-gray-600 focus:border-blue-500 rounded-xl text-base transition-colors"
                    autoFocus
                    autoComplete="email"
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!email.trim()}
                className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full text-base transition-all disabled:opacity-50 disabled:bg-gray-700"
              >
                Reset Password
              </Button>
            </div>

            <div className="mt-6 pt-5 border-t border-gray-800">
              <p className="text-xs text-gray-600 text-center leading-relaxed">
                A new password will be generated and shown to you.{" "}
                <span className="text-gray-500">You can only request this once per day.</span>
              </p>
            </div>

            <div className="mt-4 text-center">
              <p className="text-gray-500 text-sm">
                Remember your login?{" "}
                <Link href="/" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        )}

        {step === "loading" && (
          <div className="bg-black border border-gray-800 rounded-2xl shadow-2xl px-8 py-16 flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Loader2 className="h-7 w-7 text-blue-400 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-base">Generating your password...</p>
              <p className="text-gray-500 text-sm mt-1">Verifying your account and creating a secure password.</p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="bg-black border border-gray-800 rounded-2xl shadow-2xl px-8 pt-8 pb-10">
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4">
                <CheckCircle className="h-7 w-7 text-green-400" />
              </div>
              <h1 className="text-2xl font-extrabold text-white text-center">Password Reset Successful</h1>
              <p className="text-gray-500 text-sm text-center mt-1">Your new password has been generated.</p>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 mb-6">
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3 text-center">
                Your New Password
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 text-center overflow-hidden">
                  {showPassword ? (
                    <span className="font-mono text-lg font-bold tracking-widest text-white select-all break-all">
                      {generatedPassword}
                    </span>
                  ) : (
                    <span className="font-mono text-lg font-bold tracking-widest text-gray-600 select-none">
                      {"*".repeat(generatedPassword.length)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-gray-400 hover:text-white transition-colors p-1 flex-shrink-0"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {!showPassword && (
                <p className="text-gray-600 text-xs text-center mt-2">Click the eye icon to reveal your password</p>
              )}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-6">
              <p className="text-amber-300 text-xs leading-relaxed text-center">
                Save this password now. It will not be shown again.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleCopy}
                variant="outline"
                className="w-full h-12 border-gray-700 bg-transparent hover:bg-white/5 text-white font-semibold rounded-full text-sm transition-all gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Password
                  </>
                )}
              </Button>

              <Link href="/" className="block">
                <Button className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full text-base transition-all">
                  Go to Login
                </Button>
              </Link>
            </div>

            <p className="text-center text-gray-600 text-xs mt-5 leading-relaxed">
              Use this password with the{" "}
              <span className="text-gray-400">"Sign in with Password"</span>{" "}
              option on the login screen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthProvider>
      <ForgotPasswordContent />
    </AuthProvider>
  );
}