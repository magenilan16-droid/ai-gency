"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/LanguageProvider";

/* ── WMO weather codes ── */
const WMO_EMOJI = {
  0:"☀️",1:"🌤️",2:"⛅",3:"☁️",45:"🌫️",48:"🌫️",
  51:"🌦️",53:"🌦️",55:"🌧️",61:"🌧️",63:"🌧️",65:"🌧️",
  71:"❄️",73:"❄️",75:"❄️",80:"🌦️",81:"🌧️",82:"⛈️",95:"⛈️",
};
function wmoEmoji(code) { return WMO_EMOJI[code] ?? "🌡️"; }

/* ── WeatherBadge ── */
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
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
      {weather.emoji} {weather.temp}°
    </span>
  );
}

/* ── Local storage helpers ── */
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

/* ── Destination color map ── */
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

/* ── Time-based greeting ── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ════════════════════════════════════════════════════════════════
   WELCOME PAGE
   ════════════════════════════════════════════════════════════════ */
function WelcomePage() {
  const { t } = useLanguage();

  const FEATURES = [
    { icon: "🤖", color: "#fff7ed", title: t("feature_ai_title"),       desc: t("feature_ai_desc") },
    { icon: "💰", color: "#f0fdf4", title: t("feature_budget_title"),    desc: t("feature_budget_desc") },
    { icon: "🗓️", color: "#eff6ff", title: t("feature_daybyday_title"),  desc: t("feature_daybyday_desc") },
    { icon: "🔗", color: "#fdf4ff", title: t("feature_share_title"),     desc: t("feature_share_desc") },
    { icon: "🧳", color: "#fff7ed", title: t("feature_packing_title"),   desc: t("feature_packing_desc") },
    { icon: "🌦️", color: "#f0f9ff", title: t("feature_weather_title"),   desc: t("feature_weather_desc") },
  ];

  const DESTS = [
    { name: "Tokyo",    emoji: "🗼", color: "#FF6B6B" },
    { name: "Paris",    emoji: "🗼", color: "#667eea" },
    { name: "Bali",     emoji: "🌺", color: "#11998e" },
    { name: "Dubai",    emoji: "🏙️", color: "#f7971e" },
    { name: "NYC",      emoji: "🗽", color: "#4776E6" },
    { name: "Bangkok",  emoji: "🐘", color: "#f7971e" },
  ];

  const STEPS = [
    { n: "1", icon: "💬", title: t("step1_title"), desc: t("step1_desc") },
    { n: "2", icon: "⚡", title: t("step2_title"), desc: t("step2_desc") },
    { n: "3", icon: "✈️", title: t("step3_title"), desc: t("step3_desc") },
  ];

  return (
    <div className="min-h-screen bg-white page-enter">

      {/* ── Header ── */}
      <header className="px-5 pt-5 pb-2 max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ background: "#f97316" }}>AI</div>
          <span className="font-bold text-gray-900 text-sm">AI-gency</span>
        </div>
        <Link href="/plan"
          className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors">
          Get started →
        </Link>
      </header>

      {/* ── Hero ── */}
      <section className="relative px-5 pt-12 pb-16 max-w-2xl mx-auto text-center overflow-hidden">
        {/* Subtle animated background blob */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(249,115,22,0.07) 0%, transparent 70%)",
          }}
        />

        {/* Badge */}
        <div className="animate-fade-up inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-3 py-1.5 mb-6">
          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" style={{ animation: "pulse-soft 2s ease infinite" }} />
          <span className="text-xs font-semibold text-orange-600">{t("hero_badge_text")}</span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up delay-1 text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 leading-[1.05] mb-5">
          {t("how_it_works_title")}<br />
          <span style={{ color: "#f97316" }}>in seconds</span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-up delay-2 text-base text-gray-500 max-w-xs mx-auto mb-4 leading-relaxed">
          {t("hero_subtitle")}
        </p>

        {/* Stats row */}
        <div className="animate-fade-up delay-3 flex items-center justify-center gap-4 text-xs text-gray-400 font-medium mb-8 flex-wrap">
          <span>10,000+ trips planned</span>
          <span className="w-1 h-1 rounded-full bg-gray-300 inline-block" />
          <span>50+ countries</span>
          <span className="w-1 h-1 rounded-full bg-gray-300 inline-block" />
          <span>⭐ 4.9 rating</span>
        </div>

        {/* CTAs */}
        <div className="animate-fade-up delay-4 flex items-center justify-center gap-3 flex-wrap">
          <Link href="/plan" className="btn-primary inline-flex items-center gap-2">
            Plan my trip ✈️
          </Link>
          <Link href="/for-agents" className="btn-ghost inline-flex items-center gap-2">
            I&apos;m a travel agent →
          </Link>
        </div>
      </section>

      {/* ── Destination strip ── */}
      <section className="mb-12">
        <div className="overflow-x-auto no-scrollbar snap-scroll px-5">
          <div className="flex gap-3" style={{ width: "max-content" }}>
            {DESTS.map((d, i) => (
              <Link key={d.name} href={`/plan?destination=${encodeURIComponent(d.name)}`}
                className={`animate-fade-up delay-${Math.min(i + 1, 6)} flex-shrink-0 rounded-2xl p-4 text-white card-hover active:scale-95`}
                style={{
                  background: d.color,
                  width: 100,
                  height: 100,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  scrollSnapAlign: "start",
                }}>
                <div className="text-2xl mb-1">{d.emoji}</div>
                <div className="font-semibold text-sm leading-tight">{d.name}</div>
              </Link>
            ))}
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-3 px-5">{t("click_destination_hint")}</p>
      </section>

      {/* ── How it works ── */}
      <section className="px-5 pb-12 max-w-2xl mx-auto">
        <p className="label-micro mb-2">HOW IT WORKS</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("how_it_works_title")}</h2>
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <div key={step.n}
              className={`animate-fade-up delay-${i + 1} flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-white card-premium card-glow`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: "#f97316" }}>
                {step.n}
              </div>
              <div>
                <div className="font-semibold text-sm text-gray-900">{step.icon} {step.title}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="px-5 pb-12 max-w-2xl mx-auto">
        <p className="label-micro mb-2">WHAT YOU GET</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("features_title")}</h2>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((f, i) => (
            <div key={i}
              className={`animate-fade-up delay-${Math.min(i + 1, 6)} p-4 rounded-xl border border-gray-100 bg-white card-premium card-glow`}>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-3 flex-shrink-0"
                style={{ background: f.color }}>
                {f.icon}
              </div>
              <div className="text-sm font-semibold text-gray-900 mb-1">{f.title}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-5 pb-32 max-w-2xl mx-auto">
        <div className="rounded-2xl p-8 text-center animate-scale-in" style={{ background: "#111827" }}>
          <div className="text-4xl mb-3">🌍</div>
          <h2 className="text-2xl font-bold text-white mb-2">{t("final_cta_title")}</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto leading-relaxed">{t("final_cta_subtitle")}</p>
          <Link href="/plan" className="btn-primary inline-flex items-center gap-2">
            {t("final_cta_btn")}
          </Link>
        </div>
        <div className="text-center pt-6">
          <Link href="/for-agents" className="text-xs text-gray-400 hover:text-orange-500 transition-colors font-medium">
            ✈️ Are you a travel agent? Get your free referral link →
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   DASHBOARD
   ════════════════════════════════════════════════════════════════ */
function Dashboard({ trips }) {
  const { t } = useLanguage();

  const upcoming = trips.filter(tr => tr.form?.startDate && daysUntil(tr.form.startDate) >= 0).slice(0, 1)[0];
  const recent = trips.slice(0, 4);
  const countries = [...new Set(trips.map(tr => tr.destination?.split(",").pop()?.trim()).filter(Boolean))];
  const totalBudget = trips.reduce((s, tr) => s + (tr.total_estimated_cost || 0), 0);

  const ACTIONS = [
    { icon: "✈️", bg: "#fff7ed", iconColor: "#f97316", labelKey: "new_ai_trip",        descKey: "chat_based_planning",   href: "/plan"      },
    { icon: "🤖", bg: "#eff6ff", iconColor: "#3b82f6", labelKey: "ask_ai_assistant",    descKey: "plan_tips_suggestions", href: "/chat"      },
    { icon: "💼", bg: "#f0fdf4", iconColor: "#22c55e", labelKey: "business_trip_label", descKey: "per_diems_expenses",    href: "/business"  },
    { icon: "🌍", bg: "#fdf4ff", iconColor: "#a855f7", labelKey: "explore_countries",   descKey: "discover_destinations", href: "/countries" },
  ];

  return (
    <div className="min-h-screen bg-white page-enter">

      {/* ── Header ── */}
      <header className="px-5 pt-8 pb-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">AI-GENCY</p>
            <h1 className="text-2xl font-bold text-gray-900 animate-fade-up">
              {getGreeting()}, Traveler 👋
            </h1>
          </div>
          <Link href="/settings"
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-base hover:bg-gray-200 transition-colors animate-fade-in">
            ⚙️
          </Link>
        </div>
      </header>

      <div className="px-5 max-w-2xl mx-auto space-y-5 pb-32">

        {/* ── Stats chips ── */}
        <div className="grid grid-cols-3 gap-2 animate-fade-up delay-1">
          {[
            { value: trips.length,                          label: t("stat_trips"),    href: "/trips",     color: "#f97316" },
            { value: countries.length,                      label: t("stat_countries"), href: "/countries", color: "#3b82f6" },
            { value: `$${Math.round(totalBudget / 1000)}k`, label: t("stat_planned"), href: "/trips",     color: "#22c55e" },
          ].map((s, i) => (
            <Link key={i} href={s.href}
              className="p-3 rounded-xl border border-gray-100 text-center card-premium card-glow group">
              <div className="text-2xl font-bold text-gray-900 group-hover:transition-colors" style={{ transition: "color 0.2s" }}>
                {s.value}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </Link>
          ))}
        </div>

        {/* ── Upcoming trip ── */}
        {upcoming && (() => {
          const color = destColor(upcoming.destination);
          const d = daysUntil(upcoming.form?.startDate);
          return (
            <div className="animate-fade-up delay-2">
              <p className="label-micro mb-3">UPCOMING TRIP</p>
              <Link href={`/trip/${upcoming.id}`}>
                <div className="rounded-2xl p-5 border-l-4 bg-white border border-gray-100 card-premium card-glow hover:shadow-md transition-all"
                  style={{ borderLeftColor: color, borderLeftWidth: 4 }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: color + "18" }}>
                      {STYLE_E[upcoming.style] || "✈️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ background: color }}>
                          {d === 0 ? t("today_badge") : d === 1 ? t("tomorrow_badge") : t("in_x_days", { n: d })}
                        </span>
                      </div>
                      <p className="font-bold text-gray-900 text-base truncate">{upcoming.destination}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{upcoming.form?.startDate} · {upcoming.days} {t("days")}</p>
                    </div>
                    <div className="text-gray-300 text-xl flex-shrink-0">→</div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })()}

        {/* ── Quick actions ── */}
        <div className="animate-fade-up delay-3">
          <p className="label-micro mb-3">{t("quick_actions")}</p>
          <div className="grid grid-cols-2 gap-2">
            {ACTIONS.map((a, i) => (
              <Link key={a.labelKey} href={a.href}
                className={`flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white card-premium card-glow delay-${i + 1}`}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: a.bg }}>
                  {a.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 leading-tight">{t(a.labelKey)}</div>
                  <div className="text-xs text-gray-500 leading-tight mt-0.5 truncate">{t(a.descKey)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Recent trips ── */}
        {recent.length > 0 && (
          <div className="animate-fade-up delay-4">
            <div className="flex items-center justify-between mb-3">
              <p className="label-micro">{t("recent_trips")}</p>
              <Link href="/trips" className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                {t("see_all")} →
              </Link>
            </div>
            <div className="space-y-1">
              {recent.map(tr => {
                const color = destColor(tr.destination);
                const d = daysUntil(tr.form?.startDate);
                return (
                  <Link key={tr.id} href={`/trip/${tr.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group">
                    {/* Left color accent bar */}
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: color }} />
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                      style={{ background: color + "15" }}>
                      {STYLE_E[tr.style] || "🌍"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{tr.destination}</div>
                      <div className="text-xs text-gray-400">{tr.form?.startDate || t("no_date")} · {tr.days || "?"} {t("days")}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold" style={{ color }}>{tr.currency} {tr.total_estimated_cost?.toLocaleString()}</div>
                      {d !== null && d >= 0 && (
                        <div className="text-xs text-orange-400 font-medium">{d === 0 ? t("today_short") : t("x_d_away", { n: d })}</div>
                      )}
                      <WeatherBadge destination={tr.destination} dateStr={tr.form?.startDate} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Smart tools ── */}
        <div className="animate-fade-up delay-5">
          <p className="label-micro mb-3">{t("smart_tools")}</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/budget",  icon: "💰", bg: "#f0fdf4", labelKey: "feature_budget_title", descKey: "feature_budget_desc" },
              { href: "/compare", icon: "⚖️", bg: "#eff6ff", labelKey: "compare_title",         descKey: "compare_desc" },
            ].map(tool => (
              <Link key={tool.href} href={tool.href}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white card-premium card-glow">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: tool.bg }}>
                  {tool.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 leading-tight">{t(tool.labelKey)}</div>
                  <div className="text-xs text-gray-500 truncate">{t(tool.descKey)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── New trip CTA (full-width dark card) ── */}
        <div className="animate-fade-up delay-6">
          <Link href="/plan"
            className="flex items-center justify-between p-5 rounded-2xl text-white transition-all hover:opacity-95 active:scale-[0.99]"
            style={{ background: "#111827" }}>
            <div>
              <div className="font-bold text-base">{t("next_trip_cta_title")}</div>
              <div className="text-gray-400 text-sm mt-0.5">{t("next_trip_cta_subtitle")}</div>
            </div>
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ boxShadow: "0 4px 14px rgba(249,115,22,0.4)" }}>
              →
            </div>
          </Link>
        </div>

        {/* ── For Agents ── */}
        <div className="text-center pb-2">
          <Link href="/for-agents" className="text-xs text-gray-400 hover:text-orange-500 transition-colors font-medium">
            ✈️ Are you a travel agent? Get your free referral link →
          </Link>
        </div>

      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PWA INSTALL BANNER
   ════════════════════════════════════════════════════════════════ */
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

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto animate-bounce-in">
      <div className="bg-gray-900 rounded-2xl p-4 flex items-center gap-3 shadow-2xl">
        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white text-lg flex-shrink-0">📱</div>
        <div className="flex-1">
          <div className="text-white text-sm font-semibold">{t("pwa_title")}</div>
          <div className="text-gray-400 text-xs">{t("pwa_subtitle")}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setDismissed(true); localStorage.setItem("pwa_dismissed", "1"); }}
            className="text-gray-500 text-xs p-1.5 hover:text-gray-300 transition-colors">
            ✕
          </button>
          <button onClick={install}
            className="bg-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors">
            {t("pwa_install_btn")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ════════════════════════════════════════════════════════════════ */
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
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 rounded-full border-2 border-orange-200 border-t-orange-500 animate-spin" />
    </div>
  );

  return (
    <>
      {trips.length === 0 ? <WelcomePage /> : <Dashboard trips={trips} />}
      <PWAInstallBanner />
    </>
  );
}
