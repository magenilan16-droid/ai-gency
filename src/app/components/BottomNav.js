"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/app/LanguageProvider";

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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid #f3f4f6",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="max-w-lg mx-auto flex items-center px-2">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);

          if (tab.special) {
            return (
              <Link key={tab.href} href={tab.href} className="flex-1 flex justify-center py-2">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl font-light -mt-4 transition-transform active:scale-95"
                  style={{
                    background: "#f97316",
                    boxShadow: "0 4px 16px rgba(249,115,22,0.35)",
                  }}
                >
                  +
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center gap-0.5 py-3 transition-opacity"
            >
              <span
                className="text-xl leading-none relative"
                style={{ opacity: active ? 1 : 0.4, transition: "opacity 0.15s" }}
              >
                {tab.icon}
                {tab.chatTab && hasSavedChat && !isOnChat && (
                  <span
                    className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full border-2 border-white"
                    style={{ background: "#f97316" }}
                  />
                )}
              </span>
              <span
                className="text-[10px] font-semibold transition-colors"
                style={{ color: active ? "#f97316" : "#9ca3af" }}
              >
                {t(tab.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
