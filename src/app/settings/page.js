"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/LanguageProvider";
import { useAuth } from "@/app/components/AuthProvider";

const G = "linear-gradient(135deg,#f97316,#ec4899)";
const CURRENCIES = ["USD","EUR","GBP","ILS","JPY","AUD","CAD","THB","SGD","AED"];
const STYLES = ["relaxed","cultural","adventure","luxury","business"];
const STYLE_EMOJI = { relaxed:"🏖️", cultural:"🏛️", adventure:"🧗", luxury:"✨", business:"💼" };

const ROLE_BADGE = {
  admin:   { label: "Admin",   bg: "#fef2f2", color: "#dc2626", icon: "⚡" },
  advisor: { label: "Advisor", bg: "#eff6ff", color: "#2563eb", icon: "💼" },
  client:  { label: "Client",  bg: "#f0fdf4", color: "#16a34a", icon: "👤" },
};

const PREFS_KEY = "aigency_prefs";
function loadPrefs() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"); } catch { return {}; }
}
function savePrefs(p) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch {}
}

export default function SettingsPage() {
  const { t, lang, setLang } = useLanguage();
  const { user, profile } = useAuth() || {};
  const [prefs, setPrefs] = useState({});
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setMounted(true); setPrefs(loadPrefs()); }, []);

  function update(key, val) {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    savePrefs(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  if (!mounted) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-orange-300 border-t-transparent animate-spin" /></div>;

  const role = profile?.role || "client";
  const badge = ROLE_BADGE[role] || ROLE_BADGE.client;

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg-page)" }}>
      {/* Header */}
      <div className="px-4 pt-8 pb-4 max-w-lg mx-auto">
        <Link href="/" className="text-sm text-gray-400 font-bold mb-4 inline-block">← {t("back")}</Link>
        <div className="flex items-center gap-2 mb-3">
          <span className="dot-live" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">PERSONALIZE</span>
        </div>
        <h1 className="text-3xl font-black tracking-tighter" style={{ color: "var(--text-main)" }}>⚙️ {t("settings_title")}</h1>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-4">

        {/* Profile / Auth Section */}
        <div className="rounded-[1.75rem] overflow-hidden shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          {user ? (
            /* Logged in */
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: G }}
                >
                  {badge.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-base truncate" style={{ color: "var(--text-main)" }}>
                      {profile?.name || user.email?.split("@")[0] || "Traveler"}
                    </span>
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: badge.bg, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 font-medium truncate">{user.email}</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="flex gap-2">
                  {role === "advisor" && (
                    <Link href="/advisor" className="flex-1 py-2 rounded-xl text-xs font-black text-center text-white" style={{ background: G }}>
                      Advisor Dashboard
                    </Link>
                  )}
                  {role === "admin" && (
                    <Link href="/admin" className="flex-1 py-2 rounded-xl text-xs font-black text-center text-white" style={{ background: G }}>
                      Admin Panel
                    </Link>
                  )}
                  <Link
                    href="/auth"
                    className="flex-1 py-2 rounded-xl text-xs font-black text-center"
                    style={{ background: "var(--bg-page)", color: "var(--text-sub)", border: "2px solid var(--border)" }}
                  >
                    Sign Out
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Logged out */
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: "#f3f4f6" }}
                >
                  👤
                </div>
                <div>
                  <div className="font-black text-base mb-0.5" style={{ color: "var(--text-main)" }}>Not signed in</div>
                  <div className="text-xs text-gray-400">Sign in for sync & backup</div>
                </div>
              </div>
              <Link
                href="/auth"
                className="w-full py-3 rounded-2xl text-sm font-black text-white text-center block"
                style={{ background: G }}
              >
                Sign In / Create Account
              </Link>
              <p className="text-[11px] text-gray-400 text-center mt-2">
                Your preferences are saved locally even without an account
              </p>
            </div>
          )}
        </div>

        {/* Home City */}
        <div className="rounded-[1.75rem] p-6 shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 mb-2 block">🏠 {t("settings_home_city")}</label>
          <input
            value={prefs.homeCity || ""}
            onChange={e => update("homeCity", e.target.value)}
            placeholder="Tel Aviv, Israel"
            className="w-full text-sm font-bold rounded-2xl px-4 py-3 border-2 border-orange-100 focus:border-orange-300 focus:outline-none"
            style={{ background: "var(--bg-page)", color: "var(--text-main)" }}
          />
          <p className="text-xs text-gray-400 mt-1">{t("settings_home_city_hint")}</p>
        </div>

        {/* Preferred Currency */}
        <div className="rounded-[1.75rem] p-6 shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 mb-2 block">💰 {t("settings_currency")}</label>
          <div className="grid grid-cols-5 gap-2">
            {CURRENCIES.map(c => (
              <button key={c} onClick={() => update("currency", c)}
                className="py-2 rounded-xl text-xs font-black transition-all duration-200"
                style={prefs.currency === c
                  ? { background: G, color: "white", boxShadow: "0 4px 16px rgba(249,115,22,0.25)" }
                  : { background: "var(--bg-page)", color: "var(--text-sub)", border: "2px solid var(--border)" }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Travel Style */}
        <div className="rounded-[1.75rem] p-6 shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 mb-2 block">🎯 {t("settings_style")}</label>
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map(s => (
              <button key={s} onClick={() => update("style", s)}
                className="py-2.5 px-3 rounded-xl text-sm font-black capitalize transition-all duration-200 text-left"
                style={prefs.style === s
                  ? { background: G, color: "white" }
                  : { background: "var(--bg-page)", color: "var(--text-sub)", border: "2px solid var(--border)" }}>
                {STYLE_EMOJI[s]} {s}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="rounded-[1.75rem] p-6 shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 mb-2 block">🌐 {t("settings_language")}</label>
          <div className="grid grid-cols-2 gap-2">
            {[{ code: "en", label: "🇺🇸 English" }, { code: "he", label: "🇮🇱 עברית" }].map(l => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className="py-2.5 rounded-xl text-sm font-black transition-all duration-200"
                style={lang === l.code
                  ? { background: G, color: "white" }
                  : { background: "var(--bg-page)", color: "var(--text-sub)", border: "2px solid var(--border)" }}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Budget Range */}
        <div className="rounded-[1.75rem] p-6 shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 mb-2 block">📊 {t("settings_budget_range")}</label>
          <div className="grid grid-cols-3 gap-2">
            {[{ key: "budget", label: "Budget", sub: "Under $1k", emoji: "🎒" }, { key: "mid", label: "Mid-range", sub: "$1k-3k", emoji: "✈️" }, { key: "luxury", label: "Luxury", sub: "$3k+", emoji: "👑" }].map(b => (
              <button key={b.key} onClick={() => update("budgetRange", b.key)}
                className="py-3 rounded-xl text-xs font-black transition-all duration-200"
                style={prefs.budgetRange === b.key
                  ? { background: G, color: "white" }
                  : { background: "var(--bg-page)", color: "var(--text-sub)", border: "2px solid var(--border)" }}>
                <div className="text-lg mb-1">{b.emoji}</div>
                <div>{b.label}</div>
                <div className="font-medium opacity-70">{b.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {saved && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-bold px-6 py-3 rounded-[1.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.15)] z-50 animate-fade-in">
            {t("settings_saved")}
          </div>
        )}

        <div className="rounded-[1.75rem] p-6 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-xs text-gray-400">{t("settings_local_note")}</p>
        </div>
      </div>
    </div>
  );
}
