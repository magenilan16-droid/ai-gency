"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
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
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#fff7ed", color: "#f97316" }}>
      {weather.emoji} {weather.temp}°
    </span>
  );
}

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
      <div className="w-10 h-10 rounded-full border-4 border-orange-300 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
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

        {/* Search */}
        <div className="mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("search_trips_placeholder")}
            className="w-full text-sm font-bold rounded-2xl px-4 py-3 border-2 border-orange-100 focus:border-orange-300 outline-none"
            style={{ background: "var(--bg-card)", color: "var(--text-main)" }}
          />
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
                          <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                            <div className="font-black text-sm" style={{ color }}>{tr.currency} {tr.total_estimated_cost?.toLocaleString()}</div>
                            {d !== null && d >= 0 && (
                              <div className="text-xs text-orange-400 font-bold">
                                {d === 0 ? t("today_badge") : t("x_d_away", { n: d })}
                              </div>
                            )}
                            {d !== null && d < 0 && (
                              <div className="text-xs text-gray-300 font-medium">{t("completed")}</div>
                            )}
                            <WeatherBadge destination={tr.destination} dateStr={tr.form?.startDate} />
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
