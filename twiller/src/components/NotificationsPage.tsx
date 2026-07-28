"use client";

import React, { useEffect, useState } from "react";
import { Bell, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface NotificationLog {
  id: string;
  keyword: string;
  timestamp: string;
  tweet: {
    _id: string;
    content: string;
    timestamp: string;
    author: {
      displayName: string;
      username: string;
      avatar: string;
    };
  };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"all" | "mentions">("all");

  const loadNotifications = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("twiller-notification-logs");
      if (stored) {
        try {
          setNotifications(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse notifications logs", e);
        }
      }
    }
  };

  useEffect(() => {
    loadNotifications();

    // Listen for storage changes in case new notifications arrive in background
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "twiller-notification-logs") {
        loadNotifications();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    
    // Polling backup to refresh local state if notifications are added in the same tab
    const interval = setInterval(loadNotifications, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleClearAll = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("twiller-notification-logs", JSON.stringify([]));
      setNotifications([]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold text-white">Notifications</h1>
          </div>
          {notifications.length > 0 && activeSubTab === "all" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-full flex items-center space-x-1"
              onClick={handleClearAll}
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear all</span>
            </Button>
          )}
        </div>

        {/* Sub tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveSubTab("all")}
            className="flex-1 py-3 text-center text-sm font-bold hover:bg-gray-900/50 transition-colors relative"
          >
            <span className={activeSubTab === "all" ? "text-white" : "text-gray-500"}>All</span>
            {activeSubTab === "all" && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("mentions")}
            className="flex-1 py-3 text-center text-sm font-bold hover:bg-gray-900/50 transition-colors relative"
          >
            <span className={activeSubTab === "mentions" ? "text-white" : "text-gray-500"}>Mentions</span>
            {activeSubTab === "mentions" && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-800">
        {activeSubTab === "mentions" ? (
          <Card className="bg-black border-none">
            <CardContent className="py-24 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Bell className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-white">No mentions yet</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  When other users mention you using your @username, those posts will show up here.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : notifications.length === 0 ? (
          <Card className="bg-black border-none">
            <CardContent className="py-24 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Bell className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-white">Nothing to see here — yet</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  When new posts containing your monitored keywords ("cricket" or "science") are posted,
                  they will show up here as browser popups and logs.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notif) => (
            <Card
              key={notif.id}
              className="bg-black border-gray-800 border-x-0 border-t-0 rounded-none hover:bg-gray-950/40 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={notif.tweet.author.avatar}
                      alt={notif.tweet.author.displayName}
                    />
                    <AvatarFallback>{notif.tweet.author.displayName[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1 flex-wrap">
                      <span className="font-bold text-white">
                        {notif.tweet.author.displayName}
                      </span>
                      <span className="text-gray-500 text-sm">
                        @{notif.tweet.author.username}
                      </span>
                      <span className="text-gray-500">·</span>
                      <span className="text-gray-500 text-xs">
                        {new Date(notif.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="ml-auto bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Keyword: {notif.keyword}
                      </span>
                    </div>

                    <div className="text-white text-sm leading-relaxed mt-2">
                      {notif.tweet.content}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
