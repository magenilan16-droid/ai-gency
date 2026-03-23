"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">

        {/* Animated gradient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse"
            style={{ background: "linear-gradient(135deg,#f97316,#ec4899)" }} />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-15 blur-3xl"
            style={{ background: "#667eea", animation: "pulse 3s ease-in-out infinite 1s" }} />
          <div className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full opacity-10 blur-2xl"
            style={{ background: "#f59e0b", animation: "pulse 4s ease-in-out infinite 0.5s" }} />
        </div>

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border font-black mb-6 transition-all duration-700"
          style={{
            borderColor: "#ffedd5",
            background: "rgba(255,237,213,0.6)",
            color: "#f97316",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(12px)",
          }}
        >
          <span className="dot-live" />
          <span className="label-micro" style={{ color: "#f97316" }}>AI-POWERED</span>
          {t("hero_badge_text")}
        </div>

        {/* Headline */}
        <h1
          className="text-6xl sm:text-7xl font-black tracking-tighter leading-none mb-6 transition-all duration-700 delay-100"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s ease" }}
        >
          <span style={{
            background: G,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>AI Plans.</span><br />
          <span style={{ color: "var(--text-main)" }}>You Explore.</span>
        </h1>

        {/* Sub */}
        <p
          className="text-xl max-w-sm mx-auto mb-10 leading-relaxed transition-all duration-700 delay-150"
          style={{
            color: "var(--text-sub)",
            fontWeight: 500,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
          }}
        >
          {t("hero_subtitle")}
        </p>

        {/* CTA */}
        <div
          className="flex flex-col sm:flex-row gap-3 justify-center transition-all duration-700 delay-200"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)" }}
        >
          <Link href="/plan"
            className="px-8 py-4 rounded-[99px] text-white font-black text-base shadow-lg hover:-translate-y-1 transition-all"
            style={{ background: "linear-gradient(135deg,#f97316,#ec4899)", boxShadow: "0 12px 32px rgba(249,115,22,0.35)" }}>
            Plan My Trip ✈️
          </Link>
          <Link href="/for-agents"
            className="px-8 py-4 rounded-[99px] font-black text-base transition-all hover:-translate-y-1"
            style={{ border: "2px solid #fed7aa", color: "#f97316", background: "white" }}>
            I&apos;m a Travel Agent →
          </Link>
        </div>

        {/* Destination showcase strip */}
        <div
          className="mt-14 w-full transition-all duration-700 delay-300"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}
        >
          <div className="overflow-x-auto no-scrollbar pb-4">
            <div className="flex gap-3 px-4 justify-center flex-wrap sm:flex-nowrap" style={{ width: "max-content", margin: "0 auto" }}>
              {[
                { name: "Tokyo", emoji: "🗼", g: ["#FF6B6B","#FF8E53"] },
                { name: "Paris", emoji: "🗼", g: ["#667eea","#764ba2"] },
                { name: "Bali", emoji: "🌺", g: ["#11998e","#38ef7d"] },
                { name: "Dubai", emoji: "🏙️", g: ["#f7971e","#ffd200"] },
                { name: "NYC", emoji: "🗽", g: ["#4776E6","#8E54E9"] },
                { name: "Bangkok", emoji: "🐘", g: ["#f7971e","#ffd200"] },
              ].map((dest, i) => (
                <Link key={i} href={`/plan?destination=${encodeURIComponent(dest.name)}`}
                  className="flex-shrink-0 rounded-[1.5rem] p-5 text-white cursor-pointer hover:-translate-y-1 transition-all"
                  style={{
                    background: `linear-gradient(135deg,${dest.g[0]},${dest.g[1]})`,
                    width: "120px", height: "120px",
                    boxShadow: `0 8px 24px ${dest.g[0]}40`,
                    display: "flex", flexDirection: "column", justifyContent: "flex-end"
                  }}>
                  <div className="text-3xl mb-2">{dest.emoji}</div>
                  <div className="font-black text-sm tracking-tight">{dest.name}</div>
                </Link>
              ))}
            </div>
          </div>
          <p className="text-center text-xs mt-3" style={{ color: "var(--text-muted)" }}>
            {t("click_destination_hint")}
          </p>
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="px-5 pb-16 max-w-lg mx-auto">
        <div className="text-center mb-3">
          <span className="label-micro">HOW IT WORKS</span>
        </div>
        <h2 className="text-3xl font-black tracking-tighter text-center mb-2" style={{ color: "var(--text-main)" }}>
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
            <motion.div key={step.n} whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="flex gap-4 items-start rounded-[1.75rem] p-5 card-hover"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 4px 16px rgba(249,115,22,0.06)" }}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                style={{ background: G }}>
                {step.n}
              </div>
              <div>
                <div className="font-black text-sm mb-1" style={{ color: "var(--text-main)" }}>{step.icon} {step.title}</div>
                <div className="text-xs leading-relaxed" style={{ color: "var(--text-sub)" }}>{step.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Features grid ── */}
      <div className="px-5 pb-16 max-w-lg mx-auto">
        <div className="text-center mb-3">
          <span className="label-micro">WHAT YOU GET</span>
        </div>
        <h2 className="text-3xl font-black tracking-tighter text-center mb-8" style={{ color: "var(--text-main)" }}>
          {t("features_title")}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div key={i} whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="rounded-[2rem] p-7 card-hover"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(249,115,22,0.08)" }}>
              <div className="text-3xl mb-3">{f.icon}</div>
              <div className="font-black text-sm mb-1 tracking-tight" style={{ color: "var(--text-main)" }}>{f.title}</div>
              <div className="text-xs leading-relaxed" style={{ color: "var(--text-sub)" }}>{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Final CTA ── */}
      <div className="px-5 pb-32 max-w-lg mx-auto">
        <div className="rounded-[2.5rem] p-10 text-white text-center relative overflow-hidden" style={{ background: G, boxShadow: "0 8px 32px rgba(249,115,22,0.30)" }}>
          <div className="absolute top-0 right-0 text-8xl opacity-10 leading-none font-black -mt-2 -mr-2">✈️</div>
          <div className="relative">
            <div className="text-5xl mb-3">🌍</div>
            <h2 className="text-3xl font-black tracking-tighter mb-2">{t("final_cta_title")}</h2>
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
            <div className="flex items-center gap-2 mb-1">
              <span className="dot-live" />
              <span className="label-micro">{t("travel_os")}</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter" style={{ color: "var(--text-main)" }}>{t("your_dashboard")}</h1>
          </div>
          <span className="text-2xl font-black">✈️ <span style={{ background: G, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>AI-gency</span></span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-5 pb-8">

        {/* Upcoming trip hero */}
        {upcoming && (
          <Link href={`/trip/${upcoming.id}`}>
            <div className="rounded-[2rem] p-7 text-white relative overflow-hidden cursor-pointer card-hover"
              style={{ background: `linear-gradient(135deg,${destColor(upcoming.destination)},${destColor(upcoming.destination)}99)`, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
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
            <motion.div key={s.labelKey} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <Link href={s.href}
                className="block rounded-[1.5rem] border p-4 text-center shadow-sm active:scale-95 card-hover"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "0 4px 16px rgba(249,115,22,0.07)" }}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-4xl font-black tracking-tighter" style={{ color: "var(--text-main)" }}>{s.value}</div>
                <div className="label-micro mt-1">{t(s.labelKey)}</div>
              </Link>
            </motion.div>
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black" style={{ color: "var(--text-main)" }}>🛠️ {t("smart_tools")}</h2>
            <span className="label-micro">PREMIUM</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <Link href="/budget" className="block rounded-[1.75rem] p-5 text-white shadow-md card-hover" style={{ background: "linear-gradient(135deg,#0d9488,#0ea5e9)" }}>
                <div className="text-3xl mb-3">💰</div>
                <div className="font-black text-sm">{t("feature_budget_title")}</div>
                <div className="text-white/70 text-xs mt-1">{t("feature_budget_desc")}</div>
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <Link href="/compare" className="block rounded-[1.75rem] p-5 text-white shadow-md card-hover" style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }}>
                <div className="text-3xl mb-3">⚖️</div>
                <div className="font-black text-sm">{t("compare_title")}</div>
                <div className="text-white/70 text-xs mt-1">{t("compare_desc")}</div>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Recent trips */}
        {recent.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="label-micro block mb-0.5">RECENT</span>
                <h2 className="text-lg font-black tracking-tight" style={{ color: "var(--text-main)" }}>{t("recent_trips")}</h2>
              </div>
              <Link href="/trips" className="text-xs font-black text-orange-400 hover:text-orange-600 transition-colors">{t("see_all")} →</Link>
            </div>
            <div className="space-y-3">
              {recent.map(tr => {
                const color = destColor(tr.destination);
                const d = daysUntil(tr.form?.startDate);
                return (
                  <motion.div key={tr.id} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                  <Link href={`/trip/${tr.id}`}
                    className="flex items-center gap-4 rounded-[1.5rem] border p-4 shadow-sm card-hover block"
                    style={{ background: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "0 4px 16px rgba(249,115,22,0.07)" }}>
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
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* New trip CTA */}
        <div className="rounded-[2rem] p-6 text-white relative overflow-hidden" style={{ background: G, boxShadow: "0 8px 32px rgba(249,115,22,0.25)" }}>
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
