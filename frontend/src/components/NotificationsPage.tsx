"use client";

import React, { useEffect, useState } from "react";
import { Bell, Trash2, Heart, UserPlus, Repeat2, MessageCircle, AtSign } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import axiosInstance from "@/lib/axiosInstance";

interface NotificationLog {
  id: string;
  keyword: string;
  timestamp: string;
  tweet: {
    _id: string;
    content: string;
    timestamp: string;
    author: { displayName: string; username: string; avatar: string };
  };
}

interface SocialNotification {
  _id: string;
  type: "like" | "follow" | "retweet" | "reply" | "mention";
  sender: { _id: string; displayName: string; username: string; avatar: string };
  tweet?: { content: string };
  read: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000));
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
  like:    { icon: Heart,          color: "text-pink-400",  label: "liked your post" },
  follow:  { icon: UserPlus,       color: "text-blue-400",  label: "followed you" },
  retweet: { icon: Repeat2,        color: "text-green-400", label: "reposted your post" },
  reply:   { icon: MessageCircle,  color: "text-blue-400",  label: "replied to your post" },
  mention: { icon: AtSign,         color: "text-blue-400",  label: "mentioned you" },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [socialNotifs, setSocialNotifs] = useState<SocialNotification[]>([]);
  const [keywordLogs, setKeywordLogs] = useState<NotificationLog[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"all" | "mentions">("all");
  const [loadingSocial, setLoadingSocial] = useState(false);

  const loadKeywordLogs = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("twiller-notification-logs");
      if (stored) {
        try { setKeywordLogs(JSON.parse(stored)); } catch {}
      }
    }
  };

  const fetchSocialNotifs = async () => {
    if (!user?._id) return;
    setLoadingSocial(true);
    try {
      const res = await axiosInstance.get("/notifications", { params: { userId: user._id } });
      setSocialNotifs(res.data || []);
    } catch {}
    finally { setLoadingSocial(false); }
  };

  useEffect(() => {
    loadKeywordLogs();
    fetchSocialNotifs();

    // Mark all read
    if (user?._id) {
      axiosInstance.patch("/notifications/read", null, { params: { userId: user._id } }).catch(() => {});
    }

    const interval = setInterval(() => {
      loadKeywordLogs();
      fetchSocialNotifs();
    }, 15000);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "twiller-notification-logs") loadKeywordLogs();
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
    };
  }, [user?._id]);

  const handleClearKeywords = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("twiller-notification-logs", JSON.stringify([]));
      setKeywordLogs([]);
    }
  };

  const subTabClass = (tab: string) =>
    `flex-1 py-3 text-center text-sm font-bold hover:bg-gray-900/50 transition-colors relative ${
      activeSubTab === tab ? "text-white" : "text-gray-500"
    }`;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">{t("notifications.title")}</h1>
          {keywordLogs.length > 0 && activeSubTab === "all" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-full flex items-center gap-1"
              onClick={handleClearKeywords}
            >
              <Trash2 className="h-4 w-4" />
              <span>{t("notifications.clearAll")}</span>
            </Button>
          )}
        </div>

        {/* Sub tabs */}
        <div className="flex border-b border-gray-800">
          <button onClick={() => setActiveSubTab("all")} className={subTabClass("all")}>
            <span>{t("notifications.all")}</span>
            {activeSubTab === "all" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-full" />
            )}
          </button>
          <button onClick={() => setActiveSubTab("mentions")} className={subTabClass("mentions")}>
            <span>Mentions</span>
            {activeSubTab === "mentions" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {activeSubTab === "mentions" ? (
        <EmptyBell title="No mentions yet" sub="When other users mention you using your @username, those posts will show up here." />
      ) : (
        <div className="divide-y divide-gray-800">
          {/* Social notifications */}
          {loadingSocial && socialNotifs.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">{t("common.loading")}</div>
          ) : socialNotifs.length === 0 && keywordLogs.length === 0 ? (
            <EmptyBell
              title={t("notifications.noNotifications")}
              sub={t("notifications.noNotificationsDesc")}
            />
          ) : (
            <>
              {/* Social interaction notifications */}
              {socialNotifs.map((notif) => {
                const cfg = typeConfig[notif.type] ?? typeConfig.like;
                const Icon = cfg.icon;
                return (
                  <div
                    key={notif._id}
                    className={`px-4 py-4 flex gap-3 hover:bg-white/[0.02] transition-colors ${
                      !notif.read ? "border-l-2 border-blue-500/60 bg-blue-500/[0.03]" : ""
                    }`}
                  >
                    <div className={`mt-1 flex-shrink-0 ${cfg.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-1">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={notif.sender?.avatar} alt={notif.sender?.displayName} />
                          <AvatarFallback className="bg-blue-600 text-white font-bold text-sm">
                            {notif.sender?.displayName?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-bold text-sm">{notif.sender?.displayName}</span>
                            <span className="text-gray-500 text-sm">{cfg.label}</span>
                            <span className="text-gray-600 text-xs ml-auto">{timeAgo(notif.createdAt)}</span>
                          </div>
                          {notif.tweet?.content && (
                            <p className="text-gray-500 text-sm mt-1 leading-relaxed line-clamp-2">
                              {notif.tweet.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Keyword browser notifications (from localStorage) */}
              {keywordLogs.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-gray-950/40">
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Keyword Alerts</p>
                  </div>
                  {keywordLogs.map((notif) => (
                    <div key={notif.id} className="px-4 py-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={notif.tweet.author.avatar} alt={notif.tweet.author.displayName} />
                          <AvatarFallback>{notif.tweet.author.displayName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-white text-sm">{notif.tweet.author.displayName}</span>
                            <span className="text-gray-500 text-sm">@{notif.tweet.author.username}</span>
                            <span className="text-gray-500 text-xs">·</span>
                            <span className="text-gray-500 text-xs">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span className="ml-auto bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {notif.keyword}
                            </span>
                          </div>
                          <p className="text-white text-sm leading-relaxed">{notif.tweet.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyBell({ title, sub }: { title: string; sub: string }) {
  return (
    <Card className="bg-black border-none">
      <CardContent className="py-24 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Bell className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="text-gray-400 text-sm leading-relaxed">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}
