"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/app/LanguageProvider";
import { useAuth } from "@/app/components/AuthProvider";
import { Home, Map, Plus, Bot, User, Briefcase, Zap } from "lucide-react";

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

  function getAccountTab() {
    if (!user) return { href: "/auth", Icon: User, label: "Account", dot: null };
    if (profile?.role === "advisor") return { href: "/advisor", Icon: Briefcase, label: "Advisor", dot: null };
    if (profile?.role === "admin")   return { href: "/admin",   Icon: Zap,       label: "Admin",   dot: null };
    return { href: "/settings", Icon: User, label: "Profile", dot: "green" };
  }

  const accountTab = getAccountTab();

  const TABS = [
    { href: "/",      Icon: Home, label: t("nav_home") },
    { href: "/trips", Icon: Map,  label: t("nav_trips") },
    { href: "/plan",  Icon: null, label: t("nav_new"), special: true },
    { href: "/chat",  Icon: Bot,  label: t("nav_ai"), chatTab: true },
    { href: accountTab.href, Icon: accountTab.Icon, label: accountTab.label, accountTab: true, dot: accountTab.dot },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 nav-float"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="max-w-lg mx-auto flex items-center px-2">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);

          if (tab.special) {
            return (
              <Link key={tab.href} href={tab.href} className="flex-1 flex justify-center py-2">
                <div
                  className="flex items-center justify-center text-white -mt-4 transition-all active:scale-95"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "#0a0a0a",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  <Plus size={20} strokeWidth={2} />
                </div>
              </Link>
            );
          }

          const Icon = tab.Icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center gap-1 py-3 group"
            >
              <span
                className="relative flex items-center justify-center"
                style={{
                  color: active ? "#0a0a0a" : "#a3a3a3",
                  transition: "color 0.15s ease",
                }}
              >
                <Icon size={19} strokeWidth={active ? 2 : 1.75} />
                {tab.chatTab && hasSavedChat && !isOnChat && (
                  <span
                    className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full"
                    style={{ background: "#ea580c" }}
                  />
                )}
                {tab.dot === "green" && (
                  <span
                    className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full"
                    style={{ background: "#16a34a" }}
                  />
                )}
              </span>
              <span
                className="text-[10px] font-medium tracking-wide"
                style={{
                  color: active ? "#0a0a0a" : "#a3a3a3",
                  transition: "color 0.15s ease",
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
