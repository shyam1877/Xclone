"use client";

import React, { useEffect, useState } from "react";
import { Search, TrendingUp, MoreHorizontal, Users } from "lucide-react";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import axiosInstance from "@/lib/axiosInstance";
import TweetCard from "./TweetCard";
import LoadingSpinner from "./loading-spinner";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const trends = [
  { category: "Technology · Trending", hashtag: "QuantumScience", posts: "12.4K posts" },
  { category: "Sports · Trending", hashtag: "CricketWorldCup", posts: "85.2K posts" },
  { category: "Development · Trending", hashtag: "NextJS15", posts: "5.1K posts" },
  { category: "AI · Trending", hashtag: "Gemini3.5", posts: "24.9K posts" },
  { category: "India · Trending", hashtag: "MonsoonDiaries", posts: "18.3K posts" },
];

interface ExplorePageProps {
  initialSearch?: string;
}

export default function ExplorePage({ initialSearch = "" }: ExplorePageProps) {
  const { user, followUser } = useAuth();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeResultTab, setActiveResultTab] = useState<"top" | "people" | "media">("top");
  const [tweets, setTweets] = useState<any[]>([]);
  const [filteredTweets, setFilteredTweets] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialSearch) setSearchQuery(initialSearch);
  }, [initialSearch]);

  const fetchTweets = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/post");
      setTweets(res.data);
      setFilteredTweets(res.data);
    } catch (error) {
      console.error("Failed to fetch explore tweets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTweets(); }, []);

  // Filter tweets & people on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTweets(tweets);
      setPeople([]);
      return;
    }

    const query = searchQuery.toLowerCase().replace("#", "");

    // Filter tweets
    const filtered = tweets.filter((tweet) => {
      const contentLower = (tweet.content || "").toLowerCase();
      const usernameLower = (tweet.author?.username || "").toLowerCase();
      const displayNameLower = (tweet.author?.displayName || "").toLowerCase();
      return contentLower.includes(query) || usernameLower.includes(query) || displayNameLower.includes(query);
    });
    setFilteredTweets(filtered);

    // Search users
    axiosInstance
      .get("/users/search", { params: { q: searchQuery } })
      .then((res) => setPeople(res.data || []))
      .catch(() => setPeople([]));
  }, [searchQuery, tweets]);

  const handleTrendClick = (hashtag: string) => {
    setSearchQuery(`#${hashtag}`);
  };

  const handleFollow = async (targetId: string) => {
    if (!user) return;
    try {
      const result = await followUser(targetId);
      setFollowingMap((prev) => ({ ...prev, [targetId]: result.following }));
    } catch {}
  };

  const isFollowingUser = (id: string) =>
    followingMap[id] ?? (user?.following?.includes(id) || false);

  const mediaTweets = filteredTweets.filter((t) => t.image || t.tweetType === "audio");

  const tabClass = (tab: string) =>
    `flex-1 py-3 text-center text-sm font-bold transition-colors border-b-2 ${
      activeResultTab === tab
        ? "text-white border-blue-500"
        : "text-gray-500 border-transparent hover:text-white hover:bg-white/5"
    }`;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Search Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10 p-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder={t("explore.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-gray-900 border-none text-white placeholder-gray-500 rounded-full py-3 focus-visible:ring-1 focus-visible:ring-blue-500 h-10 w-full"
          />
        </div>

        {/* Result tabs (only shown when searching) */}
        {searchQuery && (
          <div className="flex mt-2">
            <button className={tabClass("top")} onClick={() => setActiveResultTab("top")}>Top</button>
            <button className={tabClass("people")} onClick={() => setActiveResultTab("people")}>People</button>
            <button className={tabClass("media")} onClick={() => setActiveResultTab("media")}>Media</button>
          </div>
        )}
      </div>

      {/* Trending (when no search) */}
      {!searchQuery && (
        <div className="border-b border-gray-800">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">{t("rightSidebar.trendsForYou")}</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {trends.map((trend, idx) => (
              <div
                key={idx}
                className="px-4 py-3 hover:bg-gray-900/40 transition-colors cursor-pointer flex justify-between items-start"
                onClick={() => handleTrendClick(trend.hashtag)}
              >
                <div>
                  <span className="text-xs text-gray-500">{trend.category}</span>
                  <div className="text-white font-bold text-base mt-0.5">#{trend.hashtag}</div>
                  <span className="text-xs text-gray-400 mt-1 block">{trend.posts}</span>
                </div>
                <Button variant="ghost" size="sm" className="p-1 rounded-full text-gray-500 hover:bg-gray-900">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search results */}
      {searchQuery && (
        <>
          {/* People tab */}
          {activeResultTab === "people" && (
            <div>
              {people.length === 0 ? (
                <div className="py-16 text-center text-gray-500 text-sm">
                  No people found for "{searchQuery}"
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {people.map((person: any) => {
                    const followed = isFollowingUser(person._id);
                    return (
                      <div
                        key={person._id}
                        className="flex items-center justify-between px-4 py-4 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-12 w-12 flex-shrink-0">
                            <AvatarImage src={person.avatar} alt={person.displayName} />
                            <AvatarFallback className="bg-blue-600 text-white font-bold">
                              {person.displayName?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-white font-bold text-sm truncate">{person.displayName}</p>
                            <p className="text-gray-500 text-sm truncate">@{person.username}</p>
                            <p className="text-gray-500 text-xs mt-0.5">
                              {person.followers?.length ?? 0} followers
                            </p>
                          </div>
                        </div>
                        {person._id !== user?._id && (
                          <Button
                            onClick={() => handleFollow(person._id)}
                            className={`rounded-full px-4 h-8 text-sm flex-shrink-0 ml-2 font-bold transition-all ${
                              followed
                                ? "bg-transparent border border-gray-600 text-white hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40"
                                : "bg-white hover:bg-gray-200 text-black"
                            }`}
                          >
                            {followed ? "Following" : "Follow"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Top / Media tweets */}
          {(activeResultTab === "top" || activeResultTab === "media") && (
            <div>
              <div className="px-4 py-3 border-b border-gray-800">
                <h3 className="font-bold text-lg text-white">
                  {activeResultTab === "media"
                    ? `Media for "${searchQuery}"`
                    : `Search results for "${searchQuery}"`}
                </h3>
              </div>
              {loading ? (
                <div className="py-16 text-center">
                  <LoadingSpinner size="lg" className="mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">Searching tweets...</p>
                </div>
              ) : (activeResultTab === "media" ? mediaTweets : filteredTweets).length === 0 ? (
                <div className="py-16 text-center text-gray-500 text-sm">
                  No {activeResultTab === "media" ? "media" : "posts"} matched your search.
                </div>
              ) : (
                (activeResultTab === "media" ? mediaTweets : filteredTweets).map((tweet) => (
                  <TweetCard key={tweet._id} tweet={tweet} />
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* All posts when no search */}
      {!searchQuery && (
        <div className="divide-y divide-gray-800">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            <h3 className="font-bold text-lg text-white">Explore Posts</h3>
          </div>
          {loading ? (
            <div className="py-16 text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Loading posts...</p>
            </div>
          ) : (
            tweets.map((tweet) => <TweetCard key={tweet._id} tweet={tweet} />)
          )}
        </div>
      )}
    </div>
  );
}
