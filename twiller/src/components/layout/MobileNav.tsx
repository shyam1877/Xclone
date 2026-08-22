"use client";

import React from "react";
import { Home, Search, Bell, Mail, User } from "lucide-react";

interface MobileNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  unreadCount?: number;
}

export default function MobileNav({ currentPage, onNavigate, unreadCount = 0 }: MobileNavProps) {
  const items = [
    { name: "home", icon: Home },
    { name: "explore", icon: Search },
    { name: "notifications", icon: Bell },
    { name: "messages", icon: Mail },
    { name: "profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-800 flex md:hidden">
      {items.map(({ name, icon: Icon }) => {
        const active = currentPage === name;
        return (
          <button
            key={name}
            onClick={() => onNavigate(name)}
            className={`flex-1 flex flex-col items-center justify-center py-3 relative transition-colors ${
              active ? "text-white" : "text-gray-500"
            }`}
          >
            <div className="relative">
              <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 1.75} />
              {name === "notifications" && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            {active && (
              <span className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
