"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/app/LanguageProvider";

const HIDE_ON = ["/plan"];

export default function BottomNav() {
  const path = usePathname();
  const [hasSavedChat, setHasSavedChat] = useState(false);
  const [dark, setDark] = useState(false);
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    const saved = localStorage.getItem("aigency_dark") === "1";
    setDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("aigency_dark", next ? "1" : "0");
  }

  const TABS = [
    { href: "/",          icon: "🏠", labelKey: "nav_home"     },
    { href: "/trips",     icon: "🗺️", labelKey: "nav_trips"    },
    { href: "/plan",      icon: null,  labelKey: "nav_new",  special: true },
    { href: "/chat",      icon: "🤖", labelKey: "nav_ai",   chatTab: true },
    { href: "/settings",  icon: "⚙️", labelKey: "nav_settings" },
  ];

  useEffect(() => {
    function checkChat() {
      try {
        const raw = localStorage.getItem("aigency_chat_history");
        if (!raw) { setHasSavedChat(false); return; }
        const data = JSON.parse(raw);
        setHasSavedChat(Array.isArray(data.messages) && data.messages.length > 1);
      } catch { setHasSavedChat(false); }
    }
    checkChat();
    window.addEventListener("storage", checkChat);
    const interval = setInterval(checkChat, 3000);
    return () => { window.removeEventListener("storage", checkChat); clearInterval(interval); };
  }, []);

  if (HIDE_ON.some(p => path === p || path.startsWith(p + "/"))) return null;

  const G = "linear-gradient(135deg,#f97316,#ec4899)";
  const isOnChat = path.startsWith("/chat");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-safe">
      <div
        className="max-w-lg mx-auto rounded-2xl mb-3 shadow-2xl shadow-orange-200/50"
        style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", border: "1px solid #ffedd5" }}
      >
        {/* Top bar: language + dark mode */}
        <div className="flex justify-between items-center px-3 pt-1.5">
          <button
            onClick={toggleDark}
            className="text-sm leading-none hover:scale-110 transition-transform"
            title={dark ? t("light_mode_title") : t("dark_mode_title")}
          >
            {dark ? "☀️" : "🌙"}
          </button>
          <button
            onClick={() => setLang(lang === "en" ? "he" : "en")}
            className="text-base leading-none hover:scale-110 transition-transform"
            title={lang === "en" ? t("switch_to_hebrew") : t("switch_to_english")}
          >
            {lang === "en" ? "🇮🇱" : "🇺🇸"}
          </button>
        </div>

        <div className="flex items-center justify-around pb-2">
          {TABS.map(tab => {
            const active = tab.href === "/" ? path === "/" : path.startsWith(tab.href);
            if (tab.special) return (
              <Link key="new" href="/plan"
                className="flex flex-col items-center justify-center -mt-5 w-14 h-14 rounded-2xl shadow-xl shadow-orange-300 hover:-translate-y-1 transition-all"
                style={{ background: G }}>
                <span className="text-white font-black text-2xl leading-none">+</span>
              </Link>
            );
            return (
              <Link key={tab.href} href={tab.href}
                className="relative flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all flex-1">
                <span className="text-xl leading-none relative" style={active ? {} : { filter: "grayscale(0.5) opacity(0.5)" }}>
                  {tab.icon}
                  {tab.chatTab && hasSavedChat && !isOnChat && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white" style={{ background: "#f97316" }} />
                  )}
                </span>
                <span className="text-xs font-black" style={{ color: active ? "#f97316" : "#9ca3af" }}>
                  {t(tab.labelKey)}
                </span>
                {active && (
                  <span className="w-1 h-1 rounded-full" style={{ background: "#f97316" }} />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
