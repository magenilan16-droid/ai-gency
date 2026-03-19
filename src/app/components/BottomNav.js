"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const TABS = [
  { href: "/",         icon: "🏠", label: "Home"     },
  { href: "/trips",    icon: "🗺️", label: "Trips"    },
  { href: "/plan",     icon: null,  label: "New",  special: true },
  { href: "/chat",     icon: "🤖", label: "AI",   chatTab: true },
  { href: "/business", icon: "💼", label: "Business" },
];

const HIDE_ON = ["/plan"];

export default function BottomNav() {
  const path = usePathname();
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
    // Re-check whenever storage changes (e.g. after user saves)
    window.addEventListener("storage", checkChat);
    // Also poll every 3s to catch same-tab changes
    const interval = setInterval(checkChat, 3000);
    return () => { window.removeEventListener("storage", checkChat); clearInterval(interval); };
  }, []);

  if (HIDE_ON.some(p => path === p || path.startsWith(p + "/"))) return null;

  const G = "linear-gradient(135deg,#f97316,#ec4899)";
  const isOnChat = path.startsWith("/chat");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-safe">
      <div
        className="max-w-lg mx-auto flex items-center justify-around rounded-2xl mb-3 shadow-2xl shadow-orange-200/50"
        style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", border: "1px solid #ffedd5" }}
      >
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
              className="relative flex flex-col items-center gap-0.5 py-3 px-3 rounded-xl transition-all flex-1">
              <span className="text-xl leading-none relative" style={active ? {} : { filter: "grayscale(0.5) opacity(0.5)" }}>
                {tab.icon}
                {/* Notification badge for AI chat */}
                {tab.chatTab && hasSavedChat && !isOnChat && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white" style={{ background: "#f97316" }} />
                )}
              </span>
              <span className="text-xs font-black" style={{ color: active ? "#f97316" : "#9ca3af" }}>
                {tab.label}
              </span>
              {active && (
                <span className="w-1 h-1 rounded-full" style={{ background: "#f97316" }} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
