"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { LANGUAGES } from "@/lib/translations";
import { User, Shield, Bell, Lock, LogOut, ChevronRight, Check, Globe } from "lucide-react";
import Editprofile from "./Editprofile";
import LanguageSwitcher from "./LanguageSwitcher";

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { user, logout, updateProfile } = useAuth();
  const { t, language } = useLanguage();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isLanguageSwitcherOpen, setIsLanguageSwitcherOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notificationsEnabled !== false
  );
  const [savedMessage, setSavedMessage] = useState("");

  const currentLangInfo = LANGUAGES.find((l) => l.code === language);

  const handleTogglePrivate = async () => {
    try {
      const nextState = !isPrivate;
      setIsPrivate(nextState);
      if (user) {
        await updateProfile({
          displayName: user.displayName,
          bio: user.bio || "",
          location: user.location || "",
          website: user.website || "",
          avatar: user.avatar || "",
          coverImage: user.coverImage || "",
          isPrivate: nextState,
          notificationsEnabled,
        });
        setSavedMessage(t("settings.privacyUpdated"));
        setTimeout(() => setSavedMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setIsPrivate(!isPrivate);
    }
  };

  const handleToggleNotifications = async () => {
    try {
      const nextState = !notificationsEnabled;
      setNotificationsEnabled(nextState);
      if (user) {
        await updateProfile({
          displayName: user.displayName,
          bio: user.bio || "",
          location: user.location || "",
          website: user.website || "",
          avatar: user.avatar || "",
          coverImage: user.coverImage || "",
          isPrivate,
          notificationsEnabled: nextState,
        });
        setSavedMessage(t("settings.notificationUpdated"));
        setTimeout(() => setSavedMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setNotificationsEnabled(!notificationsEnabled);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4">
        <h1 className="text-xl font-bold">{t("settings.title")}</h1>
        <p className="text-sm text-gray-400">{t("settings.subtitle")}</p>
      </div>

      {savedMessage && (
        <div className="m-4 p-3 bg-blue-900/40 border border-blue-500/50 rounded-xl text-blue-200 text-sm flex items-center gap-2">
          <Check className="w-4 h-4 text-blue-400" />
          {savedMessage}
        </div>
      )}

      <div className="p-4 space-y-6">
        {/* Account Info Card */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            {t("settings.yourAccount")}
          </h2>

          <div
            onClick={() => onNavigate("profile")}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-800/60 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-400" />
              <div>
                <p className="font-semibold text-sm">{user?.displayName || t("sidebar.profile")}</p>
                <p className="text-xs text-gray-400">@{user?.username || "user"}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </div>

          <div
            onClick={() => setIsEditProfileOpen(true)}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-800/60 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-purple-400" />
              <div>
                <p className="font-semibold text-sm">{t("settings.editProfile")}</p>
                <p className="text-xs text-gray-400">{t("settings.editProfileDesc")}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </div>
        </div>

        {/* Language */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            {t("settings.language")}
          </h2>

          <div
            onClick={() => setIsLanguageSwitcherOpen(true)}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-800/60 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="font-semibold text-sm">{t("settings.language")}</p>
                <p className="text-xs text-gray-400">{t("settings.languageDesc")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                {currentLangInfo?.flag} {currentLangInfo?.name}
              </span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            {t("settings.privacyPrefs")}
          </h2>

          <div className="flex items-center justify-between p-3 rounded-xl">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="font-semibold text-sm">{t("settings.privateAccount")}</p>
                <p className="text-xs text-gray-400">{t("settings.privateAccountDesc")}</p>
              </div>
            </div>
            <button
              onClick={handleTogglePrivate}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                isPrivate ? "bg-blue-600" : "bg-gray-700"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isPrivate ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-amber-400" />
              <div>
                <p className="font-semibold text-sm">{t("settings.pushNotifications")}</p>
                <p className="text-xs text-gray-400">{t("settings.pushNotificationsDesc")}</p>
              </div>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                notificationsEnabled ? "bg-blue-600" : "bg-gray-700"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  notificationsEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Session / Logout */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 p-3 text-red-400 bg-red-950/30 hover:bg-red-900/40 border border-red-900/50 rounded-xl font-medium transition"
          >
            <LogOut className="w-5 h-5" />
            {t("settings.logOut")}
          </button>
        </div>
      </div>

      <Editprofile
        isopen={isEditProfileOpen}
        onclose={() => setIsEditProfileOpen(false)}
      />

      <LanguageSwitcher
        isOpen={isLanguageSwitcherOpen}
        onClose={() => setIsLanguageSwitcherOpen(false)}
      />
    </div>
  );
};

export default SettingsPage;
