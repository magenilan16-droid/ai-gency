"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/LanguageProvider";

const G = "linear-gradient(135deg,#f97316,#ec4899)";

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
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  return diff;
}

const STYLE_E = { adventure:"🧗", relaxed:"🏖️", cultural:"🏛️", luxury:"✨", business:"💼" };

export default function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    setTrips(getAllTrips());
    const onFocus = () => setTrips(getAllTrips());
    const onVis = () => { if (document.visibilityState === "visible") setTrips(getAllTrips()); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => { window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const upcoming = trips.filter(t => t.form?.startDate && daysUntil(t.form.startDate) >= 0).slice(0, 1)[0];
  const recent = trips.slice(0, 3);
  const countries = [...new Set(trips.map(tr => tr.destination?.split(",").pop()?.trim()).filter(Boolean))];
  const totalBudget = trips.reduce((s, tr) => s + (tr.total_estimated_cost || 0), 0);

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-orange-300 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#FFF8F0" }}>
      {/* Header */}
      <div className="px-4 sm:px-6 pt-8 pb-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-1">✦ {t("travel_os")}</p>
            <h1 className="text-3xl font-black text-gray-900">
              {trips.length === 0 ? t("welcome") : t("your_dashboard")}
            </h1>
          </div>
          <span className="text-3xl font-black text-gray-900">✈️ <span style={{ background: G, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>AI-gency</span></span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-5 pb-8">

        {/* Upcoming trip hero */}
        {upcoming ? (
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
        ) : (
          /* No trips — onboarding hero */
          <div className="rounded-3xl overflow-hidden relative" style={{ background: G }}>
            <div className="absolute top-0 right-0 text-[100px] opacity-10 leading-none font-black -mt-4 -mr-4">✈️</div>
            <div className="relative px-6 py-8">
              <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-2">✦ {t("travel_os")}</p>
              <h2 className="text-2xl font-black text-white mb-2">{t("plan_first_trip_title")}</h2>
              <p className="text-white/70 text-sm mb-5 max-w-sm">{t("ai_builds_itinerary")}</p>
              <Link href="/plan" className="inline-flex items-center gap-2 bg-white font-black text-sm px-6 py-3 rounded-2xl hover:-translate-y-0.5 transition-all" style={{ color: "#f97316" }}>
                {t("start_planning")} →
              </Link>
            </div>
          </div>
        )}

        {/* Stats row */}
        {trips.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: "✈️", value: trips.length, labelKey: "stat_trips", href: "/trips" },
              { icon: "🌍", value: countries.length, labelKey: "stat_countries", href: "/countries" },
              { icon: "💰", value: `$${Math.round(totalBudget/1000)}k`, labelKey: "stat_planned", href: "/trips" },
            ].map(s => (
              <Link key={s.labelKey} href={s.href}
                className="bg-white rounded-2xl border border-orange-100 p-4 text-center shadow-sm hover:-translate-y-0.5 transition-all active:scale-95">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-xl font-black text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-400 font-medium">{t(s.labelKey)}</div>
              </Link>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-black text-gray-900 mb-3">{t("quick_actions")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "🤖", labelKey: "ask_ai_assistant", descKey: "plan_tips_suggestions", href: "/chat", color: G },
              { icon: "✈️", labelKey: "new_ai_trip", descKey: "chat_based_planning", href: "/plan", color: "linear-gradient(135deg,#f97316,#f59e0b)" },
              { icon: "💼", labelKey: "business_trip_label", descKey: "per_diems_expenses", href: "/business", color: "linear-gradient(135deg,#10b981,#0ea5e9)" },
              { icon: "✏️", labelKey: "build_manually", descKey: "full_creative_control", href: "/plan", color: "linear-gradient(135deg,#8b5cf6,#6366f1)" },
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

        {/* Recent trips */}
        {recent.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black text-gray-900">{t("recent_trips")}</h2>
              <Link href="/trips" className="text-xs font-black text-orange-400 hover:text-orange-600 transition-colors">{t("see_all")} →</Link>
            </div>
            <div className="space-y-3">
              {recent.map(tr => {
                const color = destColor(tr.destination);
                const d = daysUntil(tr.form?.startDate);
                return (
                  <Link key={tr.id} href={`/trip/${tr.id}`}
                    className="flex items-center gap-4 bg-white rounded-2xl border border-orange-100 p-4 shadow-sm hover:-translate-y-0.5 transition-all">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: `${color}20` }}>
                      {STYLE_E[tr.style] || "🌍"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-gray-900 text-sm truncate">{tr.destination}</div>
                      <div className="text-xs text-gray-400">{tr.form?.startDate || t("no_date")} · {tr.days || "?"} {t("days")}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-black" style={{ color }}>{tr.currency} {tr.total_estimated_cost?.toLocaleString()}</div>
                      {d !== null && d >= 0 && (
                        <div className="text-xs text-orange-400 font-bold">
                          {d === 0 ? t("today_short") : t("x_d_away", { n: d })}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* AI tip of the day */}
        <div className="rounded-2xl p-5 bg-white border border-orange-100 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: G }}>🤖</div>
            <div className="flex-1">
              <div className="font-black text-gray-900 text-sm mb-1">{t("ai_assistant_title")}</div>
              <p className="text-gray-500 text-sm leading-relaxed">
                {trips.length > 0
                  ? t("trips_count_msg", { n: trips.length, s: trips.length > 1 ? "s" : "" })
                  : t("no_trips_msg")}
              </p>
              <Link href="/chat" className="inline-flex items-center gap-1 mt-2 text-xs font-black text-orange-500 hover:text-orange-600 transition-colors">
                {t("open_ai_chat")} →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
