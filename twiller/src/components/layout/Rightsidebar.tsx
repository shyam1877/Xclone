"use client";

import React, { useEffect, useState } from "react";
import { Search, BadgeCheck, TrendingUp } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import axiosInstance from "@/lib/axiosInstance";

interface SuggestedUser {
  _id: string;
  username: string;
  displayName: string;
  avatar: string;
  verified?: boolean;
  followers?: string[];
}

interface RightSidebarProps {
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
}

const staticTrends = [
  { category: "Technology · Trending", topic: "#NextJS", posts: "42.1K posts" },
  { category: "India · Trending", topic: "#Cricket", posts: "128K posts" },
  { category: "Science · Trending", topic: "#SpaceX", posts: "56.3K posts" },
  { category: "Trending in Tech", topic: "#TypeScript", posts: "31.2K posts" },
  { category: "AI · Trending", topic: "#Gemini", posts: "18.7K posts" },
];

export default function RightSidebar({ onNavigate, onSearch }: RightSidebarProps) {
  const { user, followUser } = useAuth();
  const { t } = useLanguage();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    fetchSuggestions();
  }, [user?._id]);

  const fetchSuggestions = async () => {
    try {
      const res = await axiosInstance.get("/users/suggestions", {
        params: { userId: user?._id },
      });
      setSuggestions(res.data || []);
    } catch {
      // fallback silently
    }
  };

  const handleFollow = async (targetId: string) => {
    if (!user) return;
    try {
      const result = await followUser(targetId);
      setFollowingMap((prev) => ({ ...prev, [targetId]: result.following }));
      // Refresh suggestions after follow
      if (result.following) {
        setSuggestions((prev) => prev.filter((u) => u._id !== targetId));
      }
    } catch {}
  };

  const isFollowing = (id: string) =>
    followingMap[id] ??
    (user?.following?.includes(id) || false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onNavigate) onNavigate("explore");
    if (onSearch) onSearch(searchValue);
  };

  return (
    <div className="py-3 space-y-4">
      {/* Search */}
      <form onSubmit={handleSearchSubmit}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
          <input
            placeholder={t("rightSidebar.search")}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-900/80 border border-transparent focus:border-blue-500 focus:bg-black text-white placeholder-gray-500 rounded-full text-sm outline-none transition-all"
          />
        </div>
      </form>

      {/* Premium */}
      <Card className="bg-gray-950 border border-gray-800 rounded-2xl">
        <CardContent className="p-4">
          <h3 className="text-white text-[17px] font-extrabold mb-1">
            {user?.currentPlan && user.currentPlan !== "free"
              ? `${user.currentPlan.charAt(0).toUpperCase() + user.currentPlan.slice(1)} ${t("rightSidebar.planActive")}`
              : t("rightSidebar.subscribePremium")}
          </h3>
          <p className="text-gray-400 text-sm mb-3 leading-relaxed">
            {user?.currentPlan && user.currentPlan !== "free"
              ? t("rightSidebar.managePlanDesc")
              : t("rightSidebar.subscribePremiumDesc")}
          </p>
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full px-5 h-9 text-sm transition-all"
            onClick={() => onNavigate?.("subscription")}
          >
            {user?.currentPlan && user.currentPlan !== "free" ? t("rightSidebar.managePlan") : t("rightSidebar.subscribe")}
          </Button>
        </CardContent>
      </Card>

      {/* Trends */}
      <Card className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <h3 className="text-white text-[17px] font-extrabold">{t("rightSidebar.trendsForYou")}</h3>
          </div>
          <div className="divide-y divide-gray-800">
            {staticTrends.map((trend, i) => (
              <button
                key={i}
                className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors group"
                onClick={() => onNavigate?.("explore")}
              >
                <p className="text-gray-500 text-xs">{trend.category}</p>
                <p className="text-white font-bold text-[15px] group-hover:text-blue-400 transition-colors">
                  {trend.topic}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">{trend.posts}</p>
              </button>
            ))}
          </div>
          <button
            className="w-full px-4 py-4 text-blue-400 hover:text-blue-300 text-sm text-left hover:bg-white/5 transition-colors"
            onClick={() => onNavigate?.("explore")}
          >
            {t("rightSidebar.showMore")}
          </button>
        </CardContent>
      </Card>

      {/* Who to follow */}
      {suggestions.length > 0 && (
        <Card className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <h3 className="text-white text-[17px] font-extrabold px-4 pt-4 pb-2">{t("rightSidebar.youMightLike")}</h3>
            <div className="divide-y divide-gray-800">
              {suggestions.map((person) => {
                const followed = isFollowing(person._id);
                return (
                  <div
                    key={person._id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={person.avatar} alt={person.displayName} />
                        <AvatarFallback className="bg-blue-600 text-white font-bold text-sm">
                          {person.displayName?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-white font-bold text-sm truncate">
                            {person.displayName}
                          </span>
                          {person.verified && (
                            <BadgeCheck className="h-4 w-4 text-blue-400 flex-shrink-0 fill-blue-400 stroke-black" />
                          )}
                        </div>
                        <p className="text-gray-500 text-sm truncate">@{person.username}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleFollow(person._id)}
                      className={`rounded-full px-4 h-8 text-sm flex-shrink-0 ml-2 font-bold transition-all ${
                        followed
                          ? "bg-transparent border border-gray-600 text-white hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40"
                          : "bg-white hover:bg-gray-200 text-black"
                      }`}
                    >
                      {followed ? t("rightSidebar.following") : t("rightSidebar.follow")}
                    </Button>
                  </div>
                );
              })}
            </div>
            <button
              className="w-full px-4 py-4 text-blue-400 hover:text-blue-300 text-sm text-left hover:bg-white/5 transition-colors"
              onClick={() => onNavigate?.("explore")}
            >
              {t("rightSidebar.showMore")}
            </button>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="px-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
        {["Terms of Service", "Privacy Policy", "Cookie Policy", "Accessibility", "Ads info"].map((link) => (
          <a key={link} href="#" className="hover:text-gray-400 transition-colors">
            {link}
          </a>
        ))}
        <span>© 2024 X Corp.</span>
      </div>
    </div>
  );
}