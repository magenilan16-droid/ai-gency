"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/LanguageProvider";

const G = "linear-gradient(135deg,#f97316,#ec4899)";

const WMO_EMOJI = {
  0:"☀️",1:"🌤️",2:"⛅",3:"☁️",45:"🌫️",48:"🌫️",
  51:"🌦️",53:"🌦️",55:"🌧️",61:"🌧️",63:"🌧️",65:"🌧️",
  71:"❄️",73:"❄️",75:"❄️",80:"🌦️",81:"🌧️",82:"⛈️",95:"⛈️",
};
function wmoEmoji(code) { return WMO_EMOJI[code] ?? "🌡️"; }

function WeatherBadge({ destination, dateStr }) {
  const [weather, setWeather] = useState(null);
  useEffect(() => {
    if (!destination || !dateStr) return;
    if (new Date(dateStr) < new Date()) return;
    let cancelled = false;
    async function load() {
      try {
        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination.split(",")[0])}&count=1&language=en&format=json`).then(r => r.json());
        const loc = geo.results?.[0];
        if (!loc || cancelled) return;
        const dateOnly = dateStr.split("T")[0];
        const wx = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&daily=weathercode,temperature_2m_max&start_date=${dateOnly}&end_date=${dateOnly}&timezone=auto`).then(r => r.json());
        if (cancelled) return;
        const code = wx.daily?.weathercode?.[0];
        const temp = wx.daily?.temperature_2m_max?.[0];
        if (code != null && temp != null) setWeather({ emoji: wmoEmoji(code), temp: Math.round(temp) });
      } catch {}
    }
    load();
    return () => { cancelled = true; };
  }, [destination, dateStr]);
  if (!weather) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#fff7ed", color: "#f97316" }}>
      {weather.emoji} {weather.temp}°
    </span>
  );
}

function getAllTrips() {
  if (typeof window === "undefined") return [];
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("aigency_trip_")) {
      try { out.push({ id: k.replace("aigency_trip_", ""), ...JSON.parse(localStorage.getItem(k)) }); }
      catch {}
    }
  }
  return out.sort((a, b) => b.id.localeCompare(a.id));
}

const DEST_COLORS = {
  japan:"#FF6B6B",tokyo:"#FF6B6B",paris:"#667eea",france:"#667eea",
  italy:"#11998e",rome:"#f7971e",greece:"#2980B9",spain:"#ee0979",
  thailand:"#f7971e",bali:"#11998e","new york":"#4776E6",london:"#4776E6",
  dubai:"#f7971e",israel:"#2980B9","tel aviv":"#11998e",
};
function destColor(d) {
  if (!d) return "#f97316";
  const k = d.toLowerCase();
  for (const [key, val] of Object.entries(DEST_COLORS)) { if (k.includes(key)) return val; }
  return "#f97316";
}
function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}
const STYLE_E = { adventure:"🧗", relaxed:"🏖️", cultural:"🏛️", luxury:"✨", business:"💼" };

