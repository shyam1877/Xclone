"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Camera, LinkIcon, MapPin, X, Loader2, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import LoadingSpinner from "./loading-spinner";
import axiosInstance from "@/lib/axiosInstance";
import axios from "axios";

interface EditProfileProps {
  isopen: boolean;
  onclose: () => void;
}

const Editprofile: React.FC<EditProfileProps> = ({ isopen, onclose }) => {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    location: "",
    website: "",
    avatar: "",
    coverImage: "",
  });

  const [error, setError] = useState<Record<string, string>>({});
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or user updates
  useEffect(() => {
    if (user && isopen) {
      setFormData({
        displayName: user.displayName || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        avatar: user.avatar || "",
        coverImage: user.coverImage || "",
      });
      setError({});
    }
  }, [user, isopen]);

  if (!isopen || !user) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = "Display name is required";
    } else if (formData.displayName.length > 50) {
      newErrors.displayName = "Display name must be 50 characters or less";
    }

    if (formData.bio && formData.bio.length > 160) {
      newErrors.bio = "Bio must be 160 characters or less";
    }

    if (formData.website && formData.website.length > 100) {
      newErrors.website = "Website must be 100 characters or less";
    }

    if (formData.location && formData.location.length > 30) {
      newErrors.location = "Location must be 30 characters or less";
    }

    setError(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Universal, highly resilient image uploader:
   * 1. Sets instant client preview
   * 2. Attempts upload to backend /upload/image
   * 3. Fallbacks to imgbb API
   * 4. Ultimate fallback to direct Base64 Data URL
   */
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
      console.warn("Backend image upload failed, attempting fallback:", backendErr);
    }

    // 2. Try ImgBB API
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
      console.warn("ImgBB upload failed, falling back to Base64:", imgbbErr);
    }

    // 3. Ultimate Fallback: Base64 Data URL
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const localPreview = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, avatar: localPreview }));
    setIsUploadingAvatar(true);
    setError((prev) => ({ ...prev, general: "", avatar: "" }));

    try {
      const uploadedUrl = await processImageFile(file);
      setFormData((prev) => ({ ...prev, avatar: uploadedUrl }));
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      // Keep local preview if available
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const localPreview = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, coverImage: localPreview }));
    setIsUploadingCover(true);
    setError((prev) => ({ ...prev, general: "", coverImage: "" }));

    try {
      const uploadedUrl = await processImageFile(file);
      setFormData((prev) => ({ ...prev, coverImage: uploadedUrl }));
    } catch (err: any) {
      console.error("Cover upload failed:", err);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleGenerateRandomAvatar = () => {
    const randomAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
      formData.displayName || user.displayName || "user"
    )}-${Date.now()}`;
    setFormData((prev) => ({ ...prev, avatar: randomAvatar }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isLoading || isUploadingAvatar || isUploadingCover) return;
    setIsLoading(true);
    try {
      await updateProfile({
        displayName: formData.displayName.trim(),
        bio: formData.bio.trim(),
        location: formData.location.trim(),
        website: formData.website.trim(),
        avatar: formData.avatar || user.avatar,
        coverImage: formData.coverImage,
      });
      onclose();
    } catch (err: any) {
      setError({ general: err.message || "Failed to update profile. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error[field]) {
      setError((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const currentAvatarSrc = formData.avatar || user?.avatar;
  const currentCoverSrc = formData.coverImage || user?.coverImage;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-black border border-gray-800 text-white max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl">
        <CardHeader className="sticky top-0 bg-black/90 backdrop-blur-md z-20 pb-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-gray-800 rounded-full h-9 w-9"
                onClick={onclose}
                disabled={isLoading || isUploadingAvatar || isUploadingCover}
              >
                <X className="h-5 w-5" />
              </Button>
              <CardTitle className="text-xl font-bold">{t("editProfile.title")}</CardTitle>
            </div>
            <Button
              type="submit"
              form="edit-profile-form"
              className="bg-white text-black hover:bg-gray-200 font-bold rounded-full px-6 h-9 transition-all disabled:opacity-50"
              disabled={isLoading || isUploadingAvatar || isUploadingCover}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>{t("editProfile.saving")}</span>
                </div>
              ) : (
                t("editProfile.save")
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error.general && (
            <div className="bg-red-900/20 border border-red-800 rounded-xl p-3 text-red-400 text-sm m-4">
              {error.general}
            </div>
          )}

          <form id="edit-profile-form" onSubmit={handleSubmit}>
            {/* Cover Photo */}
            <div className="relative">
              <div
                className="h-48 sm:h-52 relative overflow-hidden transition-all"
                style={{
                  background: currentCoverSrc
                    ? `url(${currentCoverSrc}) center/cover no-repeat`
                    : "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)",
                }}
              >
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
                
                <input
                  type="file"
                  accept="image/*"
                  ref={coverInputRef}
                  id="coverUpload"
                  className="hidden"
                  onChange={handleCoverUpload}
                  disabled={isLoading || isUploadingCover}
                />

                <div className="absolute inset-0 flex items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all"
                    disabled={isLoading || isUploadingCover}
                    onClick={() => coverInputRef.current?.click()}
                    title="Change cover photo"
                  >
                    {isUploadingCover ? (
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </Button>

                  {formData.coverImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all"
                      disabled={isLoading || isUploadingCover}
                      onClick={() => setFormData((prev) => ({ ...prev, coverImage: "" }))}
                      title="Remove cover photo"
                    >
                      <X className="h-5 w-5 text-white" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Profile Picture (Avatar) */}
              <div className="absolute -bottom-16 left-4">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-black ring-2 ring-gray-800 bg-gray-900">
                    <AvatarImage
                      src={currentAvatarSrc}
                      alt={formData.displayName || user?.displayName}
                      className="object-cover w-full h-full"
                    />
                    <AvatarFallback className="text-3xl font-bold bg-blue-600 text-white">
                      {(formData.displayName || user?.displayName)?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <input
                    type="file"
                    accept="image/*"
                    ref={avatarInputRef}
                    id="avatarUpload"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={isLoading || isUploadingAvatar}
                  />

                  <div
                    className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    ) : (
                      <Camera className="h-8 w-8 text-white" />
                    )}
                  </div>
                </div>
              </div>

              {/* Quick avatar buttons */}
              <div className="flex justify-end p-4 pt-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="rounded-full border-gray-700 bg-transparent text-xs text-white hover:bg-white/10"
                >
                  <Camera className="h-3.5 w-3.5 mr-1.5" />
                  {isUploadingAvatar ? "Uploading…" : "Upload Photo"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateRandomAvatar}
                  className="rounded-full border-gray-700 bg-transparent text-xs text-blue-400 hover:bg-blue-500/10"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Avatar AI
                </Button>
              </div>
            </div>

            <div className="p-4 mt-8 space-y-6">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-white text-sm font-semibold">
                  Name
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange("displayName", e.target.value)}
                  className="bg-transparent border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl"
                  placeholder="Your display name"
                  maxLength={50}
                  disabled={isLoading}
                />
                <div className="flex justify-between text-xs">
                  {error.displayName ? (
                    <p className="text-red-400">{error.displayName}</p>
                  ) : (
                    <span />
                  )}
                  <p className="text-gray-500 ml-auto">{formData.displayName.length}/50</p>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-white text-sm font-semibold">
                  {t("editProfile.bio")}
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  className="bg-transparent border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl resize-none min-h-[100px]"
                  placeholder="Tell the world about yourself"
                  maxLength={160}
                  disabled={isLoading}
                />
                <div className="flex justify-between text-xs">
                  {error.bio ? <p className="text-red-400">{error.bio}</p> : <span />}
                  <p className="text-gray-500 ml-auto">{formData.bio.length}/160</p>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-white text-sm font-semibold">
                  {t("editProfile.location")}
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className="pl-10 bg-transparent border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl"
                    placeholder="Where are you located?"
                    maxLength={30}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  {error.location ? (
                    <p className="text-red-400">{error.location}</p>
                  ) : (
                    <span />
                  )}
                  <p className="text-gray-500 ml-auto">{formData.location.length}/30</p>
                </div>
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website" className="text-white text-sm font-semibold">
                  {t("editProfile.website")}
                </Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="website"
                    type="text"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    className="pl-10 bg-transparent border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl"
                    placeholder="Your website URL (e.g. https://example.com)"
                    maxLength={100}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  {error.website ? <p className="text-red-400">{error.website}</p> : <span />}
                  <p className="text-gray-500 ml-auto">{formData.website.length}/100</p>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Editprofile;
