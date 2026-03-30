"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/app/LanguageProvider";
import { useAuth } from "@/app/components/AuthProvider";

const HIDE_ON = ["/plan"];

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user, profile } = useAuth() || {};
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

  // Determine account tab based on auth state
  function getAccountTab() {
    if (!user) {
      return { href: "/auth", icon: "👤", label: "Account", dot: null };
    }
    if (profile?.role === "advisor") {
      return { href: "/advisor", icon: "💼", label: "Advisor", dot: null };
    }
    if (profile?.role === "admin") {
      return { href: "/admin", icon: "⚡", label: "Admin", dot: null };
    }
    // logged in as client
    return { href: "/settings", icon: "👤", label: "Profile", dot: "green" };
  }

  const accountTab = getAccountTab();

  const TABS = [
    { href: "/",         icon: "🏠", label: t("nav_home")     },
    { href: "/trips",    icon: "🗺️", label: t("nav_trips")    },
    { href: "/plan",     icon: null,  label: t("nav_new"),  special: true },
    { href: "/chat",     icon: "🤖", label: t("nav_ai"),   chatTab: true },
    { href: accountTab.href, icon: accountTab.icon, label: accountTab.label, accountTab: true, dot: accountTab.dot },
  ];

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
                  className="flex items-center justify-center text-white text-2xl font-light -mt-4 transition-transform active:scale-95"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    background: "#f97316",
                    boxShadow: "0 6px 20px rgba(249,115,22,0.4), 0 2px 8px rgba(249,115,22,0.2)",
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
              className="flex-1 flex flex-col items-center gap-0.5 py-3"
              style={{ transition: "all 0.2s ease" }}
            >
              <span
                className="text-xl leading-none relative"
                style={{
                  opacity: active ? 1 : 0.4,
                  transform: active ? "scale(1.1)" : "scale(1)",
                  transition: "opacity 0.2s ease, transform 0.2s ease",
                  display: "inline-block",
                }}
              >
                {tab.icon}
                {tab.chatTab && hasSavedChat && !isOnChat && (
                  <span
                    className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full border-2 border-white"
                    style={{ background: "#f97316" }}
                  />
                )}
                {tab.dot === "green" && (
                  <span
                    className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full border-2 border-white"
                    style={{ background: "#22c55e" }}
                  />
                )}
              </span>
              <span
                className="text-[10px] font-semibold"
                style={{
                  color: active ? "#f97316" : "#9ca3af",
                  transition: "color 0.2s ease",
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
