"use client";
import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "./ui/card";
import LoadingSpinner from "./loading-spinner";
import TweetCard from "./TweetCard";
import TweetComposer from "./TweetComposer";
import axiosInstance from "@/lib/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const Feed = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [tweets, setTweets] = useState<any[]>([]);
  const [loading, setloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou");
  const latestTweetTimeRef = useRef<string | null>(null);

  const fetchTweets = async () => {
    try {
      setloading(true);
      const res = await axiosInstance.get("/post");
      setTweets(res.data);
      if (res.data && res.data.length > 0) {
        latestTweetTimeRef.current = res.data[0].timestamp;
      } else {
        latestTweetTimeRef.current = new Date().toISOString();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setloading(false);
    }
  };

  const pollTweets = async () => {
    try {
      const res = await axiosInstance.get("/post");
      const fetchedTweets = res.data;

      if (fetchedTweets && fetchedTweets.length > 0) {
        const latestSeenTime = latestTweetTimeRef.current;

        if (latestSeenTime) {
          const newTweets = fetchedTweets.filter((tweet: any) => {
            return new Date(tweet.timestamp) > new Date(latestSeenTime);
          });

          if (newTweets.length > 0) {
            // Check browser notification preferences
            if (
              user?.notificationsEnabled &&
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              newTweets.forEach((tweet: any) => {
                const contentLower = tweet.content.toLowerCase();
                if (contentLower.includes("cricket") || contentLower.includes("science")) {
                  const keyword = contentLower.includes("cricket") ? "cricket" : "science";
                  new Notification(tweet.author.displayName || "Twiller", {
                    body: tweet.content,
                    icon: tweet.author.avatar || "",
                  });
                  const currentLogs = localStorage.getItem("twiller-notification-logs");
                  let logs = [];
                  if (currentLogs) {
                    try { logs = JSON.parse(currentLogs); } catch { logs = []; }
                  }
                  const newLog = {
                    id: Math.random().toString(36).substr(2, 9),
                    keyword,
                    timestamp: new Date().toISOString(),
                    tweet: {
                      _id: tweet._id,
                      content: tweet.content,
                      timestamp: tweet.timestamp,
                      author: {
                        displayName: tweet.author.displayName,
                        username: tweet.author.username,
                        avatar: tweet.author.avatar,
                      },
                    },
                  };
                  localStorage.setItem("twiller-notification-logs", JSON.stringify([newLog, ...logs]));
                }
              });
            }

            setTweets((prev: any[]) => {
              const existingIds = new Set(prev.map((t: any) => t._id));
              const uniqueNew = newTweets.filter((t: any) => !existingIds.has(t._id));
              return [...uniqueNew, ...prev];
            });
          }
        }

        latestTweetTimeRef.current = fetchedTweets[0].timestamp;
      }
    } catch (error) {
      console.error("Polling error:", error);
    }
  };

  useEffect(() => { fetchTweets(); }, []);

  // Real-time synchronization when user updates their profile (avatar, name, etc.)
  useEffect(() => {
    const handleUserUpdated = (e: any) => {
      const updated = e.detail;
      if (!updated) return;
      setTweets((prev) =>
        prev.map((t: any) => {
          const isAuthor =
            t.author?._id === updated._id ||
            t.author === updated._id ||
            (t.author?.email && t.author.email.toLowerCase() === updated.email?.toLowerCase());
          if (isAuthor) {
            return {
              ...t,
              author: {
                ...(typeof t.author === "object" ? t.author : {}),
                _id: updated._id,
                displayName: updated.displayName,
                username: updated.username,
                avatar: updated.avatar,
                verified: updated.verified ?? t.author?.verified,
              },
            };
          }
          return t;
        })
      );
    };

    window.addEventListener("twiller-user-updated", handleUserUpdated);
    return () => window.removeEventListener("twiller-user-updated", handleUserUpdated);
  }, []);

  useEffect(() => {
    const interval = setInterval(pollTweets, 10000);
    return () => clearInterval(interval);
  }, [user?.notificationsEnabled]);

  const handlenewtweet = (newtweet: any) => {
    setTweets((prev: any[]) => [newtweet, ...prev]);
    if (newtweet.timestamp) {
      latestTweetTimeRef.current = newtweet.timestamp;
    }
  };

  // Filter "Following" tab to only show tweets from users the current user follows
  const followingIds: string[] = (user?.following as string[] | undefined) ?? [];
  const displayedTweets =
    activeTab === "following" && followingIds.length > 0
      ? tweets.filter((t: any) => followingIds.includes(String(t.author?._id)))
      : tweets;

  const tabClass = (tab: string) =>
    `flex-1 py-4 text-center font-semibold text-[15px] border-b-2 transition-colors relative ${
      activeTab === tab
        ? "text-white border-blue-500"
        : "text-gray-500 border-transparent hover:text-white hover:bg-white/5"
    }`;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-white">{t("feed.home")}</h1>
        </div>

        {/* Tabs */}
        <div className="flex">
          <button className={tabClass("foryou")} onClick={() => setActiveTab("foryou")}>
            {t("feed.forYou")}
          </button>
          <button className={tabClass("following")} onClick={() => setActiveTab("following")}>
            {t("feed.following")}
          </button>
        </div>
      </div>

      {/* Composer */}
      <TweetComposer onTweetPosted={handlenewtweet} />

      {/* Feed */}
      <div className="divide-y divide-gray-800">
        {loading ? (
          <Card className="bg-black border-none">
            <CardContent className="py-12 text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-gray-400">{t("feed.loading")}</p>
            </CardContent>
          </Card>
        ) : activeTab === "following" && followingIds.length === 0 ? (
          <div className="py-20 text-center px-8">
            <p className="text-white text-2xl font-bold mb-3">{t("feed.welcomeFollowing")}</p>
            <p className="text-gray-500 text-[15px] leading-relaxed">
              {t("feed.followPeople")}
            </p>
          </div>
        ) : displayedTweets.length === 0 ? (
          <div className="py-20 text-center px-8">
            <p className="text-white text-2xl font-bold mb-3">{t("feed.noPosts")}</p>
            <p className="text-gray-500 text-[15px]">
              {activeTab === "following"
                ? t("feed.noFollowingPosts")
                : t("feed.beFirst")}
            </p>
          </div>
        ) : (
          displayedTweets.map((tweet: any) => <TweetCard key={tweet._id} tweet={tweet} />)
        )}
      </div>
    </div>
  );
};

export default Feed;