// ─── WELCOME PAGE (new users) ──────────────────────────────────────────────
function WelcomePage() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);

  const FEATURES = [
    { icon: "🤖", title: t("feature_ai_title"), desc: t("feature_ai_desc") },
    { icon: "💰", title: t("feature_budget_title"), desc: t("feature_budget_desc") },
    { icon: "🗓️", title: t("feature_daybyday_title"), desc: t("feature_daybyday_desc") },
    { icon: "🔗", title: t("feature_share_title"), desc: t("feature_share_desc") },
    { icon: "🧳", title: t("feature_packing_title"), desc: t("feature_packing_desc") },
    { icon: "🌦️", title: t("feature_weather_title"), desc: t("feature_weather_desc") },
  ];

  const EXAMPLES = [
    { dest: "Tokyo, Japan", days: 7, style: "cultural", budget: "$2,400", emoji: "🗾" },
    { dest: "Bali, Indonesia", days: 10, style: "relaxed", budget: "$1,800", emoji: "🌺" },
    { dest: "Paris, France", days: 5, style: "luxury", budget: "$3,200", emoji: "🗼" },
    { dest: "Barcelona, Spain", days: 6, style: "adventure", budget: "$2,100", emoji: "🇪🇸" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)", overflowX: "hidden" }}>

      {/* ── Hero ── */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-5 pt-16 pb-24 text-center overflow-hidden">

        {/* Background orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "linear-gradient(135deg,#f97316,#ec4899)", marginTop: "-100px" }} />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full opacity-8 blur-3xl pointer-events-none"
          style={{ background: "#667eea" }} />

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black mb-6 transition-all duration-700"
          style={{
            borderColor: "#ffedd5",
            background: "rgba(255,237,213,0.6)",
            color: "#f97316",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(12px)",
          }}
        >
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          {t("hero_badge_text")}
        </div>

        {/* Headline */}
        <h1
          className="text-5xl sm:text-6xl font-black leading-none mb-4 transition-all duration-700 delay-100"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)" }}
        >
          <span style={{ color: "var(--text-main)" }}>{t("hero_headline_1")}</span>
          <br />
          <span style={{
            background: G,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            {t("hero_headline_2")}
          </span>
          <span style={{ color: "var(--text-main)" }}> ✈️</span>
        </h1>

        {/* Sub */}
        <p
          className="text-base sm:text-lg max-w-sm mx-auto leading-relaxed mb-8 transition-all duration-700 delay-150"
          style={{
            color: "var(--text-sub)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
          }}
        >
          {t("hero_subtitle")}
        </p>

        {/* CTA */}
        <div
          className="flex flex-col sm:flex-row gap-3 items-center justify-center transition-all duration-700 delay-200"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)" }}
        >
          <Link
            href="/plan"
            className="flex items-center gap-2 text-white font-black text-base px-8 py-4 rounded-2xl shadow-xl hover:-translate-y-1 transition-all"
            style={{ background: G, boxShadow: "0 8px 32px rgba(249,115,22,0.35)" }}
          >
            {t("hero_cta_main")}
            <span className="text-white/80">→</span>
          </Link>
          <Link
            href="/trips"
            className="text-sm font-bold px-6 py-4 rounded-2xl border-2 transition-all hover:bg-orange-50"
            style={{ borderColor: "#ffedd5", color: "var(--text-sub)" }}
          >
            {t("view_examples_btn")}
          </Link>
        </div>

        {/* Floating example cards */}
        <div
          className="mt-12 w-full max-w-sm mx-auto transition-all duration-700 delay-300"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}
        >
          <div className="grid grid-cols-2 gap-2">
            {EXAMPLES.map((ex, i) => (
              <Link key={i} href="/plan"
                className="rounded-2xl p-3 text-left hover:-translate-y-1 transition-all cursor-pointer"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
              >
                <div className="text-2xl mb-1">{ex.emoji}</div>
                <div className="font-black text-xs" style={{ color: "var(--text-main)" }}>{ex.dest}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{ex.days} days · {ex.budget}</div>
                <div className="text-xs font-bold mt-1" style={{ color: "#f97316" }}>{ex.style}</div>
              </Link>
            ))}
          </div>
          <p className="text-center text-xs mt-3" style={{ color: "var(--text-muted)" }}>
            {t("click_destination_hint")}
          </p>
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="px-5 pb-16 max-w-lg mx-auto">
        <h2 className="text-2xl font-black text-center mb-2" style={{ color: "var(--text-main)" }}>
          {t("how_it_works_title")}
        </h2>
        <p className="text-center text-sm mb-8" style={{ color: "var(--text-sub)" }}>
          {t("three_steps_subtitle")}
        </p>
        <div className="space-y-4">
          {[
            { n: "1", icon: "💬", title: t("step1_title"), desc: t("step1_desc") },
            { n: "2", icon: "⚡", title: t("step2_title"), desc: t("step2_desc") },
            { n: "3", icon: "✈️", title: t("step3_title"), desc: t("step3_desc") },
          ].map(step => (
            <div key={step.n} className="flex gap-4 items-start rounded-2xl p-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                style={{ background: G }}>
                {step.n}
              </div>
              <div>
                <div className="font-black text-sm mb-0.5" style={{ color: "var(--text-main)" }}>{step.icon} {step.title}</div>
                <div className="text-xs leading-relaxed" style={{ color: "var(--text-sub)" }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features grid ── */}
      <div className="px-5 pb-16 max-w-lg mx-auto">
        <h2 className="text-2xl font-black text-center mb-8" style={{ color: "var(--text-main)" }}>
          {t("features_title")}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((f, i) => (
            <div key={i} className="rounded-2xl p-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-black text-sm mb-1" style={{ color: "var(--text-main)" }}>{f.title}</div>
              <div className="text-xs leading-relaxed" style={{ color: "var(--text-sub)" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Final CTA ── */}
      <div className="px-5 pb-32 max-w-lg mx-auto">
        <div className="rounded-3xl p-8 text-white text-center relative overflow-hidden" style={{ background: G }}>
          <div className="absolute top-0 right-0 text-8xl opacity-10 leading-none font-black -mt-2 -mr-2">✈️</div>
          <div className="relative">
            <div className="text-4xl mb-3">🌍</div>
            <h2 className="text-2xl font-black mb-2">{t("final_cta_title")}</h2>
            <p className="text-white/70 text-sm mb-6">
              {t("final_cta_subtitle")}
            </p>
            <Link href="/plan"
              className="inline-flex items-center gap-2 bg-white font-black text-sm px-8 py-3.5 rounded-2xl shadow-lg hover:-translate-y-0.5 transition-all"
              style={{ color: "#f97316" }}>
              {t("final_cta_btn")}
            </Link>
          </div>
        </div>
      </div>

      {/* For Agents Footer Link */}
      <div className="text-center py-6 pb-28">
        <Link href="/for-agents"
          className="text-xs font-bold text-gray-400 hover:text-orange-400 transition-colors">
          ✈️ Are you a travel agent? Get your free referral link →
        </Link>
      </div>
    </div>
  );
}

// ─── DASHBOARD (returning users) ───────────────────────────────────────────
function Dashboard({ trips }) {
  const { t } = useLanguage();

  const upcoming = trips.filter(tr => tr.form?.startDate && daysUntil(tr.form.startDate) >= 0).slice(0, 1)[0];
  const recent = trips.slice(0, 3);
  const countries = [...new Set(trips.map(tr => tr.destination?.split(",").pop()?.trim()).filter(Boolean))];
  const totalBudget = trips.reduce((s, tr) => s + (tr.total_estimated_cost || 0), 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      {/* Header */}
      <div className="px-4 sm:px-6 pt-8 pb-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-1">✦ {t("travel_os")}</p>
            <h1 className="text-3xl font-black" style={{ color: "var(--text-main)" }}>{t("your_dashboard")}</h1>
          </div>
          <span className="text-2xl font-black">✈️ <span style={{ background: G, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>AI-gency</span></span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-5 pb-8">

        {/* Upcoming trip hero */}
        {upcoming && (
          <Link href={`/trip/${upcoming.id}`}>
            <div className="rounded-3xl p-6 text-white relative overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-all"
              style={{ background: `linear-gradient(135deg,${destColor(upcoming.destination)},${destColor(upcoming.destination)}99)` }}>
              <div className="absolute top-0 right-0 text-8xl opacity-10 font-black -mt-2 -mr-2">{STYLE_E[upcoming.style] || "✈️"}</div>
              <div className="relative">
                <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-1">
                  {(() => {
                    const d = daysUntil(upcoming.form?.startDate);
                    if (d === 0) return t("today_badge");
                    if (d === 1) return t("tomorrow_badge");
                    return t("in_x_days", { n: d });
                  })()}
                </p>
                <h2 className="text-2xl font-black mb-1">{upcoming.destination}</h2>
                <p className="text-white/70 text-sm">{upcoming.form?.startDate} → {upcoming.form?.endDate} · {upcoming.days} {t("days")} · {upcoming.currency} {upcoming.total_estimated_cost?.toLocaleString()}</p>
                <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2 text-sm font-bold">{t("open_trip")} →</div>
              </div>
            </div>
          </Link>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: "✈️", value: trips.length, labelKey: "stat_trips", href: "/trips" },
            { icon: "🌍", value: countries.length, labelKey: "stat_countries", href: "/countries" },
            { icon: "💰", value: `$${Math.round(totalBudget/1000)}k`, labelKey: "stat_planned", href: "/trips" },
          ].map(s => (
            <Link key={s.labelKey} href={s.href}
              className="rounded-2xl border p-4 text-center shadow-sm hover:-translate-y-0.5 transition-all active:scale-95"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{ color: "var(--text-main)" }}>{s.value}</div>
              <div className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{t(s.labelKey)}</div>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-black mb-3" style={{ color: "var(--text-main)" }}>{t("quick_actions")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "✈️", labelKey: "new_ai_trip", descKey: "chat_based_planning", href: "/plan", color: G },
              { icon: "🤖", labelKey: "ask_ai_assistant", descKey: "plan_tips_suggestions", href: "/chat", color: "linear-gradient(135deg,#f97316,#f59e0b)" },
              { icon: "💼", labelKey: "business_trip_label", descKey: "per_diems_expenses", href: "/business", color: "linear-gradient(135deg,#8b5cf6,#6366f1)" },
              { icon: "🌍", labelKey: "explore_countries", descKey: "discover_destinations", href: "/countries", color: "linear-gradient(135deg,#0d9488,#0ea5e9)" },
            ].map(a => (
              <Link key={a.labelKey} href={a.href}
                className="rounded-2xl p-4 text-white hover:-translate-y-0.5 transition-all shadow-md"
                style={{ background: a.color }}>
                <div className="text-2xl mb-2">{a.icon}</div>
                <div className="font-black text-sm">{t(a.labelKey)}</div>
                <div className="text-white/70 text-xs mt-0.5">{t(a.descKey)}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Smart Tools */}
        <div>
          <h2 className="text-lg font-black mb-3" style={{ color: "var(--text-main)" }}>🛠️ {t("smart_tools")}</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/budget" className="rounded-2xl p-4 text-white shadow-md hover:-translate-y-0.5 transition-all" style={{ background: "linear-gradient(135deg,#0d9488,#0ea5e9)" }}>
              <div className="text-2xl mb-2">💰</div>
              <div className="font-black text-sm">{t("feature_budget_title")}</div>
              <div className="text-white/70 text-xs mt-0.5">{t("feature_budget_desc")}</div>
            </Link>
            <Link href="/compare" className="rounded-2xl p-4 text-white shadow-md hover:-translate-y-0.5 transition-all" style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }}>
              <div className="text-2xl mb-2">⚖️</div>
              <div className="font-black text-sm">{t("compare_title")}</div>
              <div className="text-white/70 text-xs mt-0.5">{t("compare_desc")}</div>
            </Link>
          </div>
        </div>

        {/* Recent trips */}
        {recent.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black" style={{ color: "var(--text-main)" }}>{t("recent_trips")}</h2>
              <Link href="/trips" className="text-xs font-black text-orange-400 hover:text-orange-600 transition-colors">{t("see_all")} →</Link>
            </div>
            <div className="space-y-3">
              {recent.map(tr => {
                const color = destColor(tr.destination);
                const d = daysUntil(tr.form?.startDate);
                return (
                  <Link key={tr.id} href={`/trip/${tr.id}`}
                    className="flex items-center gap-4 rounded-2xl border p-4 shadow-sm hover:-translate-y-0.5 transition-all"
                    style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: `${color}20` }}>
                      {STYLE_E[tr.style] || "🌍"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-sm truncate" style={{ color: "var(--text-main)" }}>{tr.destination}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{tr.form?.startDate || t("no_date")} · {tr.days || "?"} {t("days")}</div>
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                      <div className="text-sm font-black" style={{ color }}>{tr.currency} {tr.total_estimated_cost?.toLocaleString()}</div>
                      {d !== null && d >= 0 && (
                        <div className="text-xs text-orange-400 font-bold">
                          {d === 0 ? t("today_short") : t("x_d_away", { n: d })}
                        </div>
                      )}
                      <WeatherBadge destination={tr.destination} dateStr={tr.form?.startDate} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* New trip CTA */}
        <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: G }}>
          <div className="absolute top-0 right-0 text-6xl opacity-10 leading-none font-black -mt-1 -mr-2">✈️</div>
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <div className="font-black text-sm mb-0.5">{t("next_trip_cta_title")}</div>
              <div className="text-white/70 text-xs">{t("next_trip_cta_subtitle")}</div>
            </div>
            <Link href="/plan"
              className="flex-shrink-0 bg-white font-black text-xs px-5 py-2.5 rounded-xl hover:-translate-y-0.5 transition-all"
              style={{ color: "#f97316" }}>
              {t("new_trip_link")}
            </Link>
          </div>
        </div>

        {/* For Agents */}
        <div className="text-center pt-2 pb-4">
          <Link href="/for-agents"
            className="text-xs font-bold text-gray-400 hover:text-orange-400 transition-colors">
            ✈️ Are you a travel agent? Get your free referral link →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── PWA Install Banner ─────────────────────────────────────────────────────
function PWAInstallBanner() {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("pwa_dismissed")) { setDismissed(true); return; }
    const handler = (e) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt || dismissed) return null;

  function install() {
    prompt.prompt();
    prompt.userChoice.finally(() => { setPrompt(null); });
  }

  function dismiss() {
    setDismissed(true);
    localStorage.setItem("pwa_dismissed", "1");
  }

  return (
    <div className="fixed bottom-24 left-3 right-3 z-50 max-w-lg mx-auto rounded-2xl p-4 shadow-2xl flex items-center gap-3"
      style={{ background: "white", border: "2px solid #ffedd5" }}>
      <div className="text-3xl flex-shrink-0">✈️</div>
      <div className="flex-1 min-w-0">
        <div className="font-black text-gray-900 text-sm">{t("pwa_install_title")}</div>
        <div className="text-xs text-gray-400">{t("pwa_install_desc")}</div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={dismiss} className="text-xs text-gray-400 font-bold px-3 py-2">{t("pwa_dismiss")}</button>
        <button onClick={install}
          className="text-xs font-black text-white px-4 py-2 rounded-xl shadow-md"
          style={{ background: "linear-gradient(135deg,#f97316,#ec4899)" }}>
          {t("pwa_install_btn")}
        </button>
      </div>
    </div>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [trips, setTrips] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTrips(getAllTrips());
    const onFocus = () => setTrips(getAllTrips());
    const onVis = () => { if (document.visibilityState === "visible") setTrips(getAllTrips()); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => { window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
      <div className="w-10 h-10 rounded-full border-4 border-orange-300 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <>
      {trips.length === 0 ? <WelcomePage /> : <Dashboard trips={trips} />}
      <PWAInstallBanner />
    </>
  );
}
