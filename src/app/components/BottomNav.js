"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/",         icon: "🏠", label: "Home"     },
  { href: "/trips",    icon: "🗺️", label: "Trips"    },
  { href: "/plan",     icon: null,  label: "New",  special: true },
  { href: "/chat",     icon: "🤖", label: "AI"       },
  { href: "/business", icon: "💼", label: "Business" },
];

const HIDE_ON = ["/plan"]; // full-screen flows

export default function BottomNav() {
  const path = usePathname();
  if (HIDE_ON.some(p => path === p || path.startsWith(p + "/"))) return null;

  const G = "linear-gradient(135deg,#f97316,#ec4899)";

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
              className="flex flex-col items-center gap-0.5 py-3 px-3 rounded-xl transition-all flex-1"
              style={active ? {} : {}}>
              <span className="text-xl leading-none" style={active ? {} : { filter: "grayscale(0.5) opacity(0.5)" }}>
                {tab.icon}
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
