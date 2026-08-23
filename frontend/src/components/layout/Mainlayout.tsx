"use client";
import { useAuth } from "@/context/AuthContext";
import React, { useState, useEffect } from "react";
import LoadingSpinner from "../loading-spinner";
import Sidebar from "./Sidebar";
import RightSidebar from "./Rightsidebar";
import MobileNav from "./MobileNav";
import ProfilePage from "../ProfilePage";
import NotificationsPage from "../NotificationsPage";
import ExplorePage from "../ExplorePage";
import BookmarksPage from "../BookmarksPage";
import MessagesPage from "../MessagesPage";
import SettingsPage from "../SettingsPage";
import SubscriptionPage from "../SubscriptionPage";
import ProfileSetupModal from "../ProfileSetupModal";

const Mainlayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState("home");
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [exploreSearch, setExploreSearch] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  // Show profile setup modal after signup (one-time)
  useEffect(() => {
    if (user && typeof window !== "undefined") {
      const needed = localStorage.getItem("twiller-profile-setup-needed");
      if (needed === "true") {
        setShowProfileSetup(true);
      }
    }
  }, [user]);

  // Listen for custom navigation events from child components (e.g. TweetComposer upgrade button)
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail) setCurrentPage(e.detail);
    };
    window.addEventListener("navigate-to", handler);
    return () => window.removeEventListener("navigate-to", handler);
  }, []);

  const handleProfileSetupComplete = () => {
    setShowProfileSetup(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("twiller-profile-setup-needed");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-4xl font-bold mb-4">X</div>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // If user is not logged in → show children (like login/signup pages)
  if (!user) {
    return <>{children}</>;
  }

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleRightSearch = (query: string) => {
    setExploreSearch(query);
    setCurrentPage("explore");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "profile":
        return <ProfilePage />;
      case "notifications":
        return <NotificationsPage />;
      case "explore":
      case "communities":
        return <ExplorePage initialSearch={exploreSearch} />;
      case "messages":
        return <MessagesPage />;
      case "bookmarks":
        return <BookmarksPage />;
      case "settings":
        return <SettingsPage onNavigate={handleNavigate} />;
      case "subscription":
        return <SubscriptionPage />;
      default:
        return children;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-black text-white flex justify-center pb-16 md:pb-0">
        {/* Left sidebar */}
        <div className="w-20 sm:w-24 md:w-64 border-r border-gray-800 flex-shrink-0">
          <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
        </div>

        {/* Main content */}
        <main className="flex-1 max-w-2xl border-x border-gray-800 min-h-screen">
          {renderPage()}
        </main>

        {/* Right sidebar */}
        <div className="hidden lg:block w-80 p-4 flex-shrink-0">
          <RightSidebar onNavigate={handleNavigate} onSearch={handleRightSearch} />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav
        currentPage={currentPage}
        onNavigate={handleNavigate}
        unreadCount={unreadCount}
      />

      {/* Profile setup modal — shown once after signup */}
      {showProfileSetup && (
        <ProfileSetupModal onComplete={handleProfileSetupComplete} />
      )}
    </>
  );
};

export default Mainlayout;
