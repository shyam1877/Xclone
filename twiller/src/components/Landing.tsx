"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import AuthModal from "./Authmodel";
import TwitterLogo from "./Twitterlogo";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import Feed from "./Feed";
import ProfileSetupModal from "./ProfileSetupModal";

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const { user, googlesignin } = useAuth();
  const { t } = useLanguage();

  const openAuthModal = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Signed-in: show profile setup first if user has no avatar/bio yet
  if (user) {
    if (showProfileSetup) {
      return (
        <>
          <Feed />
          <ProfileSetupModal onComplete={() => setShowProfileSetup(false)} />
        </>
      );
    }
    return <Feed />;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row">
      {/* Left — Giant logo (desktop) */}
      <div className="hidden lg:flex lg:flex-1 items-center justify-center bg-black">
        <TwitterLogo className="text-white w-72 h-72 xl:w-96 xl:h-96" />
      </div>

      {/* Right — Content panel */}
      <div className="flex-1 lg:flex-none lg:w-[45%] xl:w-[40%] flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-12 lg:py-0 min-h-screen lg:min-h-0">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <TwitterLogo size="xl" className="text-white" />
        </div>

        <div className="space-y-10 max-w-sm">
          {/* Headline */}
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight mb-3">
              {t("landing.happening")}
            </h1>
            <h2 className="text-2xl sm:text-3xl font-bold text-white/90">{t("landing.joinToday")}</h2>
          </div>

          {/* Sign-up options */}
          <div className="space-y-3">
            {/* Google */}
            <Button
              variant="outline"
              className="w-full h-12 rounded-full border-gray-700 bg-transparent hover:bg-white/5 text-white font-semibold text-sm gap-3 transition-all"
              onClick={() => googlesignin()}
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {t("landing.signUpGoogle")}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-gray-500 text-xs font-medium">{t("landing.or")}</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            {/* Create account */}
            <Button
              className="w-full h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm transition-all"
              onClick={() => openAuthModal("signup")}
            >
              {t("landing.createAccount")}
            </Button>

            <p className="text-xs text-gray-500 leading-relaxed">
              {t("landing.termsText")}{" "}
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">{t("landing.terms")}</a>{" "}
              {t("landing.and")}{" "}
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">{t("landing.privacy")}</a>,
              {" "}{t("landing.including")}{" "}
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">{t("landing.cookies")}</a>.
            </p>
          </div>

          {/* Sign in section */}
          <div className="space-y-4 pt-2">
            <p className="text-lg font-bold">{t("landing.alreadyAccount")}</p>
            <Button
              variant="outline"
              className="w-full h-12 rounded-full border-gray-700 hover:bg-white/5 text-blue-400 hover:text-blue-300 font-bold text-sm transition-all"
              onClick={() => openAuthModal("login")}
            >
              {t("landing.signIn")}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
          {["About", "Help", "Privacy", "Terms", "Accessibility", "Ads info", "More"].map((item) => (
            <a key={item} href="#" className="hover:text-gray-400 transition-colors">{item}</a>
          ))}
          <span>© 2024 X Corp.</span>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
        onSignupComplete={() => {
          setShowAuthModal(false);
          setShowProfileSetup(true);
        }}
      />
    </div>
  );
}
