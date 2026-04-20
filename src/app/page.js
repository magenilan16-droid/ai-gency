"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/LanguageProvider";
import {
  Sparkles, Wallet, CalendarDays, Link2, Briefcase, CloudSun,
  Bot, Globe, Scale, ArrowRight, ArrowUpRight, Settings, Plane,
  Sun, Moon, CloudDrizzle, CloudSnow, CloudLightning, Cloud,
  MessageSquare, Zap, MapPin, Compass,
} from "lucide-react";

/* ── WMO weather → Lucide icon ── */
const WMO_ICON = {
  0: Sun, 1: Sun, 2: CloudSun, 3: Cloud,
  45: Cloud, 48: Cloud,
  51: CloudDrizzle, 53: CloudDrizzle, 55: CloudDrizzle,
  61: CloudDrizzle, 63: CloudDrizzle, 65: CloudDrizzle,
  71: CloudSnow, 73: CloudSnow, 75: CloudSnow,
  80: CloudDrizzle, 81: CloudDrizzle, 82: CloudLightning, 95: CloudLightning,
};
function wmoIcon(code) { return WMO_ICON[code] ?? Sun; }

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
        if (code != null && temp != null) setWeather({ Icon: wmoIcon(code), temp: Math.round(temp) });
      } catch {}
    }
    load();
    return () => { cancelled = true; };
  }, [destination, dateStr]);
  if (!weather) return null;
  const { Icon } = weather;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium num text-gray-500">
      <Icon size={12} strokeWidth={1.75} /> {weather.temp}°
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

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ════════════════════════════════════════════════════════════════
   WELCOME PAGE — Editorial + Fintech
   ════════════════════════════════════════════════════════════════ */
