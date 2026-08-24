"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "./firebase";
import axiosInstance from "../lib/axiosInstance";
import { getDeviceInfo } from "../lib/deviceInfo";

interface User {
  _id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio?: string;
  joinedDate: string;
  email: string;
  website: string;
  location: string;
  coverImage?: string;
  notificationsEnabled?: boolean;
  verified?: boolean;
  isPrivate?: boolean;
  followers?: string[];
  following?: string[];
  currentPlan?: string;
  subscription?: string;
  language?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithOtp: (email: string, otp: string) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<{ requiresOtp?: boolean; email?: string; message?: string }>;
  loginWithMicrosoftBrowser: (email: string) => Promise<void>;
  sendLoginOtp: (email: string) => Promise<any>;
  sendSignupOtp: (email: string, username: string, displayName: string) => Promise<any>;
  completeSignup: (email: string, otp: string, username: string, displayName: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    username: string,
    displayName: string
  ) => Promise<void>;
  updateProfile: (profileData: {
    displayName: string;
    bio: string;
    location: string;
    website: string;
    avatar: string;
    coverImage?: string;
    notificationsEnabled?: boolean;
    isPrivate?: boolean;
  }) => Promise<void>;
  followUser: (targetId: string) => Promise<{ following: boolean; followerCount: number }>;
  logout: () => void;
  isLoading: boolean;
  googlesignin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      const storedUser = localStorage.getItem("twitter-user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse stored user", e);
        }
      }
      setIsLoading(false);
      return;
    }
    // Check for existing session
    const unsubcribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser?.email) {
        try {
          const res = await axiosInstance.get("/loggedinuser", {
            params: { email: firebaseUser.email },
          });

          if (res.data) {
            setUser(res.data);
            localStorage.setItem("twitter-user", JSON.stringify(res.data));
          }
        } catch (err) {
          console.log("Failed to fetch user:", err);
        }
      } else {
        setUser(null);
        localStorage.removeItem("twitter-user");
      }
      setIsLoading(false);
    });
    return () => unsubcribe();
  }, []);

  const sendLoginOtp = async (email: string): Promise<any> => {
    try {
      const deviceInfo = getDeviceInfo();
      const res = await axiosInstance.post("/auth/send-login-otp", {
        email,
        ...deviceInfo,
      });
      return res.data;
    } catch (err: any) {
      const data = err.response?.data;
      throw new Error(data?.error || "Failed to send OTP.");
    }
  };

  const loginWithOtp = async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      const deviceInfo = getDeviceInfo();
      const res = await axiosInstance.post("/auth/verify-login-otp", {
        email,
        otp,
        ...deviceInfo,
      });
      const userData = res.data.user;
      if (userData) {
        setUser(userData);
        localStorage.setItem("twitter-user", JSON.stringify(userData));
      } else {
        throw new Error("Login failed: no user data returned.");
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithMicrosoftBrowser = async (email: string) => {
    setIsLoading(true);
    try {
      const deviceInfo = getDeviceInfo();
      const res = await axiosInstance.post("/auth/direct-login", {
        email,
        ...deviceInfo,
      });
      const userData = res.data.user;
      if (userData) {
        setUser(userData);
        localStorage.setItem("twitter-user", JSON.stringify(userData));
      } else {
        throw new Error("Login failed: no user data returned.");
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || "Direct login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPassword = async (email: string, password: string): Promise<{ requiresOtp?: boolean; email?: string; message?: string; otp?: string }> => {
    setIsLoading(true);
    try {
      const deviceInfo = getDeviceInfo();
      const res = await axiosInstance.post("/auth/login-with-password", {
        email,
        password,
        ...deviceInfo,
      });

      if (res.data?.requiresOtp) {
        return {
          requiresOtp: true,
          email: res.data.email || email,
          message: res.data.message,
          otp: res.data.otp,
        };
      }

      const userData = res.data.user;
      if (userData) {
        setUser(userData);
        localStorage.setItem("twitter-user", JSON.stringify(userData));
        return {};
      } else {
        throw new Error("Login failed: no user data returned.");
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendSignupOtp = async (email: string, username: string, displayName: string): Promise<any> => {
    try {
      const deviceInfo = getDeviceInfo();
      const res = await axiosInstance.post("/auth/send-signup-otp", {
        email,
        username,
        displayName,
        ...deviceInfo,
      });
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || "Failed to send verification code.");
    }
  };

  const completeSignup = async (email: string, otp: string, username: string, displayName: string): Promise<void> => {
    setIsLoading(true);
    try {
      const deviceInfo = getDeviceInfo();
      const res = await axiosInstance.post("/auth/complete-signup", {
        email,
        otp,
        username,
        displayName,
        ...deviceInfo,
      });
      const userData = res.data.user;
      if (userData) {
        // Auto-generate avatar if not set
        if (!userData.avatar || userData.avatar === "") {
          const autoAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=200&bold=true&format=png`;
          try {
            await axiosInstance.patch(`/userupdate/${email}`, { avatar: autoAvatar });
            userData.avatar = autoAvatar;
          } catch {}
        }
        setUser(userData);
        localStorage.setItem("twitter-user", JSON.stringify(userData));
        // Signal that profile setup modal should show
        localStorage.setItem("twiller-profile-setup-needed", "true");
      } else {
        throw new Error("Signup failed: no user data returned.");
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || "Signup failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    if (!auth) {
      try {
        const res = await axiosInstance.get("/loggedinuser", {
          params: { email },
        });
        if (res.data) {
          setUser(res.data);
          localStorage.setItem("twitter-user", JSON.stringify(res.data));
        } else {
          throw new Error("No user found with this email. Please sign up.");
        }
      } catch (err: any) {
        throw new Error(err.response?.data?.error || err.message || "Login failed");
      } finally {
        setIsLoading(false);
      }
      return;
    }
    const usercred = await signInWithEmailAndPassword(auth, email, password);
    const firebaseuser = usercred.user;
    const res = await axiosInstance.get("/loggedinuser", {
      params: { email: firebaseuser.email },
    });
    if (res.data) {
      setUser(res.data);
      localStorage.setItem("twitter-user", JSON.stringify(res.data));
    }
    setIsLoading(false);
  };

  const signup = async (
    email: string,
    password: string,
    username: string,
    displayName: string
  ) => {
    setIsLoading(true);
    if (!auth) {
      try {
        const newuser: any = {
          username,
          displayName,
          avatar: "https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg?auto=compress&cs=tinysrgb&w=400",
          email,
        };
        const res = await axiosInstance.post("/register", newuser);
        if (res.data) {
          setUser(res.data);
          localStorage.setItem("twitter-user", JSON.stringify(res.data));
        }
      } catch (error: any) {
        throw new Error(error.response?.data?.error || error.message || "Signup failed");
      } finally {
        setIsLoading(false);
      }
      return;
    }
    const usercred = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = usercred.user;
    const newuser: any = {
      username,
      displayName,
      avatar: user.photoURL || "https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg?auto=compress&cs=tinysrgb&w=400",
      email: user.email,
    };
    const res = await axiosInstance.post("/register", newuser);
    if (res.data) {
      setUser(res.data);
      localStorage.setItem("twitter-user", JSON.stringify(res.data));
    }
    setIsLoading(false);
  };

  const logout = async () => {
    setUser(null);
    if (auth) {
      await signOut(auth);
    }
    localStorage.removeItem("twitter-user");
  };

  const updateProfile = async (profileData: {
    displayName: string;
    bio: string;
    location: string;
    website: string;
    avatar: string;
    coverImage?: string;
    notificationsEnabled?: boolean;
    isPrivate?: boolean;
  }) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const updatedUser: User = { ...user, ...profileData };
      const identifier = user.email || user._id;
      const res = await axiosInstance.patch(
        `/userupdate/${encodeURIComponent(identifier)}`,
        updatedUser
      );
      const savedUser = res.data || updatedUser;
      setUser(savedUser);
      localStorage.setItem("twitter-user", JSON.stringify(savedUser));
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("twiller-user-updated", { detail: savedUser })
        );
      }
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const followUser = async (targetId: string): Promise<{ following: boolean; followerCount: number }> => {
    if (!user) throw new Error("Not logged in");
    const res = await axiosInstance.post(`/follow/${targetId}`, { userId: user._id });
    // Update local user state with refreshed following list
    const updatedUserRes = await axiosInstance.get("/loggedinuser", { params: { email: user.email } });
    if (updatedUserRes.data) {
      setUser(updatedUserRes.data);
      localStorage.setItem("twitter-user", JSON.stringify(updatedUserRes.data));
    }
    return res.data;
  };

  const googlesignin = async () => {
    setIsLoading(true);
    if (!auth) {
      try {
        const email = prompt("Enter mock Google email:", "mockuser@example.com");
        if (!email) {
          setIsLoading(false);
          return;
        }
        let userData;
        try {
          const res = await axiosInstance.get("/loggedinuser", {
            params: { email },
          });
          userData = res.data;
        } catch (err: any) {
          const newuser: any = {
            username: email.split("@")[0],
            displayName: "Mock Google User",
            avatar: "https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg?auto=compress&cs=tinysrgb&w=400",
            email,
          };
          const registerRes = await axiosInstance.post("/register", newuser);
          userData = registerRes.data;
        }
        if (userData) {
          setUser(userData);
          localStorage.setItem("twitter-user", JSON.stringify(userData));
        }
      } catch (error: any) {
        console.error("Mock Google Sign-In Error:", error);
        alert(error.response?.data?.message || error.message || "Login failed");
      } finally {
        setIsLoading(false);
      }
      return;
    }
 
    try {
      const googleauthprovider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, googleauthprovider);
      const firebaseuser = result.user;
 
      if (!firebaseuser?.email) {
        throw new Error("No email found in Google account");
      }
 
      let userData;
 
      try {
        const res = await axiosInstance.get("/loggedinuser", {
          params: { email: firebaseuser.email },
        });
        userData = res.data;
      } catch (err: any) {
        const newuser: any = {
          username: firebaseuser.email.split("@")[0],
          displayName: firebaseuser.displayName || "User",
          avatar: firebaseuser.photoURL || "https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg?auto=compress&cs=tinysrgb&w=400",
          email: firebaseuser.email,
        };
 
        const registerRes = await axiosInstance.post("/register", newuser);
        userData = registerRes.data;
      }
 
      if (userData) {
        setUser(userData);
        localStorage.setItem("twitter-user", JSON.stringify(userData));
      } else {
        throw new Error("Login/Register failed: No user data returned");
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      alert(error.response?.data?.message || error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithOtp,
        loginWithPassword,
        loginWithMicrosoftBrowser,
        sendLoginOtp,
        sendSignupOtp,
        completeSignup,
        signup,
        updateProfile,
        followUser,
        logout,
        isLoading,
        googlesignin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
