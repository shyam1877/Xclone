"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Globe, ArrowLeft, Loader2, CheckCircle, AlertCircle, Phone, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { LANGUAGES, LanguageCode } from "@/lib/translations";
import axiosInstance from "@/lib/axiosInstance";

interface LanguageSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "select" | "phone" | "otp" | "success";

export default function LanguageSwitcher({ isOpen, onClose }: LanguageSwitcherProps) {
  const { user } = useAuth();
  const { language: currentLanguage, setLanguage, t } = useLanguage();

  const [step, setStep] = useState<Step>("select");
  const [selectedLang, setSelectedLang] = useState<LanguageCode | null>(null);
  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpMethod, setOtpMethod] = useState<"email" | "mobile">("email");
  const [phone, setPhone] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep("select");
      setSelectedLang(null);
      setOtpValues(["", "", "", "", "", ""]);
      setError("");
      setLoading(false);
      setPhone("");
      setResendTimer(0);
    }
  }, [isOpen]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleLanguageSelect = async (langCode: LanguageCode) => {
    if (langCode === currentLanguage) return;
    setSelectedLang(langCode);
    setError("");

    const isFrench = langCode === "fr";

    if (!isFrench && !user?.phone) {
      // Need phone number first
      setStep("phone");
      return;
    }

    // Send OTP
    await sendOtp(langCode);
  };

  const sendOtp = async (langCode: LanguageCode) => {
    setLoading(true);
    setError("");

    try {
      const res = await axiosInstance.post("/language/send-otp", {
        email: user?.email,
        targetLanguage: langCode,
      });

      setOtpMethod(res.data.method || (langCode === "fr" ? "email" : "mobile"));
      setStep("otp");
      setResendTimer(60);
      setOtpValues(["", "", "", "", "", ""]);

      // Focus first OTP input after a tick
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.requiresPhone) {
        setStep("phone");
      } else {
        setError(data?.error || "Failed to send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSave = async () => {
    if (!phone.trim()) {
      setError("Please enter a phone number.");
      return;
    }

    setPhoneLoading(true);
    setError("");

    try {
      await axiosInstance.patch("/user/phone", {
        email: user?.email,
        phone: phone.trim(),
      });

      // Update local user data
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("twitter-user");
          if (stored) {
            const userData = JSON.parse(stored);
            userData.phone = phone.trim();
            localStorage.setItem("twitter-user", JSON.stringify(userData));
          }
        } catch {}
      }

      // Now send OTP
      if (selectedLang) {
        await sendOtp(selectedLang);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save phone number.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newValues = [...otpValues];
    newValues[index] = value.slice(-1);
    setOtpValues(newValues);

    // Auto-advance to next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newValues = [...otpValues];
    for (let i = 0; i < pasted.length; i++) {
      newValues[i] = pasted[i];
    }
    setOtpValues(newValues);
    const nextEmpty = newValues.findIndex((v) => !v);
    otpRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  const handleVerify = async () => {
    const otp = otpValues.join("");
    if (otp.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axiosInstance.post("/language/verify-otp", {
        email: user?.email,
        otp,
        targetLanguage: selectedLang,
      });

      // Update language in context
      if (selectedLang) {
        setLanguage(selectedLang);
      }

      // Update local user data with the returned user
      if (res.data.user && typeof window !== "undefined") {
        localStorage.setItem("twitter-user", JSON.stringify(res.data.user));
      }

      setStep("success");

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || !selectedLang) return;
    await sendOtp(selectedLang);
  };

  if (!isOpen) return null;

  const selectedLangInfo = LANGUAGES.find((l) => l.code === selectedLang);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            {step !== "select" && step !== "success" && (
              <button
                onClick={() => {
                  setStep("select");
                  setError("");
                }}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">{t("lang.title")}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* ── Language Selection Grid ── */}
          {step === "select" && (
            <div>
              <p className="text-gray-400 text-sm mb-4">{t("lang.subtitle")}</p>

              <div className="grid grid-cols-2 gap-3">
                {LANGUAGES.map((lang) => {
                  const isActive = lang.code === currentLanguage;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      disabled={loading}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                        isActive
                          ? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(29,155,240,0.15)]"
                          : "border-gray-800 hover:border-gray-600 hover:bg-white/5"
                      } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span className="text-3xl">{lang.flag}</span>
                      <div className="text-center">
                        <p className="text-white font-semibold text-sm">{lang.name}</p>
                        <p className="text-gray-400 text-xs">{lang.nativeName}</p>
                      </div>
                      {isActive && (
                        <span className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {t("lang.current")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 mt-4 text-blue-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{t("lang.sending")}</span>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── Phone Number Input ── */}
          {step === "phone" && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
                  <Phone className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="text-white font-bold text-lg">{t("lang.phoneRequired")}</h3>
                <p className="text-gray-400 text-sm mt-1">{t("lang.phoneRequiredDesc")}</p>
              </div>

              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("lang.phonePlaceholder")}
                className="w-full px-4 py-3 bg-black border border-gray-700 focus:border-blue-500 rounded-xl text-white placeholder-gray-500 text-sm outline-none transition-colors"
              />

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep("select");
                    setError("");
                  }}
                  className="flex-1 py-3 px-4 border border-gray-700 text-white rounded-full font-semibold text-sm hover:bg-white/5 transition-colors"
                >
                  {t("lang.cancel")}
                </button>
                <button
                  onClick={handlePhoneSave}
                  disabled={phoneLoading || !phone.trim()}
                  className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {phoneLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {phoneLoading ? t("lang.phoneSaving") : t("lang.phoneSave")}
                </button>
              </div>
            </div>
          )}

          {/* ── OTP Verification ── */}
          {step === "otp" && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                  <Shield className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-white font-bold text-lg">
                  {t("lang.switchTo")} {selectedLangInfo?.name}
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  {selectedLangInfo?.flag}{" "}
                  {otpMethod === "email" ? t("lang.verifyEmail") : t("lang.verifyMobile")}
                </p>
              </div>

              {/* OTP Input Boxes */}
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-2 text-center">
                  {t("lang.enterOtp")}
                </label>
                <div className="flex justify-center gap-2">
                  {otpValues.map((val, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      className="w-12 h-14 text-center text-xl font-bold bg-black border border-gray-700 focus:border-blue-500 rounded-xl text-white outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleVerify}
                disabled={loading || otpValues.join("").length !== 6}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? t("lang.verifying") : t("lang.verify")}
              </button>

              <button
                onClick={handleResend}
                disabled={resendTimer > 0}
                className="w-full text-center text-sm text-gray-400 hover:text-blue-400 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {resendTimer > 0
                  ? `${t("lang.resend")} (${resendTimer}s)`
                  : t("lang.resend")}
              </button>
            </div>
          )}

          {/* ── Success ── */}
          {step === "success" && (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center animate-in zoom-in duration-300">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">{t("lang.success")}</h3>
                <p className="text-gray-400 text-sm mt-2">
                  {selectedLangInfo?.flag} {selectedLangInfo?.name} ({selectedLangInfo?.nativeName})
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
