"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import translations, { LanguageCode } from "../lib/translations";

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  // Load language from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("twiller-language") as LanguageCode | null;
      if (stored && translations[stored]) {
        setLanguageState(stored);
      } else {
        // Also check user data in localStorage for server-persisted language
        try {
          const userData = localStorage.getItem("twitter-user");
          if (userData) {
            const user = JSON.parse(userData);
            if (user.language && translations[user.language as LanguageCode]) {
              setLanguageState(user.language as LanguageCode);
              localStorage.setItem("twiller-language", user.language);
            }
          }
        } catch {}
      }
    }
  }, []);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("twiller-language", lang);
      // Also update the stored user data
      try {
        const userData = localStorage.getItem("twitter-user");
        if (userData) {
          const user = JSON.parse(userData);
          user.language = lang;
          localStorage.setItem("twitter-user", JSON.stringify(user));
        }
      } catch {}
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      const langTranslations = translations[language];
      if (langTranslations && langTranslations[key]) {
        return langTranslations[key];
      }
      // Fallback to English
      if (translations.en[key]) {
        return translations.en[key];
      }
      // Return the key itself as last resort
      return key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
