"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

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

const FILTERS = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "⏰ Upcoming" },
  { id: "past", label: "✓ Past" },
  { id: "business", label: "💼 Business" },
];

export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [filter, setFilter] = useState("all");
  const [mounted, setMounted] = useState(false);
  const [deleting, setDeleting] = useState(null);

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
  const shown = trips.filter(t => {
    if (filter === "upcoming") return t.form?.startDate && new Date(t.form.startDate) >= now;
    if (filter === "past")     return t.form?.endDate && new Date(t.form.endDate) < now;
    if (filter === "business") return t.style === "business";
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
            <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-1">✦ All Trips</p>
            <h1 className="text-3xl font-black text-gray-900">My Trips</h1>
          </div>
          <Link href="/plan" className="font-black text-white text-sm px-5 py-3 rounded-2xl shadow-md shadow-orange-200" style={{ background: G }}>
            + New
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
              {f.label}
            </button>
          ))}
        </div>

        {/* Trips grid */}
        {shown.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-orange-100">
            <div className="text-5xl mb-3">🗺️</div>
            <p className="font-black text-gray-900 mb-1">No trips here yet</p>
            <p className="text-sm text-gray-400 mb-6">Start planning to see your trips!</p>
            <Link href="/plan" className="inline-block font-black text-white text-sm px-8 py-3 rounded-2xl" style={{ background: G }}>
              Plan a Trip →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map(t => {
              const color = destColor(t.destination);
              const d = t.form?.startDate ? Math.ceil((new Date(t.form.startDate) - now) / 86400000) : null;
              const isDel = deleting === t.id;

              return (
                <div key={t.id} className="bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-sm">
                  <div className="h-1.5" style={{ background: `linear-gradient(90deg,${color},${color}66)` }} />
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: `${color}15` }}>
                        {STYLE_E[t.style] || "🌍"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-black text-gray-900">{t.destination || "Untitled Trip"}</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {t.form?.startDate ? `${t.form.startDate} → ${t.form.endDate}` : "No dates set"}
                              {t.days ? ` · ${t.days} days` : ""}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-black text-sm" style={{ color }}>{t.currency} {t.total_estimated_cost?.toLocaleString()}</div>
                            {d !== null && d >= 0 && <div className="text-xs text-orange-400 font-bold mt-0.5">{d === 0 ? "🔥 Today!" : `${d}d away`}</div>}
                            {d !== null && d < 0 && <div className="text-xs text-gray-300 font-medium mt-0.5">Completed</div>}
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <Link href={`/trip/${t.id}`}
                            className="flex-1 text-center text-xs font-black py-2.5 rounded-xl text-white" style={{ background: G }}>
                            Open Trip →
                          </Link>
                          <Link href={`/chat?tripId=${t.id}`}
                            className="text-xs font-black py-2.5 px-3 rounded-xl border-2 border-orange-100 text-orange-500 hover:bg-orange-50 transition-colors">
                            🤖 AI
                          </Link>
                          {isDel ? (
                            <div className="flex gap-1">
                              <button onClick={() => handleDelete(t.id)}
                                className="text-xs font-black py-2.5 px-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors">
                                Delete
                              </button>
                              <button onClick={() => setDeleting(null)}
                                className="text-xs font-black py-2.5 px-3 rounded-xl border-2 border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleting(t.id)}
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
