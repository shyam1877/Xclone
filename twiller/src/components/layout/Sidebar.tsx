"use client";

import React, { useEffect, useState } from "react";
import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  User,
  MoreHorizontal,
  Settings,
  LogOut,
  Users,
  HelpCircle,
  Feather,
  Crown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import TwitterLogo from "../Twitterlogo";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import axiosInstance from "@/lib/axiosInstance";

interface SidebarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export default function Sidebar({ currentPage = "home", onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?._id) return;
    const fetchUnread = async () => {
      try {
        const res = await axiosInstance.get("/notifications/unread-count", {
          params: { userId: user._id },
        });
        setUnreadCount(res.data?.count ?? 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [user?._id]);

  // Clear badge when user navigates to notifications
  useEffect(() => {
    if (currentPage === "notifications" && unreadCount > 0) {
      axiosInstance
        .patch("/notifications/read", null, { params: { userId: user?._id } })
        .catch(() => {});
      setUnreadCount(0);
    }
  }, [currentPage]);

  const navigation = [
    { name: t("sidebar.home"), icon: Home, page: "home" },
    { name: t("sidebar.explore"), icon: Search, page: "explore" },
    { name: t("sidebar.notifications"), icon: Bell, page: "notifications", badge: unreadCount },
    { name: t("sidebar.messages"), icon: Mail, page: "messages" },
    { name: t("sidebar.bookmarks"), icon: Bookmark, page: "bookmarks" },
    { name: t("sidebar.premium"), icon: Crown, page: "subscription" },
    { name: t("sidebar.communities"), icon: Users, page: "communities" },
    { name: t("sidebar.profile"), icon: User, page: "profile" },
  ];

  return (
    <div className="flex flex-col h-screen sticky top-0 bg-black">
      {/* Logo */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => onNavigate?.("home")}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
        >
          <TwitterLogo size="lg" className="text-white" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const active = currentPage === item.page;
          return (
            <button
              key={item.name}
              onClick={() => onNavigate?.(item.page)}
              className={`group flex items-center gap-5 w-full px-3 py-3 rounded-full transition-all hover:bg-white/10 ${
                active ? "font-bold" : "font-normal"
              }`}
            >
              <div className="relative flex-shrink-0">
                <item.icon
                  className={`h-7 w-7 transition-colors ${
                    active ? "text-white" : "text-white/80 group-hover:text-white"
                  }`}
                  strokeWidth={active ? 2.5 : 1.75}
                />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </div>
              <span
                className={`hidden md:block text-xl transition-colors ${
                  active ? "text-white" : "text-white/80 group-hover:text-white"
                }`}
              >
                {item.name}
              </span>
            </button>
          );
        })}

        {/* More */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex items-center gap-5 w-full px-3 py-3 rounded-full hover:bg-white/10 transition-all">
              <MoreHorizontal className="h-7 w-7 text-white/80 group-hover:text-white" strokeWidth={1.75} />
              <span className="hidden md:block text-xl text-white/80 group-hover:text-white">{t("sidebar.more")}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 bg-black border border-gray-800 rounded-2xl shadow-2xl p-1 ml-3"
            side="top"
            align="start"
            sideOffset={8}
          >
            <DropdownMenuItem
              className="text-white hover:bg-white/10 rounded-xl px-4 py-3 cursor-pointer focus:bg-white/10 gap-3"
              onClick={() => onNavigate?.("settings")}
            >
              <Settings className="h-4 w-4 text-gray-400" />
              <span>{t("sidebar.settings")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-white hover:bg-white/10 rounded-xl px-4 py-3 cursor-pointer focus:bg-white/10 gap-3"
              onClick={() => window.open("https://help.twitter.com", "_blank")}
            >
              <HelpCircle className="h-4 w-4 text-gray-400" />
              <span>{t("sidebar.helpCenter")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Post Button */}
        <div className="pt-3 px-1">
          <button
            onClick={() => onNavigate?.("home")}
            className="w-full hidden md:flex items-center justify-center h-13 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg rounded-full py-3 transition-colors gap-2"
          >
            <Feather className="h-5 w-5" />
            {t("sidebar.post")}
          </button>
          {/* Mobile: circular post button */}
          <button
            onClick={() => onNavigate?.("home")}
            className="md:hidden w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold transition-colors mx-auto shadow-lg"
          >
            <Feather className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* User account area */}
      {user && (
        <div className="p-2 pb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="group w-full flex items-center gap-3 p-3 rounded-full hover:bg-white/10 transition-all text-left">
                <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-transparent group-hover:ring-white/20 transition-all">
                  <AvatarImage src={user.avatar} alt={user.displayName} />
                  <AvatarFallback className="bg-blue-600 text-white font-bold">
                    {user.displayName?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col flex-1 min-w-0">
                  <span className="text-white font-semibold text-sm truncate leading-tight">
                    {user.displayName}
                  </span>
                  <span className="text-gray-500 text-sm truncate leading-tight">
                    @{user.username}
                  </span>
                </div>
                <MoreHorizontal className="hidden md:block h-5 w-5 text-gray-500 flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-60 bg-black border border-gray-800 rounded-2xl shadow-2xl p-1"
              align="start"
              sideOffset={8}
            >
              <div className="px-4 py-3 border-b border-gray-800 mb-1">
                <p className="text-white font-bold text-sm truncate">{user.displayName}</p>
                <p className="text-gray-500 text-sm truncate">@{user.username}</p>
              </div>
              <DropdownMenuItem
                className="text-white hover:bg-white/10 rounded-xl px-4 py-3 cursor-pointer focus:bg-white/10 gap-3"
                onClick={() => onNavigate?.("settings")}
              >
                <Settings className="h-4 w-4 text-gray-400" />
                <span>{t("sidebar.settings")}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-800 my-1" />
              <DropdownMenuItem
                className="text-red-400 hover:bg-red-500/10 rounded-xl px-4 py-3 cursor-pointer focus:bg-red-500/10 gap-3"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                <span>{t("sidebar.logout")} @{user.username}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}