"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/app/LanguageProvider";
import { motion } from "framer-motion";

const HIDE_ON = ["/plan"];

const TABS = [
  { href: "/",         icon: "🏠", labelKey: "nav_home"     },
  { href: "/trips",    icon: "🗺️", labelKey: "nav_trips"    },
  { href: "/plan",     icon: null,  labelKey: "nav_new",  special: true },
  { href: "/chat",     icon: "🤖", labelKey: "nav_ai",   chatTab: true },
  { href: "/settings", icon: "⚙️", labelKey: "nav_settings" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [hasSavedChat, setHasSavedChat] = useState(false);

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

  if (HIDE_ON.some(p => pathname === p || pathname.startsWith(p + "/"))) return null;

  const isOnChat = pathname.startsWith("/chat");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-0 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto">
        <div className="rounded-[2rem] px-3 py-2 flex items-center justify-around"
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(249,115,22,0.08)",
            border: "1px solid rgba(255,237,213,0.8)"
          }}>
          {TABS.map((tab) => {
            const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
            if (tab.special) {
              return (
                <Link key={tab.href} href={tab.href}
                  className="flex flex-col items-center -mt-5">
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-white text-2xl shadow-lg"
                    style={{ background: "linear-gradient(135deg,#f97316,#ec4899)", boxShadow: "0 8px 24px rgba(249,115,22,0.45)" }}>
                    +
                  </motion.div>
                  <span className="text-[9px] font-black uppercase tracking-[0.1em] text-gray-400 mt-1">{t(tab.labelKey)}</span>
                </Link>
              );
            }
            return (
              <Link key={tab.href} href={tab.href}
                className="flex flex-col items-center gap-1 px-2 py-1 rounded-2xl transition-all">
                <motion.div
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-[0.875rem] flex items-center justify-center text-xl transition-all relative"
                  style={active
                    ? { background: "linear-gradient(135deg,#fff7ed,#ffedd5)", boxShadow: "0 2px 8px rgba(249,115,22,0.2)" }
                    : { background: "transparent" }}>
                  <span style={{ filter: active ? "none" : "grayscale(0.3)" }}>{tab.icon}</span>
                  {tab.chatTab && hasSavedChat && !isOnChat && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: "#f97316" }} />
                  )}
                </motion.div>
                <span className="text-[9px] font-black uppercase tracking-[0.08em] transition-colors"
                  style={{ color: active ? "#f97316" : "#9ca3af" }}>
                  {t(tab.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
