"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import axiosInstance from "@/lib/axiosInstance";
import {
  Crown,
  Check,
  Zap,
  Shield,
  Infinity,
  Clock,
  CreditCard,
  ChevronRight,
  AlertCircle,
  Sparkles,
  X,
} from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PlanConfig {
  id: string;
  name: string;
  price: number;
  priceInPaise: number;
  tweetLimit: number;
  description: string;
  priceFormatted: string;
  tweetLimitDisplay: string;
}

interface SubStatus {
  plan: string;
  planName: string;
  tweetsUsed: number;
  tweetLimit: number;
  tweetsRemaining: number;
  billingCycleStart: string;
  billingCycleEnd: string;
  status: string;
  subscriptionId: string;
}

interface HistoryItem {
  _id: string;
  plan: string;
  planName: string;
  priceFormatted: string;
  amount: number;
  status: string;
  createdAt: string;
  billingCycleStart: string;
  billingCycleEnd: string;
  razorpayPaymentId: string;
}

const planMeta: Record<string, {
  gradient: string;
  glow: string;
  icon: React.ReactNode;
  features: string[];
  badge: string;
  border: string;
  accent: string;
}> = {
  free: {
    gradient: "from-gray-700 via-gray-600 to-gray-800",
    glow: "",
    icon: <Shield className="h-8 w-8" />,
    features: ["1 tweet per month", "Basic profile", "Read unlimited tweets"],
    badge: "bg-gray-700 text-gray-300",
    border: "border-gray-700",
    accent: "text-gray-400",
  },
  bronze: {
    gradient: "from-amber-800 via-amber-700 to-yellow-900",
    glow: "shadow-[0_0_40px_rgba(205,127,50,0.15)]",
    icon: <Zap className="h-8 w-8" />,
    features: ["3 tweets per month", "Bronze badge", "Priority support"],
    badge: "bg-amber-900/60 text-amber-400",
    border: "border-amber-800/50",
    accent: "text-amber-400",
  },
  silver: {
    gradient: "from-slate-400 via-gray-300 to-slate-500",
    glow: "shadow-[0_0_40px_rgba(192,192,192,0.15)]",
    icon: <Sparkles className="h-8 w-8" />,
    features: ["5 tweets per month", "Silver badge", "Analytics access", "Priority support"],
    badge: "bg-slate-700/60 text-slate-300",
    border: "border-slate-500/50",
    accent: "text-slate-300",
  },
  gold: {
    gradient: "from-yellow-500 via-amber-400 to-orange-500",
    glow: "shadow-[0_0_50px_rgba(255,215,0,0.2)]",
    icon: <Crown className="h-8 w-8" />,
    features: ["Unlimited tweets", "Gold badge", "Full analytics", "Priority support", "Early access features"],
    badge: "bg-yellow-900/60 text-yellow-400",
    border: "border-yellow-600/50",
    accent: "text-yellow-400",
  },
};

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user?._id) {
      loadData();
    }
  }, [user?._id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, statusRes, historyRes] = await Promise.all([
        axiosInstance.get("/subscription/plans"),
        axiosInstance.get(`/subscription/status/${user!._id}`),
        axiosInstance.get(`/subscription/history/${user!._id}`),
      ]);
      setPlans(plansRes.data);
      setSubStatus(statusRes.data);
      setHistory(historyRes.data);
    } catch (err: any) {
      console.error("Failed to load subscription data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (planId: string) => {
    if (!user) return;
    setError("");
    setSuccessMsg("");
    setPaymentLoading(planId);

    try {
      // Load Razorpay
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError("Failed to load payment gateway. Please try again.");
        setPaymentLoading(null);
        return;
      }

      // Create order
      const orderRes = await axiosInstance.post("/subscription/create-order", {
        userId: user._id,
        plan: planId,
      });

      const { orderId, amount, currency, keyId, planName } = orderRes.data;

      // Open Razorpay checkout
      const options = {
        key: keyId,
        amount,
        currency,
        name: "Twiller",
        description: `${planName} Plan Subscription`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await axiosInstance.post("/subscription/verify-payment", {
              userId: user._id,
              plan: planId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setSuccessMsg(verifyRes.data.message);
            await loadData(); // Refresh
          } catch (err: any) {
            setError(err.response?.data?.error || "Payment verification failed.");
          }
          setPaymentLoading(null);
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(null);
          },
        },
        prefill: {
          email: user.email,
          name: user.displayName,
        },
        theme: {
          color: "#1d9bf0",
          backdrop_color: "rgba(0, 0, 0, 0.8)",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp: any) => {
        setError(resp.error?.description || "Payment failed. Please try again.");
        setPaymentLoading(null);
      });
      rzp.open();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Failed to initiate payment.";
      setError(errMsg);
      setPaymentLoading(null);
    }
  };

  const usagePercent = subStatus
    ? subStatus.tweetLimit === -1
      ? 0
      : Math.min(100, (subStatus.tweetsUsed / subStatus.tweetLimit) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-white">{t("subscription.title")}</h1>
          <p className="text-gray-500 text-sm">{t("subscription.subtitle")}</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm">
            <Check className="h-5 w-5 flex-shrink-0" />
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Current Plan Status */}
        {subStatus && (
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Current Plan</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-2xl font-extrabold ${planMeta[subStatus.plan]?.accent || "text-white"}`}>
                    {subStatus.planName}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${planMeta[subStatus.plan]?.badge || "bg-gray-700 text-gray-300"}`}>
                    {subStatus.status}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${planMeta[subStatus.plan]?.gradient || "from-gray-700 to-gray-800"} text-black`}>
                {planMeta[subStatus.plan]?.icon}
              </div>
            </div>

            {/* Usage bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Tweet Usage</span>
                <span className="text-white font-semibold">
                  {subStatus.tweetLimit === -1
                    ? `${subStatus.tweetsUsed} used · Unlimited`
                    : `${subStatus.tweetsUsed} / ${subStatus.tweetLimit} tweets`}
                </span>
              </div>
              {subStatus.tweetLimit !== -1 && (
                <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      usagePercent >= 100 ? "bg-red-500" : usagePercent >= 80 ? "bg-yellow-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              )}
              {subStatus.tweetLimit === -1 && (
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <Infinity className="h-4 w-4" />
                  <span>Unlimited posting enabled</span>
                </div>
              )}
            </div>

            {/* Billing Info */}
            <div className="flex items-center gap-4 pt-2 border-t border-gray-800 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Renews{" "}
                  {new Date(subStatus.billingCycleEnd).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Window Notice */}
        <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3">
          <Clock className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-400 text-sm font-semibold">Payment Window</p>
            <p className="text-gray-400 text-xs mt-0.5">
              Payments are accepted only between <strong className="text-white">10:00 AM – 11:00 AM IST</strong>.
              Plan your upgrade accordingly.
            </p>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const meta = planMeta[plan.id] || planMeta.free;
            const isCurrent = subStatus?.plan === plan.id;
            const isUpgrade =
              plan.id !== "free" &&
              (!subStatus || subStatus.plan !== plan.id) &&
              (plan.id === "gold" ||
                (plan.id === "silver" && subStatus?.plan !== "gold") ||
                (plan.id === "bronze" && (subStatus?.plan === "free")));

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.02] ${
                  isCurrent
                    ? `${meta.border} bg-gradient-to-br from-gray-900/80 to-black ring-1 ring-offset-0 ${meta.glow}`
                    : "border-gray-800 bg-gray-950 hover:border-gray-700"
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-2.5 left-4">
                    <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase ${meta.badge}`}>
                      Current Plan
                    </span>
                  </div>
                )}

                {plan.id === "gold" && !isCurrent && (
                  <div className="absolute -top-2.5 right-4">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase bg-yellow-500 text-black">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan Icon */}
                <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${meta.gradient} text-black mb-3`}>
                  {meta.icon}
                </div>

                {/* Plan Name & Price */}
                <h3 className="text-white text-lg font-bold">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1 mb-3">
                  {plan.price === 0 ? (
                    <span className="text-2xl font-extrabold text-white">Free</span>
                  ) : (
                    <>
                      <span className="text-2xl font-extrabold text-white">₹{plan.price}</span>
                      <span className="text-gray-500 text-sm">/month</span>
                    </>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-4">
                  {meta.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className={`h-4 w-4 flex-shrink-0 ${meta.accent}`} />
                      {feat}
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-full border border-gray-700 text-gray-500 text-sm font-semibold cursor-default"
                  >
                    Active Plan
                  </button>
                ) : isUpgrade ? (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={paymentLoading !== null}
                    className={`w-full py-2.5 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      paymentLoading === plan.id
                        ? "bg-gray-800 text-gray-500 cursor-wait"
                        : `bg-gradient-to-r ${meta.gradient} text-black hover:opacity-90 hover:shadow-lg`
                    }`}
                  >
                    {paymentLoading === plan.id ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Upgrade to {plan.name}
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-full border border-gray-800 text-gray-600 text-sm font-semibold cursor-default"
                  >
                    {plan.id === "free" ? "Default Plan" : "Contact Support"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Payment History */}
        {history.length > 0 && (
          <div className="border border-gray-800 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <span className="text-white font-semibold text-[15px]">Payment History</span>
              </div>
              <ChevronRight
                className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${showHistory ? "rotate-90" : ""}`}
              />
            </button>

            {showHistory && (
              <div className="border-t border-gray-800 divide-y divide-gray-800/60">
                {history
                  .filter((h) => h.plan !== "free")
                  .map((item) => (
                    <div key={item._id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-semibold">{item.planName} Plan</p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                          {item.razorpayPaymentId && (
                            <span className="ml-2 text-gray-600">· {item.razorpayPaymentId}</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm font-semibold">{item.priceFormatted}</p>
                        <span
                          className={`text-[10px] font-bold uppercase ${
                            item.status === "active"
                              ? "text-green-400"
                              : item.status === "expired"
                              ? "text-gray-500"
                              : "text-red-400"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                {history.filter((h) => h.plan !== "free").length === 0 && (
                  <div className="px-5 py-6 text-center text-gray-500 text-sm">
                    No payment history yet.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
