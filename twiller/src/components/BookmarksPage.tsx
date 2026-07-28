"use client";

import React, { useEffect, useState } from "react";
import { Bookmark, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axiosInstance";
import TweetCard from "./TweetCard";
import LoadingSpinner from "./loading-spinner";
import { Card, CardContent } from "./ui/card";

export default function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarkedTweets, setBookmarkedTweets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBookmarks = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await axiosInstance.get("/post");
      const allTweets = res.data;

      if (typeof window !== "undefined") {
        const key = `twiller-bookmarks-${user._id}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const bookmarkIds = JSON.parse(stored) as string[];
            const filtered = allTweets.filter((t: any) => bookmarkIds.includes(t._id));
            setBookmarkedTweets(filtered);
          } catch (e) {
            console.error(e);
          }
        } else {
          setBookmarkedTweets([]);
        }
      }
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, [user]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10 px-4 py-3">
        <h1 className="text-xl font-bold text-white">Bookmarks</h1>
        <p className="text-xs text-gray-500">@{user?.username}</p>
      </div>

      {/* Bookmarks List */}
      <div className="divide-y divide-gray-800">
        {loading ? (
          <div className="py-24 text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Loading bookmarks...</p>
          </div>
        ) : bookmarkedTweets.length === 0 ? (
          <Card className="bg-black border-none">
            <CardContent className="py-24 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Bookmark className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-white">Save posts for later</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Don't let the good ones fly away! Bookmark posts to easily find them again in the future.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          bookmarkedTweets.map((tweet) => (
            <TweetCard key={tweet._id} tweet={tweet} />
          ))
        )}
      </div>
    </div>
  );
}
