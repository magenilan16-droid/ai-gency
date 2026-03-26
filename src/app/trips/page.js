"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/app/LanguageProvider";

const WMO_EMOJI = {
  0:"☀️",1:"🌤️",2:"⛅",3:"☁️",45:"🌫️",48:"🌫️",
  51:"🌦️",53:"🌦️",55:"🌧️",61:"🌧️",63:"🌧️",65:"🌧️",
  71:"❄️",73:"❄️",75:"❄️",77:"❄️",80:"🌦️",81:"🌧️",82:"⛈️",
  85:"❄️",86:"❄️",95:"⛈️",96:"⛈️",99:"⛈️",
};
function wmoEmoji(code) { return WMO_EMOJI[code] ?? "🌡️"; }

function WeatherBadge({ destination, dateStr }) {
  const [weather, setWeather] = useState(null);
  useEffect(() => {
    if (!destination || !dateStr) return;
    const d = new Date(dateStr);
    if (d < new Date()) return; // only future trips
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
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
      {weather.emoji} {weather.temp}°
    </span>
  );
}

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
  const [search, setSearch] = useState("");
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
    if (filter === "upcoming") { if (!(tr.form?.startDate && new Date(tr.form.startDate) >= now)) return false; }
    else if (filter === "past") { if (!(tr.form?.endDate && new Date(tr.form.endDate) < now)) return false; }
    else if (filter === "business") { if (tr.style !== "business") return false; }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (tr.destination || "").toLowerCase().includes(q) || (tr.style || "").toLowerCase().includes(q);
    }
    return true;
  });

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-orange-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 pt-8 pb-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Your trips</p>
            <h1 className="text-2xl font-bold text-gray-900">{t("my_trips")}</h1>
          </div>
          <Link href="/plan" className="bg-orange-500 text-white rounded-lg font-semibold text-sm px-4 py-2 hover:bg-orange-600 transition-colors">
            {t("new_trip_btn")}
          </Link>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("search_trips_placeholder")}
            className="w-full text-sm rounded-xl px-4 py-3 border border-gray-200 focus:border-gray-300 outline-none bg-white text-gray-900 placeholder-gray-400 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-5">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                filter === f.id
                  ? "bg-orange-50 text-orange-600 border-orange-200"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}>
              {t(f.labelKey)}
            </button>
          ))}
        </div>

        {/* Trips list */}
        {shown.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <p className="font-semibold text-gray-900 text-base mb-1">{t("no_trips_here")}</p>
            <p className="text-sm text-gray-400 mb-6">{t("start_planning_trips")}</p>
            <Link href="/plan" className="inline-block bg-orange-500 text-white rounded-lg font-semibold text-sm px-5 py-2.5 hover:bg-orange-600 transition-colors">
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
                <motion.div key={tr.id} whileHover={{ y: -2 }}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors">
                  {/* Colored accent line */}
                  <div className="h-0.5" style={{ background: color }} />
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: `${color}15` }}>
                        {STYLE_E[tr.style] || "🌍"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-base font-semibold text-gray-900">{tr.destination || t("untitled_trip")}</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {tr.form?.startDate ? `${tr.form.startDate} → ${tr.form.endDate}` : t("no_dates_set")}
                              {tr.days ? ` · ${tr.days} ${t("days")}` : ""}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                            <div className="text-sm font-semibold" style={{ color }}>{tr.currency} {tr.total_estimated_cost?.toLocaleString()}</div>
                            {d !== null && d >= 0 && (
                              <div className="text-xs text-orange-500 font-medium">
                                {d === 0 ? t("today_badge") : t("x_d_away", { n: d })}
                              </div>
                            )}
                            {d !== null && d < 0 && (
                              <div className="text-xs text-gray-400 font-medium">{t("completed")}</div>
                            )}
                            <WeatherBadge destination={tr.destination} dateStr={tr.form?.startDate} />
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <Link href={`/trip/${tr.id}`}
                            className="flex-1 text-center text-xs font-semibold py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors">
                            {t("open_trip")} →
                          </Link>
                          <Link href={`/chat?tripId=${tr.id}`}
                            className="text-xs font-semibold py-2 px-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                            🤖 AI
                          </Link>
                          {isDel ? (
                            <div className="flex gap-1">
                              <button onClick={() => handleDelete(tr.id)}
                                className="text-xs font-semibold py-2 px-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">
                                {t("delete")}
                              </button>
                              <button onClick={() => setDeleting(null)}
                                className="text-xs font-semibold py-2 px-3 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                                {t("cancel")}
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleting(tr.id)}
                              className="text-xs font-semibold py-2 px-3 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 hover:border-gray-300 transition-all">
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
