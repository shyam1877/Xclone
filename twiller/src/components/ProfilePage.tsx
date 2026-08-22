"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Camera,
  BadgeCheck,
  ShieldCheck,
  Monitor,
  Laptop,
  Smartphone,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import TweetCard from "./TweetCard";
import { Card, CardContent } from "./ui/card";
import Editprofile from "./Editprofile";
import axiosInstance from "@/lib/axiosInstance";

interface ProfilePageProps {
  userId?: string;     // If provided, view another user's profile
  onBack?: () => void;
}

interface LoginHistoryItem {
  _id: string;
  browser: string;
  os: string;
  deviceCategory: "desktop" | "laptop" | "mobile";
  ipAddress: string;
  status: "success" | "blocked" | "failed" | "otp_sent";
  reason?: string;
  timestamp: string;
}

export default function ProfilePage({ userId, onBack }: ProfilePageProps) {
  const { user: currentUser, followUser } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("posts");
  const [showEditModal, setShowEditModal] = useState(false);
  const [tweets, setTweets] = useState<any[]>([]);
  const [loading, setloading] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  // Login History State
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const isOwnProfile = !userId || userId === currentUser?._id;
  const displayUser = isOwnProfile ? currentUser : profileUser;

  useEffect(() => {
    if (isOwnProfile) {
      fetchTweets(currentUser?._id);
      fetchLoginHistory();
      setFollowerCount(currentUser?.followers?.length ?? 0);
    } else {
      loadOtherUser(userId!);
    }
  }, [userId, currentUser?._id, currentUser?.avatar, currentUser?.coverImage, currentUser?.displayName]);

  // Listen for real-time user updates
  useEffect(() => {
    const handleUserUpdated = (e: any) => {
      const updated = e.detail;
      if (!updated) return;
      if (isOwnProfile) {
        if (updated._id) fetchTweets(updated._id);
      }
    };
    window.addEventListener("twiller-user-updated", handleUserUpdated);
    return () => window.removeEventListener("twiller-user-updated", handleUserUpdated);
  }, [isOwnProfile]);

  const fetchLoginHistory = async () => {
    if (!currentUser) return;
    try {
      setHistoryLoading(true);
      const res = await axiosInstance.get(
        currentUser._id
          ? `/auth/login-history/${currentUser._id}`
          : `/auth/login-history?email=${encodeURIComponent(currentUser.email)}`
      );
      setLoginHistory(res.data || []);
    } catch (err) {
      console.error("Failed to load login history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadOtherUser = async (id: string) => {
    try {
      const res = await axiosInstance.get(`/users/${id}`);
      setProfileUser(res.data);
      setFollowerCount(res.data.followers?.length ?? 0);
      setIsFollowing(
        res.data.followers?.includes(currentUser?._id) ?? false
      );
      fetchTweets(id);
    } catch (err) {
      console.error("Failed to load user", err);
    }
  };

  const fetchTweets = async (uid?: string) => {
    if (!uid) return;
    try {
      setloading(true);
      const res = await axiosInstance.get(`/post/user/${uid}`);
      setTweets(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setloading(false);
    }
  };

  const handleFollow = async () => {
    if (!displayUser?._id) return;
    try {
      const result = await followUser(displayUser._id);
      setIsFollowing(result.following);
      setFollowerCount(result.followerCount);
    } catch {}
  };

  if (!displayUser) return null;

  const mediaTweets = tweets.filter((t: any) => t.image || t.tweetType === "audio");
  const likedTweets = tweets.filter((t: any) => t.likedBy?.includes(currentUser?._id));

  const tabClass =
    "data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none text-gray-500 hover:bg-white/5 hover:text-white py-4 font-semibold text-sm transition-colors rounded-none";

  const coverImage = displayUser.coverImage;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10">
        <div className="flex items-center px-4 py-3 gap-6">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-full hover:bg-white/10 text-white w-9 h-9"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-[17px] font-bold text-white leading-tight">{displayUser.displayName}</h1>
            <p className="text-gray-500 text-sm">{tweets.length} posts</p>
          </div>
        </div>
      </div>

      {/* Cover Photo */}
      <div className="relative">
        <div
          className="h-48 sm:h-52 relative overflow-hidden"
          style={{
            background: coverImage
              ? `url(${coverImage}) center/cover no-repeat`
              : "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          {isOwnProfile && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setShowEditModal(true)}
            >
              <Camera className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Profile Picture */}
        <div className="absolute -bottom-16 left-4">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-black ring-0">
              <AvatarImage src={displayUser.avatar} alt={displayUser.displayName} className="object-cover" />
              <AvatarFallback className="text-3xl font-bold bg-blue-600 text-white">
                {displayUser.displayName?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute bottom-1 right-1 p-2 rounded-full bg-black/80 hover:bg-black/95 text-white w-9 h-9"
                onClick={() => setShowEditModal(true)}
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end p-4">
          {isOwnProfile ? (
            <Button
              variant="outline"
              className="border border-gray-600 bg-transparent text-white font-bold rounded-full px-5 h-9 hover:bg-white/5 transition-colors"
              onClick={() => setShowEditModal(true)}
            >
              {t("profile.editProfile")}
            </Button>
          ) : (
            <Button
              className={`rounded-full px-5 h-9 font-bold transition-all ${
                isFollowing
                  ? "bg-transparent border border-gray-600 text-white hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40"
                  : "bg-white hover:bg-gray-200 text-black"
              }`}
              onClick={handleFollow}
            >
              {isFollowing ? t("profile.following") : t("profile.follow")}
            </Button>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-3 mt-16">
        <div className="flex items-center gap-2">
          <h1 className="text-[22px] font-extrabold text-white leading-tight">{displayUser.displayName}</h1>
          {displayUser.verified && (
            <BadgeCheck className="h-6 w-6 text-blue-400 fill-blue-400 stroke-black flex-shrink-0" />
          )}
        </div>
        <p className="text-gray-500 text-[15px]">@{displayUser.username}</p>

        {displayUser.bio && (
          <p className="text-white text-[15px] mt-3 leading-relaxed">{displayUser.bio}</p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-gray-500 text-sm">
          {displayUser.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{displayUser.location}</span>
            </div>
          )}
          {displayUser.website && (
            <div className="flex items-center gap-1">
              <LinkIcon className="h-4 w-4" />
              <a
                href={displayUser.website.startsWith("http") ? displayUser.website : `https://${displayUser.website}`}
                className="text-blue-400 hover:underline"
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {displayUser.website}
              </a>
            </div>
          )}
          {displayUser.joinedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                Joined{" "}
                {new Date(displayUser.joinedDate).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5 mt-3 text-sm">
          <button className="hover:underline">
            <span className="text-white font-bold">{displayUser.following?.length ?? 0}</span>{" "}
            <span className="text-gray-500">{t("profile.following")}</span>
          </button>
          <button className="hover:underline">
            <span className="text-white font-bold">{followerCount}</span>{" "}
            <span className="text-gray-500">{t("profile.followers")}</span>
          </button>
        </div>

        {/* Notifications Toggle (own profile only) */}
        {isOwnProfile && (
          <div className="mt-5 p-4 border border-gray-800 rounded-2xl bg-gray-950/60 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-white font-bold text-sm">Keyword Notifications</h3>
              <p className="text-gray-500 text-xs mt-0.5">
                Browser popups for posts containing "cricket" or "science".
              </p>
            </div>
            <Button
              variant={currentUser?.notificationsEnabled ? "default" : "outline"}
              className={`rounded-full px-4 py-1 text-sm font-bold flex-shrink-0 transition-all ${
                currentUser?.notificationsEnabled
                  ? "bg-blue-500 hover:bg-blue-600 text-white border-0"
                  : "border border-gray-600 text-white hover:bg-white/5"
              }`}
              onClick={async () => {
                try {
                  const newPref = !currentUser?.notificationsEnabled;
                  if (newPref && typeof window !== "undefined" && "Notification" in window) {
                    if (Notification.permission !== "granted") {
                      const perm = await Notification.requestPermission();
                      if (perm !== "granted") {
                        alert("Please allow notifications in your browser settings.");
                        return;
                      }
                    }
                  }
                  const { updateProfile } = await import("@/context/AuthContext").then(
                    (m) => ({ updateProfile: null as any })
                  );
                  await axiosInstance.patch(`/userupdate/${currentUser?.email}`, {
                    notificationsEnabled: newPref,
                  });
                  window.location.reload();
                } catch (err) {
                  console.error(err);
                }
              }}
            >
              {currentUser?.notificationsEnabled ? "On" : "Off"}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList
          className={`grid w-full ${
            isOwnProfile ? "grid-cols-5" : "grid-cols-4"
          } bg-transparent border-b border-gray-800 rounded-none h-auto`}
        >
          <TabsTrigger value="posts" className={tabClass}>{t("profile.posts")}</TabsTrigger>
          <TabsTrigger value="replies" className={tabClass}>{t("profile.replies")}</TabsTrigger>
          <TabsTrigger value="media" className={tabClass}>Media</TabsTrigger>
          <TabsTrigger value="likes" className={tabClass}>{t("profile.likes")}</TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger value="history" className={tabClass}>
              <div className="flex items-center gap-1.5 justify-center">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                <span>History</span>
              </div>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="posts" className="mt-0">
          {loading ? (
            <EmptyState title="Loading posts…" />
          ) : tweets.length === 0 ? (
            <EmptyState title="No posts yet" sub="When you post, it'll show up here." />
          ) : (
            <div>{tweets.map((tweet: any) => <TweetCard key={tweet._id} tweet={tweet} />)}</div>
          )}
        </TabsContent>

        <TabsContent value="replies" className="mt-0">
          <EmptyState title="No replies yet" sub="When you reply, it'll show up here." />
        </TabsContent>

        <TabsContent value="media" className="mt-0">
          {mediaTweets.length === 0 ? (
            <EmptyState title="No media yet" sub="When you post photos or audio, they'll show up here." />
          ) : (
            <div>{mediaTweets.map((tweet: any) => <TweetCard key={tweet._id} tweet={tweet} />)}</div>
          )}
        </TabsContent>

        <TabsContent value="likes" className="mt-0">
          {likedTweets.length === 0 ? (
            <EmptyState title="No liked posts" sub="Posts you like will appear here." />
          ) : (
            <div>{likedTweets.map((tweet: any) => <TweetCard key={tweet._id} tweet={tweet} />)}</div>
          )}
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="history" className="mt-0 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-950/30 to-purple-950/20 border border-blue-900/40 rounded-2xl p-4">
              <div>
                <h3 className="text-white font-bold text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-400" />
                  Security & Login Sessions
                </h3>
                <p className="text-gray-400 text-xs mt-1">
                  Transparent history of browser type, operating system, device category (desktop, laptop, mobile), IP address, and status.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLoginHistory}
                disabled={historyLoading}
                className="rounded-full border-gray-700 bg-transparent hover:bg-white/10 text-xs text-gray-300 flex items-center gap-1.5 self-start sm:self-center"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${historyLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {historyLoading && loginHistory.length === 0 ? (
              <EmptyState title="Loading login sessions…" />
            ) : loginHistory.length === 0 ? (
              <EmptyState
                title="No login sessions recorded yet"
                sub="Your session details will automatically be logged here for transparency."
              />
            ) : (
              <div className="space-y-3">
                {loginHistory.map((item) => {
                  const isBlocked = item.status === "blocked";
                  const isSuccess = item.status === "success";

                  return (
                    <div
                      key={item._id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isBlocked
                          ? "bg-red-950/10 border-red-900/30 hover:border-red-700/50"
                          : "bg-gray-950/60 border-gray-800 hover:border-gray-700"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2.5 rounded-xl flex-shrink-0 ${
                              item.deviceCategory === "mobile"
                                ? "bg-purple-500/10 text-purple-400"
                                : item.deviceCategory === "laptop"
                                ? "bg-blue-500/10 text-blue-400"
                                : "bg-emerald-500/10 text-emerald-400"
                            }`}
                          >
                            {item.deviceCategory === "mobile" ? (
                              <Smartphone className="h-5 w-5" />
                            ) : item.deviceCategory === "laptop" ? (
                              <Laptop className="h-5 w-5" />
                            ) : (
                              <Monitor className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white font-bold text-sm">
                                {item.browser}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 font-medium">
                                {item.os}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                                  item.deviceCategory === "mobile"
                                    ? "bg-purple-900/30 text-purple-300 border border-purple-800/40"
                                    : item.deviceCategory === "laptop"
                                    ? "bg-blue-900/30 text-blue-300 border border-blue-800/40"
                                    : "bg-emerald-900/30 text-emerald-300 border border-emerald-800/40"
                                }`}
                              >
                                {item.deviceCategory}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Globe className="h-3.5 w-3.5 text-gray-500" />
                                <code className="text-gray-300 bg-gray-900 px-1.5 py-0.5 rounded font-mono">
                                  {item.ipAddress || "127.0.0.1"}
                                </code>
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-gray-500" />
                                {new Date(item.timestamp).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                              </span>
                            </div>

                            {item.reason && (
                              <p className="text-xs text-gray-400 mt-2 font-medium">
                                <span className="text-gray-500">Method / Reason:</span>{" "}
                                {item.reason}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0 sm:self-start">
                          {isSuccess && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Success
                            </span>
                          )}
                          {isBlocked && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                              <XCircle className="h-3.5 w-3.5" />
                              Blocked
                            </span>
                          )}
                          {!isSuccess && !isBlocked && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {item.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      <Editprofile isopen={showEditModal} onclose={() => setShowEditModal(false)} />
    </div>
  );
}

function EmptyState({ title, sub }: { title: string; sub?: string }) {
  return (
    <Card className="bg-transparent border-none">
      <CardContent className="py-16 text-center">
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        {sub && <p className="text-gray-500 text-sm">{sub}</p>}
      </CardContent>
    </Card>
  );
}
