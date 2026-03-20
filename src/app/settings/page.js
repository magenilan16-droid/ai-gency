"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/LanguageProvider";

const G = "linear-gradient(135deg,#f97316,#ec4899)";
const CURRENCIES = ["USD","EUR","GBP","ILS","JPY","AUD","CAD","THB","SGD","AED"];
const STYLES = ["relaxed","cultural","adventure","luxury","business"];
const STYLE_EMOJI = { relaxed:"🏖️", cultural:"🏛️", adventure:"🧗", luxury:"✨", business:"💼" };

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

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg-page)" }}>
      {/* Header */}
      <div className="px-4 pt-8 pb-4 max-w-lg mx-auto">
        <Link href="/" className="text-sm text-gray-400 font-bold mb-4 inline-block">← {t("back")}</Link>
        <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-1">✦ Personalize</p>
        <h1 className="text-3xl font-black" style={{ color: "var(--text-main)" }}>⚙️ {t("settings_title")}</h1>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-4">

        {/* Home City */}
        <div className="rounded-2xl p-4 shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <label className="text-xs font-black text-orange-400 uppercase tracking-widest mb-2 block">🏠 {t("settings_home_city")}</label>
          <input
            value={prefs.homeCity || ""}
            onChange={e => update("homeCity", e.target.value)}
            placeholder="Tel Aviv, Israel"
            className="w-full text-sm font-bold rounded-xl px-3 py-2.5 border-2 border-orange-100 focus:border-orange-300 focus:outline-none"
            style={{ background: "var(--bg-page)", color: "var(--text-main)" }}
          />
          <p className="text-xs text-gray-400 mt-1">{t("settings_home_city_hint")}</p>
        </div>

        {/* Preferred Currency */}
        <div className="rounded-2xl p-4 shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <label className="text-xs font-black text-orange-400 uppercase tracking-widest mb-2 block">💰 {t("settings_currency")}</label>
          <div className="grid grid-cols-5 gap-2">
            {CURRENCIES.map(c => (
              <button key={c} onClick={() => update("currency", c)}
                className="py-2 rounded-xl text-xs font-black transition-all"
                style={prefs.currency === c
                  ? { background: G, color: "white" }
                  : { background: "var(--bg-page)", color: "var(--text-sub)", border: "2px solid var(--border)" }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Travel Style */}
        <div className="rounded-2xl p-4 shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <label className="text-xs font-black text-orange-400 uppercase tracking-widest mb-2 block">🎯 {t("settings_style")}</label>
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map(s => (
              <button key={s} onClick={() => update("style", s)}
                className="py-2.5 px-3 rounded-xl text-sm font-black capitalize transition-all text-left"
                style={prefs.style === s
                  ? { background: G, color: "white" }
                  : { background: "var(--bg-page)", color: "var(--text-sub)", border: "2px solid var(--border)" }}>
                {STYLE_EMOJI[s]} {s}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="rounded-2xl p-4 shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <label className="text-xs font-black text-orange-400 uppercase tracking-widest mb-2 block">🌐 {t("settings_language")}</label>
          <div className="grid grid-cols-2 gap-2">
            {[{ code: "en", label: "🇺🇸 English" }, { code: "he", label: "🇮🇱 עברית" }].map(l => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className="py-2.5 rounded-xl text-sm font-black transition-all"
                style={lang === l.code
                  ? { background: G, color: "white" }
                  : { background: "var(--bg-page)", color: "var(--text-sub)", border: "2px solid var(--border)" }}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Budget Range */}
        <div className="rounded-2xl p-4 shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <label className="text-xs font-black text-orange-400 uppercase tracking-widest mb-2 block">📊 {t("settings_budget_range")}</label>
          <div className="grid grid-cols-3 gap-2">
            {[{ key: "budget", label: "Budget", sub: "Under $1k", emoji: "🎒" }, { key: "mid", label: "Mid-range", sub: "$1k-3k", emoji: "✈️" }, { key: "luxury", label: "Luxury", sub: "$3k+", emoji: "👑" }].map(b => (
              <button key={b.key} onClick={() => update("budgetRange", b.key)}
                className="py-3 rounded-xl text-xs font-black transition-all"
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
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-bold px-6 py-3 rounded-2xl shadow-xl z-50 animate-fade-in">
            {t("settings_saved")}
          </div>
        )}

        <div className="rounded-2xl p-4 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-xs text-gray-400">{t("settings_local_note")}</p>
        </div>
      </div>
    </div>
  );
}
