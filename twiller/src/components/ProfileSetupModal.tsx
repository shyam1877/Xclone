"use client";

import React, { useState } from "react";
import { Camera, Loader2, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axiosInstance";
import axios from "axios";
import TwitterLogo from "./Twitterlogo";

interface ProfileSetupModalProps {
  onComplete: () => void;
}

export default function ProfileSetupModal({ onComplete }: ProfileSetupModalProps) {
  const { user, updateProfile } = useAuth();
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const processImageFile = async (file: File): Promise<string> => {
    // 1. Try Backend Upload
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("image", file);
      const res = await axiosInstance.post("/upload/image", uploadFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data && res.data.url) {
        return res.data.url;
      }
    } catch (backendErr) {
      console.warn("Backend image upload fallback in setup modal:", backendErr);
    }

    // 2. Try ImgBB
    try {
      const imgbbData = new FormData();
      imgbbData.set("image", file);
      const imgbbRes = await axios.post(
        "https://api.imgbb.com/1/upload?key=97f3fb960c3520d6a88d7e29679cf96f",
        imgbbData
      );
      if (imgbbRes.data?.data?.display_url) {
        return imgbbRes.data.data.display_url;
      }
    } catch (imgbbErr) {
      console.warn("ImgBB fallback in setup modal:", imgbbErr);
    }

    // 3. Fallback to Data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert image to Data URL"));
        }
      };
      reader.onerror = () => reject(new Error("Error reading image file"));
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    setError("");

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setAvatar(localUrl);

    try {
      const finalUrl = await processImageFile(file);
      setAvatar(finalUrl);
    } catch {
      setError("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateRandomAvatar = () => {
    const randomAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
      user.displayName || "user"
    )}-${Date.now()}`;
    setAvatar(randomAvatar);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await updateProfile({
        displayName: user.displayName,
        bio,
        location,
        website: user.website || "",
        avatar: avatar || user.avatar,
      });
      onComplete();
    } catch {
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => onComplete();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
    >
      <div className="w-full max-w-[540px] bg-black border border-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-8 pt-8 pb-10">
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <TwitterLogo size="lg" className="text-white" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-1">
            Welcome to Twiller! 🎉
          </h1>
          <p className="text-gray-400 text-sm text-center mb-7">
            Set up your profile — you can always change this later.
          </p>

          {/* Avatar upload */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <Avatar className="h-28 w-28 border-4 border-gray-800 ring-2 ring-blue-500/30">
                <AvatarImage src={avatar || user.avatar} alt="Profile" className="object-cover w-full h-full" />
                <AvatarFallback className="bg-gray-800 text-3xl font-bold text-white">
                  {user.displayName?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <label
                htmlFor="profilePhoto"
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="h-7 w-7 text-white animate-spin" />
                ) : (
                  <Camera className="h-7 w-7 text-white" />
                )}
              </label>
              <input
                id="profilePhoto"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploading || saving}
              />
            </div>

            <div className="flex items-center gap-3 mt-3">
              <label
                htmlFor="profilePhoto"
                className="text-blue-400 hover:text-blue-300 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-full"
              >
                <Camera className="h-3.5 w-3.5" />
                {avatar ? "Change photo" : "Upload photo"}
              </label>

              <button
                type="button"
                onClick={handleGenerateRandomAvatar}
                disabled={uploading || saving}
                className="text-gray-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-full"
              >
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                Random
              </button>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4 max-w-sm mx-auto">
            {error && (
              <p className="text-red-400 text-xs text-center bg-red-950/30 border border-red-900/50 p-2 rounded-xl">
                {error}
              </p>
            )}

            {/* Bio */}
            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-gray-300 text-xs font-medium">
                Bio <span className="text-gray-500 font-normal">(optional)</span>
              </Label>
              <Textarea
                id="bio"
                placeholder="Tell the world about yourself…"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 160))}
                className="bg-transparent border-gray-700 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl resize-none min-h-[80px] text-sm transition-colors"
              />
              <p className="text-right text-xs text-gray-500">{bio.length}/160</p>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-gray-300 text-xs font-medium">
                Location <span className="text-gray-500 font-normal">(optional)</span>
              </Label>
              <Input
                id="location"
                type="text"
                placeholder="Where are you based?"
                value={location}
                onChange={(e) => setLocation(e.target.value.slice(0, 30))}
                className="h-11 bg-transparent border-gray-700 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm transition-colors"
              />
            </div>

            {/* Save button */}
            <Button
              onClick={handleSave}
              disabled={saving || uploading}
              className="w-full h-11 bg-white hover:bg-gray-200 text-black font-bold rounded-full text-sm mt-2 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
              ) : (
                <><CheckCircle className="h-4 w-4" /> Complete profile</>
              )}
            </Button>

            {/* Skip */}
            <button
              onClick={handleSkip}
              className="w-full text-center text-gray-500 hover:text-gray-300 text-xs transition-colors flex items-center justify-center gap-1 py-1"
            >
              Skip for now <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