function WelcomePage() {
  const { t } = useLanguage();

  const FEATURES = [
    { Icon: Sparkles,    title: t("feature_ai_title"),       desc: t("feature_ai_desc") },
    { Icon: Wallet,      title: t("feature_budget_title"),    desc: t("feature_budget_desc") },
    { Icon: CalendarDays,title: t("feature_daybyday_title"),  desc: t("feature_daybyday_desc") },
    { Icon: Link2,       title: t("feature_share_title"),     desc: t("feature_share_desc") },
    { Icon: Briefcase,   title: t("feature_packing_title"),   desc: t("feature_packing_desc") },
    { Icon: CloudSun,    title: t("feature_weather_title"),   desc: t("feature_weather_desc") },
  ];

  const DESTS = [
    { name: "Tokyo",    country: "Japan",   tag: "Culture" },
    { name: "Paris",    country: "France",  tag: "Romance" },
    { name: "Bali",     country: "Indonesia", tag: "Nature" },
    { name: "Dubai",    country: "UAE",     tag: "Luxury"  },
    { name: "New York", country: "USA",     tag: "Urban"   },
    { name: "Bangkok",  country: "Thailand",tag: "Street"  },
  ];

  const STEPS = [
    { n: "01", Icon: MessageSquare, title: t("step1_title"), desc: t("step1_desc") },
    { n: "02", Icon: Zap,           title: t("step2_title"), desc: t("step2_desc") },
    { n: "03", Icon: Plane,         title: t("step3_title"), desc: t("step3_desc") },
  ];

  return (
    <div className="min-h-screen bg-white page-enter">

      {/* ── Header ── */}
      <header className="px-6 pt-6 pb-4 max-w-3xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center">
            <span className="text-white text-[10px] font-bold tracking-tighter">AI</span>
          </div>
          <span className="font-semibold text-gray-900 text-[15px] tracking-tight">AI-gency</span>
        </div>
        <Link href="/plan"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-900 hover:text-gray-600 transition-colors">
          Get started <ArrowRight size={14} strokeWidth={2} />
        </Link>
      </header>

      {/* ── Hero ── */}
      <section className="px-6 pt-16 pb-20 max-w-3xl mx-auto">
        {/* Eyebrow */}
        <div className="animate-fade-up mb-8">
          <span className="eyebrow">Intelligent Travel Planning</span>
        </div>

        {/* Serif display headline */}
        <h1 className="animate-fade-up delay-1 display-xl text-[64px] sm:text-[80px] text-gray-900 mb-8">
          Plan smarter.<br />
          <span className="italic text-gray-500">Travel further.</span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-up delay-2 text-[17px] text-gray-600 max-w-md leading-relaxed mb-10">
          AI-powered itineraries, budget intelligence, and day-by-day plans —
          built in seconds, refined for taste.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up delay-3 flex items-center gap-3 flex-wrap mb-12">
          <Link href="/plan" className="btn-primary">
            Plan a trip <ArrowRight size={15} strokeWidth={2} />
          </Link>
          <Link href="/for-agents" className="btn-ghost">
            For travel advisors
          </Link>
        </div>

        {/* Stats strip */}
        <div className="animate-fade-up delay-4 flex items-center gap-8 pt-8 border-t border-gray-100">
          <div>
            <div className="display-lg text-[28px] text-gray-900 num">10k+</div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wider mt-1">Trips planned</div>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div>
            <div className="display-lg text-[28px] text-gray-900 num">50+</div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wider mt-1">Countries</div>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div>
            <div className="display-lg text-[28px] text-gray-900 num">4.9</div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wider mt-1">Rating</div>
          </div>
        </div>
      </section>

      {/* ── Destination strip ── */}
      <section className="mb-24">
        <div className="px-6 max-w-3xl mx-auto mb-5 flex items-baseline justify-between">
          <p className="label-micro">Popular destinations</p>
          <Link href="/countries" className="text-[12px] text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center gap-1">
            Browse all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto no-scrollbar snap-scroll px-6">
          <div className="flex gap-3" style={{ width: "max-content" }}>
            {DESTS.map((d, i) => (
              <Link key={d.name} href={`/plan?destination=${encodeURIComponent(d.name)}`}
                className={`animate-fade-up delay-${Math.min(i + 1, 6)} flex-shrink-0 group`}
                style={{ scrollSnapAlign: "start" }}>
                <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-gray-50 transition-all group-hover:border-gray-300"
                  style={{ width: 180, height: 220 }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-700 to-gray-400"
                    style={{ opacity: 0.9 }} />
                  <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
                    <span className="text-[10px] font-semibold tracking-wider uppercase opacity-80">{d.tag}</span>
                    <div>
                      <div className="font-serif text-2xl font-medium leading-none tracking-tight">{d.name}</div>
                      <div className="text-[11px] opacity-70 mt-1 tracking-wide">{d.country}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 pb-24 max-w-3xl mx-auto">
        <p className="label-micro mb-3">How it works</p>
        <h2 className="font-serif text-[40px] font-medium text-gray-900 tracking-tight mb-12">
          Three steps to a<br />refined itinerary.
        </h2>
        <div className="space-y-0 border-t border-gray-100">
          {STEPS.map((step, i) => (
            <div key={step.n}
              className={`animate-fade-up delay-${i + 1} py-6 border-b border-gray-100 flex items-start gap-6 group`}>
              <span className="font-mono text-[11px] text-gray-400 mt-1 num flex-shrink-0 w-8">{step.n}</span>
              <div className="icon-square flex-shrink-0">
                <step.Icon size={16} strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[15px] text-gray-900 mb-1">{step.title}</div>
                <div className="text-[13px] text-gray-500 leading-relaxed">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="px-6 pb-24 max-w-3xl mx-auto">
        <p className="label-micro mb-3">Capabilities</p>
        <h2 className="font-serif text-[40px] font-medium text-gray-900 tracking-tight mb-12">
          Every detail, considered.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden">
          {FEATURES.map((f, i) => (
            <div key={i}
              className={`animate-fade-up delay-${Math.min(i + 1, 6)} p-6 bg-white transition-colors hover:bg-gray-50`}>
              <div className="icon-square mb-4">
                <f.Icon size={16} strokeWidth={1.75} />
              </div>
              <div className="text-[15px] font-medium text-gray-900 mb-1.5">{f.title}</div>
              <div className="text-[13px] text-gray-500 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA — deep ink block ── */}
      <section className="px-6 pb-32 max-w-3xl mx-auto">
        <div className="rounded-2xl p-12 bg-gray-900 text-white animate-scale-in relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at top right, rgba(234,88,12,0.3) 0%, transparent 50%)" }} />
          <div className="relative">
            <span className="eyebrow" style={{ color: "#ea580c" }}>Ready when you are</span>
            <h2 className="font-serif text-[44px] font-medium tracking-tight leading-[1.05] mt-4 mb-6">
              Your next trip,<br />
              <span className="italic text-gray-400">drafted in seconds.</span>
            </h2>
            <p className="text-[14px] text-gray-400 max-w-sm leading-relaxed mb-8">
              Skip the spreadsheets. Tell us where, when, and how — get a complete plan back.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/plan" className="btn-accent">
                Start planning <ArrowRight size={15} strokeWidth={2} />
              </Link>
              <Link href="/for-agents" className="text-[13px] text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1">
                Travel advisor? <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
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
    { Icon: Plane,     labelKey: "new_ai_trip",        descKey: "chat_based_planning",   href: "/plan"      },
    { Icon: Bot,       labelKey: "ask_ai_assistant",    descKey: "plan_tips_suggestions", href: "/chat"      },
    { Icon: Briefcase, labelKey: "business_trip_label", descKey: "per_diems_expenses",    href: "/business"  },
    { Icon: Globe,     labelKey: "explore_countries",   descKey: "discover_destinations", href: "/countries" },
  ];

  return (
    <div className="min-h-screen bg-white page-enter">

      {/* ── Header ── */}
      <header className="px-6 pt-10 pb-8 max-w-3xl mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <p className="label-micro mb-3">{getGreeting()}</p>
            <h1 className="font-serif text-[36px] font-medium text-gray-900 tracking-tight animate-fade-up leading-none">
              Welcome back.
            </h1>
          </div>
          <Link href="/settings"
            className="w-9 h-9 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors animate-fade-in">
            <Settings size={15} strokeWidth={1.75} />
          </Link>
        </div>
      </header>

      <div className="px-6 max-w-3xl mx-auto space-y-10 pb-32">

        {/* ── Stats row — serious fintech style ── */}
        <div className="grid grid-cols-3 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden animate-fade-up delay-1">
          {[
            { value: trips.length,                          label: t("stat_trips"),     href: "/trips" },
            { value: countries.length,                      label: t("stat_countries"), href: "/countries" },
            { value: `$${Math.round(totalBudget / 1000)}k`, label: t("stat_planned"),   href: "/trips" },
          ].map((s, i) => (
            <Link key={i} href={s.href}
              className="p-5 bg-white hover:bg-gray-50 transition-colors">
              <div className="font-serif text-[28px] font-medium text-gray-900 num leading-none mb-2">
                {s.value}
              </div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wider">{s.label}</div>
            </Link>
          ))}
        </div>

        {/* ── Upcoming trip — editorial card ── */}
        {upcoming && (() => {
          const d = daysUntil(upcoming.form?.startDate);
          return (
            <div className="animate-fade-up delay-2">
              <div className="flex items-baseline justify-between mb-4">
                <p className="label-micro">Next departure</p>
                <span className="text-[11px] text-gray-400 uppercase tracking-wider">
                  {d === 0 ? "Today" : d === 1 ? "Tomorrow" : `In ${d} days`}
                </span>
              </div>
              <Link href={`/trip/${upcoming.id}`}>
                <div className="card card-interactive p-6 group">
                  <div className="flex items-start gap-5">
                    <div className="icon-square-ink" style={{ width: 44, height: 44 }}>
                      <Plane size={18} strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-serif text-[22px] font-medium text-gray-900 tracking-tight leading-tight mb-1">
                        {upcoming.destination}
                      </div>
                      <div className="flex items-center gap-3 text-[12px] text-gray-500 num">
                        <span>{upcoming.form?.startDate}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>{upcoming.days} days</span>
                        {upcoming.currency && upcoming.total_estimated_cost && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span>{upcoming.currency} {upcoming.total_estimated_cost.toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ArrowRight size={16} strokeWidth={1.75} className="text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all mt-1 flex-shrink-0" />
                  </div>
                </div>
              </Link>
            </div>
          );
        })()}

        {/* ── Quick actions — tight grid ── */}
        <div className="animate-fade-up delay-3">
          <p className="label-micro mb-4">{t("quick_actions")}</p>
          <div className="grid grid-cols-2 gap-2">
            {ACTIONS.map((a, i) => (
              <Link key={a.labelKey} href={a.href}
                className="card card-interactive flex items-center gap-3 p-4 group">
                <div className="icon-square">
                  <a.Icon size={16} strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium text-gray-900 leading-tight">{t(a.labelKey)}</div>
                  <div className="text-[12px] text-gray-500 leading-tight mt-0.5 truncate">{t(a.descKey)}</div>
                </div>
                <ArrowRight size={13} strokeWidth={1.75} className="text-gray-300 group-hover:text-gray-900 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* ── Recent trips — list view ── */}
        {recent.length > 0 && (
          <div className="animate-fade-up delay-4">
            <div className="flex items-baseline justify-between mb-4">
              <p className="label-micro">{t("recent_trips")}</p>
              <Link href="/trips" className="text-[12px] text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center gap-1">
                {t("see_all")} <ArrowRight size={12} />
              </Link>
            </div>
            <div className="border-t border-gray-100">
              {recent.map(tr => {
                const d = daysUntil(tr.form?.startDate);
                return (
                  <Link key={tr.id} href={`/trip/${tr.id}`}
                    className="flex items-center gap-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors px-2 -mx-2 group">
                    <div className="icon-square">
                      <MapPin size={14} strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-medium text-gray-900 truncate">{tr.destination}</div>
                      <div className="text-[12px] text-gray-500 mt-0.5 num">
                        {tr.form?.startDate || t("no_date")} · {tr.days || "?"} {t("days")}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {tr.total_estimated_cost && (
                        <div className="text-[13px] font-medium text-gray-900 num">
                          {tr.currency} {tr.total_estimated_cost.toLocaleString()}
                        </div>
                      )}
                      <div className="flex items-center justify-end gap-2 mt-0.5">
                        {d !== null && d >= 0 && (
                          <span className="text-[11px] text-gray-400 num">
                            {d === 0 ? "Today" : `${d}d away`}
                          </span>
                        )}
                        <WeatherBadge destination={tr.destination} dateStr={tr.form?.startDate} />
                      </div>
                    </div>
                    <ArrowRight size={14} strokeWidth={1.75} className="text-gray-300 group-hover:text-gray-900 transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Smart tools ── */}
        <div className="animate-fade-up delay-5">
          <p className="label-micro mb-4">{t("smart_tools")}</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/budget",  Icon: Wallet, labelKey: "feature_budget_title", descKey: "feature_budget_desc" },
              { href: "/compare", Icon: Scale,  labelKey: "compare_title",         descKey: "compare_desc" },
            ].map(tool => (
              <Link key={tool.href} href={tool.href}
                className="card card-interactive flex items-center gap-3 p-4 group">
                <div className="icon-square">
                  <tool.Icon size={16} strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium text-gray-900 leading-tight">{t(tool.labelKey)}</div>
                  <div className="text-[12px] text-gray-500 truncate">{t(tool.descKey)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── New trip CTA — deep ink block ── */}
        <div className="animate-fade-up delay-6">
          <Link href="/plan"
            className="relative block overflow-hidden rounded-xl bg-gray-900 text-white p-6 transition-all hover:bg-black active:scale-[0.995]">
            <div className="absolute inset-0 opacity-30 pointer-events-none"
              style={{ background: "radial-gradient(circle at top right, rgba(234,88,12,0.4) 0%, transparent 60%)" }} />
            <div className="relative flex items-center justify-between">
              <div>
                <span className="eyebrow" style={{ color: "#ea580c" }}>New trip</span>
                <div className="font-serif text-[24px] font-medium tracking-tight leading-tight mt-2">
                  {t("next_trip_cta_title")}
                </div>
                <div className="text-[13px] text-gray-400 mt-1.5">{t("next_trip_cta_subtitle")}</div>
              </div>
              <div className="w-11 h-11 rounded-md bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-white/15">
                <ArrowRight size={18} strokeWidth={2} />
              </div>
            </div>
          </Link>
        </div>

        {/* ── For Agents ── */}
        <div className="text-center pt-4">
          <Link href="/for-agents"
            className="text-[12px] text-gray-400 hover:text-gray-900 transition-colors inline-flex items-center gap-1.5">
            <Compass size={12} strokeWidth={1.75} />
            Travel advisor? Get your referral link
            <ArrowRight size={11} />
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
      <div className="bg-gray-900 rounded-xl p-4 flex items-center gap-3 shadow-2xl border border-gray-800">
        <div className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center text-white flex-shrink-0">
          <Plane size={16} strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <div className="text-white text-[13px] font-medium">{t("pwa_title")}</div>
          <div className="text-gray-400 text-[11px] mt-0.5">{t("pwa_subtitle")}</div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => { setDismissed(true); localStorage.setItem("pwa_dismissed", "1"); }}
            className="text-gray-500 text-xs px-2 py-1.5 hover:text-gray-300 transition-colors">
            Skip
          </button>
          <button onClick={install}
            className="bg-white text-gray-900 text-[12px] font-medium px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors">
            Install
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
      <div className="w-6 h-6 rounded-full border border-gray-200 border-t-gray-900 animate-spin" />
    </div>
  );

  return (
    <>
      {trips.length === 0 ? <WelcomePage /> : <Dashboard trips={trips} />}
      <PWAInstallBanner />
    </>
  );
}
