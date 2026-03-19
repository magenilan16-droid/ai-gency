"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/LanguageProvider";

const G = "linear-gradient(135deg,#f97316,#ec4899)";
const STYLE_E = { adventure:"🧗", relaxed:"🏖️", cultural:"🏛️", luxury:"✨", business:"💼" };
const DEST_COLORS = {
  japan:"#FF6B6B",tokyo:"#FF6B6B",paris:"#667eea",france:"#667eea",italy:"#11998e",
  rome:"#f7971e",greece:"#2980B9",spain:"#ee0979",thailand:"#f7971e",bali:"#11998e",
  "new york":"#4776E6",london:"#4776E6",dubai:"#f7971e",israel:"#2980B9","tel aviv":"#11998e",
};
function destColor(d) {
  if (!d) return "#f97316";
  const k = d.toLowerCase();
  for (const [key, val] of Object.entries(DEST_COLORS)) { if (k.includes(key)) return val; }
  return "#f97316";
}

function getAllTrips() {
  if (typeof window === "undefined") return [];
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("aigency_trip_")) {
      try { out.push({ id: k.replace("aigency_trip_",""), ...JSON.parse(localStorage.getItem(k)) }); }
      catch {}
    }
  }
  return out.sort((a, b) => b.id.localeCompare(a.id));
}

export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [filter, setFilter] = useState("all");
  const [mounted, setMounted] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const { t } = useLanguage();

  const FILTERS = [
    { id: "all",      labelKey: "filter_all" },
    { id: "upcoming", labelKey: "filter_upcoming" },
    { id: "past",     labelKey: "filter_past" },
    { id: "business", labelKey: "filter_business" },
  ];

  useEffect(() => {
    setMounted(true);
    setTrips(getAllTrips());
  }, []);

  function handleDelete(id) {
    localStorage.removeItem(`aigency_trip_${id}`);
    setTrips(getAllTrips());
    setDeleting(null);
  }

  const now = new Date();
  const shown = trips.filter(tr => {
    if (filter === "upcoming") return tr.form?.startDate && new Date(tr.form.startDate) >= now;
    if (filter === "past")     return tr.form?.endDate && new Date(tr.form.endDate) < now;
    if (filter === "business") return tr.style === "business";
    return true;
  });

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-orange-300 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#FFF8F0" }}>
      <div className="px-4 sm:px-6 pt-8 pb-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-1">✦ {t("all_trips")}</p>
            <h1 className="text-3xl font-black text-gray-900">{t("my_trips")}</h1>
          </div>
          <Link href="/plan" className="font-black text-white text-sm px-5 py-3 rounded-2xl shadow-md shadow-orange-200" style={{ background: G }}>
            {t("new_trip_btn")}
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-5">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-bold transition-all"
              style={filter === f.id
                ? { background: G, color: "white", boxShadow: "0 4px 14px rgba(249,115,22,0.3)" }
                : { background: "white", color: "#9ca3af", border: "2px solid #ffedd5" }}>
              {t(f.labelKey)}
            </button>
          ))}
        </div>

        {/* Trips grid */}
        {shown.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-orange-100">
            <div className="text-5xl mb-3">🗺️</div>
            <p className="font-black text-gray-900 mb-1">{t("no_trips_here")}</p>
            <p className="text-sm text-gray-400 mb-6">{t("start_planning_trips")}</p>
            <Link href="/plan" className="inline-block font-black text-white text-sm px-8 py-3 rounded-2xl" style={{ background: G }}>
              {t("plan_a_trip_btn")}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map(tr => {
              const color = destColor(tr.destination);
              const d = tr.form?.startDate ? Math.ceil((new Date(tr.form.startDate) - now) / 86400000) : null;
              const isDel = deleting === tr.id;

              return (
                <div key={tr.id} className="bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-sm">
                  <div className="h-1.5" style={{ background: `linear-gradient(90deg,${color},${color}66)` }} />
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: `${color}15` }}>
                        {STYLE_E[tr.style] || "🌍"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-black text-gray-900">{tr.destination || t("untitled_trip")}</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {tr.form?.startDate ? `${tr.form.startDate} → ${tr.form.endDate}` : t("no_dates_set")}
                              {tr.days ? ` · ${tr.days} ${t("days")}` : ""}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-black text-sm" style={{ color }}>{tr.currency} {tr.total_estimated_cost?.toLocaleString()}</div>
                            {d !== null && d >= 0 && (
                              <div className="text-xs text-orange-400 font-bold mt-0.5">
                                {d === 0 ? t("today_badge") : t("x_d_away", { n: d })}
                              </div>
                            )}
                            {d !== null && d < 0 && (
                              <div className="text-xs text-gray-300 font-medium mt-0.5">{t("completed")}</div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <Link href={`/trip/${tr.id}`}
                            className="flex-1 text-center text-xs font-black py-2.5 rounded-xl text-white" style={{ background: G }}>
                            {t("open_trip")} →
                          </Link>
                          <Link href={`/chat?tripId=${tr.id}`}
                            className="text-xs font-black py-2.5 px-3 rounded-xl border-2 border-orange-100 text-orange-500 hover:bg-orange-50 transition-colors">
                            🤖 AI
                          </Link>
                          {isDel ? (
                            <div className="flex gap-1">
                              <button onClick={() => handleDelete(tr.id)}
                                className="text-xs font-black py-2.5 px-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors">
                                {t("delete")}
                              </button>
                              <button onClick={() => setDeleting(null)}
                                className="text-xs font-black py-2.5 px-3 rounded-xl border-2 border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
                                {t("cancel")}
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleting(tr.id)}
                              className="text-xs font-black py-2.5 px-3 rounded-xl border-2 border-red-100 text-red-300 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
