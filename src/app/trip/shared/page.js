"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveTrip, generateId } from "@/lib/trips";

const G = "linear-gradient(135deg,#f97316,#ec4899)";

const DEST_THEMES = {
  japan:    { g: ["#FF6B6B","#FF8E53"], e: "🗾" },
  paris:    { g: ["#667eea","#764ba2"], e: "🗼" },
  france:   { g: ["#667eea","#764ba2"], e: "🇫🇷" },
  italy:    { g: ["#11998e","#38ef7d"], e: "🇮🇹" },
  rome:     { g: ["#f7971e","#ffd200"], e: "🏛️" },
  greece:   { g: ["#2980B9","#6DD5FA"], e: "🏛️" },
  spain:    { g: ["#ee0979","#ff6a00"], e: "🇪🇸" },
  thailand: { g: ["#f7971e","#ffd200"], e: "🐘" },
  bali:     { g: ["#11998e","#38ef7d"], e: "🌺" },
  israel:   { g: ["#2980B9","#6DD5FA"], e: "🕍" },
  default:  { g: ["#f97316","#ec4899"], e: "🌍" },
};

function getTheme(dest) {
  if (!dest) return DEST_THEMES.default;
  const k = dest.toLowerCase();
  for (const [key, val] of Object.entries(DEST_THEMES)) {
    if (key !== "default" && k.includes(key)) return val;
  }
  return DEST_THEMES.default;
}

const TIME_STYLE = {
  morning:   { bg: "#fff7ed", text: "#ea580c", label: "Morning" },
  afternoon: { bg: "#fdf4ff", text: "#9333ea", label: "Afternoon" },
  evening:   { bg: "#eff6ff", text: "#2563eb", label: "Evening" },
};

