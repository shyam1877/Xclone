"use client";

import React, { useEffect, useState } from "react";
import { Search, TrendingUp, MoreHorizontal } from "lucide-react";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import axiosInstance from "@/lib/axiosInstance";
import TweetCard from "./TweetCard";
import LoadingSpinner from "./loading-spinner";

const trends = [
  { category: "Technology · Trending", hashtag: "QuantumScience", posts: "12.4K posts" },
  { category: "Sports · Trending", hashtag: "CricketWorldCup", posts: "85.2K posts" },
  { category: "Development · Trending", hashtag: "NextJS15", posts: "5.1K posts" },
  { category: "AI · Trending", hashtag: "Gemini3.5", posts: "24.9K posts" },
  { category: "India · Trending", hashtag: "MonsoonDiaries", posts: "18.3K posts" },
];

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tweets, setTweets] = useState<any[]>([]);
  const [filteredTweets, setFilteredTweets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchTweets();
  }, []);

  // Filter tweets on search query change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTweets(tweets);
      return;
    }

    const query = searchQuery.toLowerCase().replace("#", "");
    const filtered = tweets.filter((tweet) => {
      const contentLower = (tweet.content || "").toLowerCase();
      const usernameLower = (tweet.author?.username || "").toLowerCase();
      const displayNameLower = (tweet.author?.displayName || "").toLowerCase();
      return (
        contentLower.includes(query) ||
        usernameLower.includes(query) ||
        displayNameLower.includes(query)
      );
    });
    setFilteredTweets(filtered);
  }, [searchQuery, tweets]);

  const handleTrendClick = (hashtag: string) => {
    setSearchQuery(`#${hashtag}`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Search Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10 p-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search Twiller"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-gray-900 border-none text-white placeholder-gray-500 rounded-full py-3 focus-visible:ring-1 focus-visible:ring-blue-500 h-10 w-full"
          />
        </div>
      </div>

      {/* Explore Contents */}
      {!searchQuery && (
        <div className="border-b border-gray-800">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Trends for you</h2>
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

      {/* Explore Feed */}
      <div className="divide-y divide-gray-800">
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="font-bold text-lg text-white">
            {searchQuery ? `Search results for "${searchQuery}"` : "Explore Posts"}
          </h3>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Searching tweets...</p>
          </div>
        ) : filteredTweets.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">
            No posts matched your search. Try adjusting your keywords.
          </div>
        ) : (
          filteredTweets.map((tweet) => <TweetCard key={tweet._id} tweet={tweet} />)
        )}
      </div>
    </div>
  );
}
