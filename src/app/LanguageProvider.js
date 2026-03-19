"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translate } from "@/lib/i18n";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("aigency_lang");
      if (saved === "he" || saved === "en") {
        setLangState(saved);
        applyDir(saved);
      }
    } catch {}
  }, []);

  function applyDir(l) {
    if (typeof document === "undefined") return;
    document.documentElement.dir = l === "he" ? "rtl" : "ltr";
    document.documentElement.lang = l;
  }

  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem("aigency_lang", l); } catch {}
    applyDir(l);
  }, []);

  const t = useCallback((key, vars = {}) => translate(lang, key, vars), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

const FALLBACK = { lang: "en", setLang: () => {}, t: (key) => key };

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  return ctx || FALLBACK;
}