export default function SharedTripPage() {
  const router = useRouter();
  const [trip, setTrip]     = useState(null);
  const [error, setError]   = useState("");
  const [saved, setSaved]   = useState(false);
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1);
      if (!hash) { setError("No trip data in this link."); return; }
      const json = decodeURIComponent(escape(atob(hash)));
      const data = JSON.parse(json);
      if (!data.destination) { setError("Invalid trip data."); return; }
      setTrip(data);
    } catch {
      setError("Could not read trip data. The link may be corrupted.");
    }
  }, []);

  function saveToMyTrips() {
    if (!trip) return;
    const id = generateId();
    saveTrip(id, { ...trip, savedFromShare: true });
    setSaved(true);
    setTimeout(() => router.push(`/trip/${id}`), 1200);
  }

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: "#FFF8F0" }}>
      <div className="text-5xl mb-4">🔗</div>
      <h1 className="text-2xl font-black text-gray-900 mb-2">Link not working</h1>
      <p className="text-gray-400 mb-6">{error}</p>
      <Link href="/plan" className="text-white font-black px-6 py-3 rounded-2xl" style={{ background: G }}>Plan My Own Trip →</Link>
    </div>
  );

  if (!trip) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#FFF8F0" }}>
      <div className="w-10 h-10 rounded-full border-4 border-orange-300 border-t-transparent animate-spin" />
    </div>
  );

  const theme = getTheme(trip.destination);
  const hero = `linear-gradient(135deg,${theme.g[0]},${theme.g[1]})`;
  const { daily_itinerary = [], tips = [], form } = trip;

  return (
    <div className="min-h-screen pb-10" style={{ background: "#FFF8F0" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-40 px-3 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between bg-white/90 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-sm border border-orange-100">
          <Link href="/" className="text-gray-400 text-sm font-medium">← AI-gency</Link>
          <span className="text-xs font-bold text-orange-400 bg-orange-50 px-3 py-1 rounded-full">👀 Shared Trip</span>
          <button
            onClick={saveToMyTrips}
            disabled={saved}
            className="text-xs font-black px-4 py-2 rounded-xl text-white disabled:opacity-60 transition-all"
            style={{ background: G }}>
            {saved ? "✓ Saved!" : "Save to My Trips"}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="mx-3 rounded-3xl overflow-hidden mb-4" style={{ background: hero }}>
        <div className="max-w-2xl mx-auto px-5 py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                {[`👥 ${trip.travelers} travelers`, `🗓️ ${trip.days} days`, trip.style && `✨ ${trip.style}`]
                  .filter(Boolean).map(tag => (
                  <span key={tag} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>{tag}</span>
                ))}
              </div>
              <h1 className="text-3xl font-black text-white leading-tight mb-1">
                {theme.e} {trip.destination}
              </h1>
              {form?.startDate && (
                <p className="text-white/60 text-sm">{form.startDate} → {form.endDate}</p>
              )}
            </div>
            <div className="rounded-2xl p-4 text-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
              <div className="text-2xl font-black text-white">{trip.currency} {trip.total_estimated_cost?.toLocaleString()}</div>
              <div className="text-white/60 text-xs mt-1">Total Budget</div>
            </div>
          </div>
          {trip.summary && (
            <p className="mt-4 text-white/75 text-sm leading-relaxed rounded-2xl px-5 py-4 max-w-2xl" style={{ background: "rgba(255,255,255,0.12)" }}>
              {trip.summary}
            </p>
          )}
        </div>
      </div>

      {/* Save banner */}
      <div className="mx-3 mb-4 bg-white rounded-2xl border-2 border-orange-100 p-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-black text-gray-900 text-sm">Want this trip?</p>
          <p className="text-xs text-gray-400">Save it to your AI-gency and start planning</p>
        </div>
        <button onClick={saveToMyTrips} disabled={saved}
          className="flex-shrink-0 text-sm font-black px-5 py-2.5 rounded-xl text-white disabled:opacity-60"
          style={{ background: G }}>
          {saved ? "✓ Saved!" : "Save Trip →"}
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-3 space-y-4">
        {/* Day tabs */}
        {daily_itinerary.length > 0 && (
          <>
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-2 pb-1" style={{ minWidth: "max-content" }}>
                {daily_itinerary.map((day, i) => (
                  <button key={i} onClick={() => setActiveDay(i)}
                    className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-black transition-all"
                    style={activeDay === i
                      ? { background: hero, color: "white" }
                      : { background: "white", color: "#9ca3af", border: "2px solid #ffedd5" }}>
                    Day {day.day}
                  </button>
                ))}
              </div>
            </div>

            {/* Active day */}
            {(() => {
              const day = daily_itinerary[activeDay];
              if (!day) return null;
              return (
                <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-orange-50" style={{ background: "#FFF8F0" }}>
                    <h2 className="font-black text-gray-900">Day {day.day} — {day.title}</h2>
                    {day.date && <p className="text-xs text-gray-400 mt-0.5">{day.date}</p>}
                  </div>
                  <div className="p-4 space-y-3">
                    {(day.activities || []).map((a, i) => {
                      const ts = TIME_STYLE[a.time] || TIME_STYLE.morning;
                      return (
                        <div key={i} className="flex gap-3">
                          <span className="text-xs font-black px-2 py-1 rounded-full flex-shrink-0 mt-0.5" style={{ background: ts.bg, color: ts.text }}>{ts.label}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-bold text-gray-900 text-sm">{a.name}</h4>
                              {a.estimated_cost > 0 && (
                                <span className="text-xs font-bold text-gray-400 flex-shrink-0">{trip.currency} {a.estimated_cost}</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{a.description}</p>
                          </div>
                        </div>
                      );
                    })}
                    {day.accommodation && (
                      <div className="bg-orange-50 rounded-xl px-4 py-3 mt-2">
                        <span className="text-xs font-black text-orange-400 uppercase tracking-wide block mb-1">🏨 Accommodation</span>
                        <p className="text-sm text-gray-700 font-medium">{day.accommodation}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* Tips */}
        {tips.length > 0 && (
          <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
            <h3 className="font-black text-gray-900 mb-3">💡 Travel Tips</h3>
            <div className="space-y-2">
              {tips.map((tip, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white font-black flex-shrink-0 mt-0.5" style={{ background: hero }}>{i+1}</span>
                  <p className="text-sm text-gray-600 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-2xl p-6 text-white text-center" style={{ background: G }}>
          <div className="text-3xl mb-2">✈️</div>
          <h3 className="font-black text-xl mb-1">Love this itinerary?</h3>
          <p className="text-white/70 text-sm mb-4">Save it and let AI plan your own perfect trip</p>
          <button onClick={saveToMyTrips} disabled={saved}
            className="bg-white font-black px-6 py-3 rounded-2xl text-sm disabled:opacity-60"
            style={{ color: "#f97316" }}>
            {saved ? "✓ Saved to My Trips!" : "Save This Trip →"}
          </button>
        </div>
      </div>
    </div>
  );
}
