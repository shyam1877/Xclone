"use client";

import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  MoreHorizontal,
  Bookmark,
  Mic,
  Trash2,
  Link,
  X as XIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import axiosInstance from "@/lib/axiosInstance";

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, Math.floor((now - then) / 1000));
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface TweetCardProps {
  tweet: any;
  onProfileClick?: (userId: string) => void;
}

export default function TweetCard({ tweet, onProfileClick }: TweetCardProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [tweetstate, settweetstate] = useState(tweet);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [postingReply, setPostingReply] = useState(false);
  const [toast, setToast] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync state if parent passes updated tweet prop
  useEffect(() => {
    settweetstate(tweet);
  }, [tweet]);

  // Real-time synchronization when author updates profile photo/name
  useEffect(() => {
    const handleUserUpdated = (e: any) => {
      const updated = e.detail;
      if (!updated) return;
      const isAuthor =
        tweetstate.author?._id === updated._id ||
        tweetstate.author === updated._id ||
        (tweetstate.author?.email && tweetstate.author.email.toLowerCase() === updated.email?.toLowerCase());
      if (isAuthor) {
        settweetstate((prev: any) => ({
          ...prev,
          author: {
            ...(typeof prev.author === "object" ? prev.author : {}),
            _id: updated._id,
            displayName: updated.displayName,
            username: updated.username,
            avatar: updated.avatar,
            verified: updated.verified ?? prev.author?.verified,
          },
        }));
      }
    };
    window.addEventListener("twiller-user-updated", handleUserUpdated);
    return () => window.removeEventListener("twiller-user-updated", handleUserUpdated);
  }, [tweetstate.author]);

  // Load DB bookmark status
  useEffect(() => {
    if (!user?._id) return;
    axiosInstance
      .get(`/bookmark/check/${tweetstate._id}`, { params: { userId: user._id } })
      .then((res) => setIsBookmarked(res.data?.bookmarked ?? false))
      .catch(() => {});
  }, [user?._id, tweetstate._id]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/bookmark/${tweetstate._id}`, { userId: user._id });
      setIsBookmarked(res.data?.bookmarked ?? !isBookmarked);
      showToast(res.data?.bookmarked ? "Added to Bookmarks" : "Removed from Bookmarks");
    } catch {
      showToast("Failed to update bookmark");
    }
  };

  const likeTweet = async (tweetId: string) => {
    try {
      const res = await axiosInstance.post(`/like/${tweetId}`, { userId: user?._id });
      settweetstate(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const retweetTweet = async (tweetId: string) => {
    try {
      const res = await axiosInstance.post(`/retweet/${tweetId}`, { userId: user?._id });
      settweetstate(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/?tweet=${tweetstate._id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard!");
    } catch {
      showToast("Copy failed — please copy manually");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    // Soft-delete: just hide from UI (no delete route in backend)
    settweetstate((prev: any) => ({ ...prev, _deleted: true }));
    showToast("Post deleted");
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !user || postingReply) return;
    setPostingReply(true);
    try {
      await axiosInstance.post(`/reply/${tweetstate._id}`, {
        author: user._id,
        content: replyContent.trim(),
      });
      settweetstate((prev: any) => ({ ...prev, comments: (prev.comments || 0) + 1 }));
      setReplyContent("");
      setShowReply(false);
      showToast("Reply posted!");
    } catch {
      showToast("Failed to post reply");
    } finally {
      setPostingReply(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num?.toString() ?? "0";
  };

  if (tweetstate._deleted) return null;

  const isLiked = tweetstate.likedBy?.includes(user?._id);
  const isRetweet = tweetstate.retweetedBy?.includes(user?._id);
  const isAudio = tweetstate.tweetType === "audio" && tweetstate.audio;
  const isOwnTweet = tweetstate.author?._id === user?._id || tweetstate.author === user?._id;

  return (
    <>
      <article className="flex gap-3 px-4 py-3 border-b border-gray-800 hover:bg-white/[0.02] transition-colors cursor-pointer group relative">
        {/* Avatar */}
        <div
          className="flex-shrink-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onProfileClick?.(tweetstate.author?._id);
          }}
        >
          <Avatar className="h-10 w-10 ring-2 ring-transparent hover:ring-white/20 transition-all">
            <AvatarImage src={tweetstate.author?.avatar || ""} alt={tweetstate.author?.displayName || ""} />
            <AvatarFallback className="bg-blue-600 text-white font-bold text-sm">
              {tweetstate.author?.displayName?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <span
                className="font-bold text-white text-[15px] truncate hover:underline cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onProfileClick?.(tweetstate.author?._id); }}
              >
                {tweetstate.author?.displayName || "Unknown"}
              </span>
              {tweetstate.author?.verified && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="h-2.5 w-2.5 text-white fill-current" viewBox="0 0 20 20">
                    <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                  </svg>
                </div>
              )}
              <span className="text-gray-500 text-[15px] truncate">@{tweetstate.author?.username || "unknown"}</span>
              <span className="text-gray-600 flex-shrink-0">·</span>
              <span className="text-gray-500 text-sm flex-shrink-0">{timeAgo(tweetstate.timestamp)}</span>
            </div>

            {/* More menu */}
            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-blue-500/10 hover:text-blue-400 text-gray-500 transition-all -mr-1 flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 top-8 w-48 bg-black border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <button
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
                    onClick={handleShare}
                  >
                    <Link className="h-4 w-4 text-gray-400" />
                    Copy link
                  </button>
                  {isOwnTweet && (
                    <button
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete post
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tweet text */}
          {tweetstate.content && (
            <p className="text-white text-[15px] leading-relaxed mb-2 whitespace-pre-wrap break-words">
              {tweetstate.content}
            </p>
          )}

          {/* Tweet image */}
          {tweetstate.image && (
            <div className="mb-3 rounded-2xl overflow-hidden border border-gray-800">
              <img src={tweetstate.image} alt="Tweet image" className="w-full h-auto max-h-[500px] object-cover" />
            </div>
          )}

          {/* Audio Tweet Player */}
          {isAudio && (
            <div className="mb-3 bg-gray-950 border border-gray-800 rounded-2xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Mic className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-blue-400 text-xs font-semibold">🎵 Audio Tweet</span>
                    {tweetstate.audio.duration > 0 && (
                      <span className="text-gray-500 text-xs">
                        · {Math.floor(tweetstate.audio.duration / 60)}:{String(tweetstate.audio.duration % 60).padStart(2, "0")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <audio
                controls
                preload="metadata"
                className="w-full h-10"
                src={
                  tweetstate.audio.url.startsWith("http")
                    ? tweetstate.audio.url
                    : `${process.env.NEXT_PUBLIC_BACKEND_URL || "https://xclone-nesz.onrender.com"}${tweetstate.audio.url}`
                }
              >
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

          {/* Reply form */}
          {showReply && (
            <form
              onSubmit={handleReplySubmit}
              className="mt-3 flex gap-2 items-start"
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={user?.avatar} alt={user?.displayName} />
                <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
                  {user?.displayName?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-gray-900/60 rounded-2xl border border-gray-800 px-3 py-2">
                <textarea
                  autoFocus
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value.slice(0, 280))}
                  placeholder={`Reply to @${tweetstate.author?.username}…`}
                  className="w-full bg-transparent text-white placeholder-gray-600 text-sm leading-relaxed resize-none outline-none min-h-[60px]"
                />
                <div className="flex justify-between items-center mt-2">
                  <button
                    type="button"
                    onClick={() => setShowReply(false)}
                    className="text-gray-500 hover:text-white text-xs transition-colors"
                  >
                    {t("common.cancel")}
                  </button>
                  <Button
                    type="submit"
                    disabled={!replyContent.trim() || postingReply}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/40 text-white font-bold rounded-full px-4 h-7 text-xs transition-all"
                  >
                    {postingReply ? t("composer.posting") : t("tweet.reply")}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between max-w-sm -ml-2 mt-1">
            {/* Comment */}
            <button
              className="flex items-center gap-1.5 p-2 rounded-full text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all group/btn"
              onClick={(e) => { e.stopPropagation(); setShowReply((v) => !v); }}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs group-hover/btn:text-blue-400">{formatNumber(tweetstate.comments || 0)}</span>
            </button>

            {/* Retweet */}
            <button
              className={`flex items-center gap-1.5 p-2 rounded-full transition-all group/btn ${
                isRetweet ? "text-green-400" : "text-gray-500 hover:text-green-400 hover:bg-green-500/10"
              }`}
              onClick={(e) => { e.stopPropagation(); retweetTweet(tweetstate._id); }}
            >
              <Repeat2 className="h-4 w-4" />
              <span className="text-xs">{formatNumber(tweetstate.retweets || 0)}</span>
            </button>

            {/* Like */}
            <button
              className={`flex items-center gap-1.5 p-2 rounded-full transition-all group/btn ${
                isLiked ? "text-pink-500" : "text-gray-500 hover:text-pink-500 hover:bg-pink-500/10"
              }`}
              onClick={(e) => { e.stopPropagation(); likeTweet(tweetstate._id); }}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              <span className="text-xs">{formatNumber(tweetstate.likes || 0)}</span>
            </button>

            {/* Bookmark */}
            <button
              className={`flex items-center gap-1.5 p-2 rounded-full transition-all ${
                isBookmarked ? "text-blue-400" : "text-gray-500 hover:text-blue-400 hover:bg-blue-500/10"
              }`}
              onClick={toggleBookmark}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
            </button>

            {/* Share */}
            <button
              className="flex items-center gap-1.5 p-2 rounded-full text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
              onClick={handleShare}
            >
              <Share className="h-4 w-4" />
            </button>
          </div>
        </div>
      </article>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-2xl animate-fade-in pointer-events-none">
          {toast}
        </div>
      )}
    </>
  );
}
