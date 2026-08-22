"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Image,
  Smile,
  Calendar,
  MapPin,
  BarChart3,
  Globe,
  Mic,
  X as XIcon,
  Crown,
  AlertTriangle,
} from "lucide-react";
import { Separator } from "./ui/separator";
import axios from "axios";
import axiosInstance from "@/lib/axiosInstance";
import AudioTweetModal from "./AudioTweetModal";

const MAX_LENGTH = 280;

const TweetComposer = ({ onTweetPosted }: any) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageurl, setimageurl] = useState("");
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitMessage, setLimitMessage] = useState("");
  const [tweetsRemaining, setTweetsRemaining] = useState<number | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch subscription status on mount and after posting
  const fetchSubStatus = async () => {
    if (!user?._id) return;
    try {
      const res = await axiosInstance.get(`/subscription/status/${user._id}`);
      setTweetsRemaining(res.data.tweetsRemaining);
      setCurrentPlan(res.data.plan);
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    fetchSubStatus();
  }, [user?._id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const tweetdata = { author: user._id, content, image: imageurl };
      const res = await axiosInstance.post("/post", tweetdata);
      onTweetPosted(res.data);
      setContent("");
      setimageurl("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      // Refresh subscription status after posting
      await fetchSubStatus();
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.error === "Tweet limit reached") {
        setLimitMessage(error.response.data.message);
        setShowLimitModal(true);
      } else {
        console.log(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsLoading(true);

    // Instant local preview
    const localPreview = URL.createObjectURL(file);
    setimageurl(localPreview);

    try {
      // 1. Try Backend Upload
      const uploadFormData = new FormData();
      uploadFormData.append("image", file);
      const res = await axiosInstance.post("/upload/image", uploadFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data && res.data.url) {
        setimageurl(res.data.url);
        return;
      }
    } catch {
      // 2. Try ImgBB fallback
      try {
        const formdataimg = new FormData();
        formdataimg.set("image", file);
        const imgbbRes = await axios.post(
          "https://api.imgbb.com/1/upload?key=97f3fb960c3520d6a88d7e29679cf96f",
          formdataimg
        );
        const url = imgbbRes.data.data.display_url;
        if (url) {
          setimageurl(url);
          return;
        }
      } catch {
        // 3. Fallback to base64 data url
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") setimageurl(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Auto-resize
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  };

  const characterCount = content.length;
  const isOverLimit = characterCount > MAX_LENGTH;
  const isNearLimit = characterCount > MAX_LENGTH * 0.8;
  const remaining = MAX_LENGTH - characterCount;
  const progress = Math.min(characterCount / MAX_LENGTH, 1);
  const circumference = 2 * Math.PI * 10; // r=10

  if (!user) return null;

  const canPost = content.trim() && !isOverLimit && !isLoading;

  return (
    <>
      <div className="border-b border-gray-800 px-4 py-3">
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0 pt-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} alt={user.displayName} />
              <AvatarFallback className="bg-blue-600 text-white font-bold">
                {user.displayName?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0">
            {/* Who can reply pill */}
            <div className="mb-2">
              <button className="flex items-center gap-1 px-3 py-0.5 rounded-full border border-blue-500/50 text-blue-400 text-xs font-semibold hover:bg-blue-500/10 transition-colors">
                <Globe className="h-3 w-3" />
                Everyone can reply
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                placeholder={t("composer.placeholder")}
                value={content}
                onChange={handleTextareaInput}
                rows={2}
                className="w-full bg-transparent text-white placeholder-gray-600 text-xl leading-relaxed resize-none outline-none min-h-[56px] max-h-[400px] overflow-y-auto"
                style={{ height: "auto" }}
              />

              {/* Image preview */}
              {imageurl && (
                <div className="relative mt-2 rounded-2xl overflow-hidden border border-gray-800 inline-block">
                  <img src={imageurl} alt="preview" className="max-h-60 max-w-full rounded-2xl object-cover" />
                  <button
                    type="button"
                    onClick={() => setimageurl("")}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Toolbar */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800/60">
                <div className="flex items-center gap-0.5 text-blue-400">
                  {/* Image upload */}
                  <label
                    htmlFor="tweetImage"
                    className="p-2 rounded-full hover:bg-blue-500/10 cursor-pointer transition-colors"
                    title="Add photo"
                  >
                    <Image className="h-5 w-5" />
                    <input
                      type="file"
                      accept="image/*"
                      id="tweetImage"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={isLoading}
                    />
                  </label>

                  {/* Audio Tweet */}
                  <button
                    type="button"
                    title="Create Audio Tweet"
                    className="p-2 rounded-full hover:bg-blue-500/10 transition-colors"
                    onClick={() => setShowAudioModal(true)}
                  >
                    <Mic className="h-5 w-5" />
                  </button>

                  <button type="button" title="Add GIF" className="p-2 rounded-full hover:bg-blue-500/10 transition-colors">
                    <BarChart3 className="h-5 w-5" />
                  </button>
                  <button type="button" title="Add emoji" className="p-2 rounded-full hover:bg-blue-500/10 transition-colors">
                    <Smile className="h-5 w-5" />
                  </button>
                  <button type="button" title="Schedule" className="p-2 rounded-full hover:bg-blue-500/10 transition-colors">
                    <Calendar className="h-5 w-5" />
                  </button>
                  <button type="button" title="Location" className="p-2 rounded-full hover:bg-blue-500/10 transition-colors opacity-50 cursor-not-allowed">
                    <MapPin className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Tweet remaining indicator */}
                  {tweetsRemaining !== null && tweetsRemaining !== -1 && (
                    <span
                      className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full ${
                        tweetsRemaining === 0
                          ? "bg-red-500/10 text-red-400"
                          : tweetsRemaining <= 1
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      {tweetsRemaining} left
                    </span>
                  )}

                  {/* Character count ring */}
                  {characterCount > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="relative w-6 h-6">
                        <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" fill="none" strokeWidth="2" className="text-gray-800" stroke="currentColor" />
                          <circle
                            cx="12" cy="12" r="10" fill="none" strokeWidth="2"
                            stroke="currentColor"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference * (1 - progress)}
                            strokeLinecap="round"
                            className={isOverLimit ? "text-red-500" : isNearLimit ? "text-yellow-400" : "text-blue-500"}
                          />
                        </svg>
                      </div>
                      {isNearLimit && (
                        <span className={`text-sm font-medium tabular-nums ${isOverLimit ? "text-red-500" : "text-yellow-400"}`}>
                          {remaining}
                        </span>
                      )}
                    </div>
                  )}

                  <Separator orientation="vertical" className="h-6 bg-gray-800" />

                  <Button
                    type="submit"
                    disabled={!canPost}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/40 disabled:text-white/40 text-white font-bold rounded-full px-5 h-9 text-[15px] transition-all"
                  >
                    {isLoading ? t("composer.posting") : t("composer.post")}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Audio Tweet Modal */}
      {showAudioModal && (
        <AudioTweetModal
          onClose={() => setShowAudioModal(false)}
          onTweetPosted={(tweet: any) => {
            onTweetPosted(tweet);
            setShowAudioModal(false);
            fetchSubStatus();
          }}
        />
      )}

      {/* Tweet Limit Reached Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="text-center">
              <div className="inline-flex p-3 rounded-full bg-yellow-500/10 text-yellow-400 mb-3">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h3 className="text-white text-lg font-bold">Tweet Limit Reached</h3>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">{limitMessage}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLimitModal(false)}
                className="flex-1 py-2.5 rounded-full border border-gray-700 text-white text-sm font-semibold hover:bg-white/5 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowLimitModal(false);
                  // Navigate to subscription page - find parent navigation handler
                  const event = new CustomEvent("navigate-to", { detail: "subscription" });
                  window.dispatchEvent(event);
                }}
                className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-500 text-black text-sm font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Crown className="h-4 w-4" />
                Upgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TweetComposer;

