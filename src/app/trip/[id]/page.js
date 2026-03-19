"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const DESTINATION_THEMES = {
  japan:     { gradient: ["#FF6B6B", "#FF8E53"], emoji: "🗾", greeting: "Konnichiwa!", fact: "Japan has 14 UNESCO World Heritage Sites and some of the world's best street food." },
  tokyo:     { gradient: ["#FF6B6B", "#FF8E53"], emoji: "🗼", greeting: "Konnichiwa!", fact: "Tokyo is the world's most populous metro area with over 37 million people." },
  paris:     { gradient: ["#667eea", "#764ba2"], emoji: "🗼", greeting: "Bonjour!", fact: "Paris has over 1,800 monuments and 173 museums — including the world's most visited." },
  france:    { gradient: ["#667eea", "#764ba2"], emoji: "🇫🇷", greeting: "Bonjour!", fact: "France is the most visited country on earth, welcoming 90M tourists per year." },
  italy:     { gradient: ["#11998e", "#38ef7d"], emoji: "🇮🇹", greeting: "Benvenuto!", fact: "Italy has more UNESCO World Heritage Sites than any other country — 58 in total." },
  rome:      { gradient: ["#f7971e", "#ffd200"], emoji: "🏛️", greeting: "When in Rome!", fact: "Rome has more ancient fountains than any other city in the world." },
  greece:    { gradient: ["#2980B9", "#6DD5FA"], emoji: "🏛️", greeting: "Kalimera!", fact: "Greece has over 6,000 islands, though only around 250 are inhabited." },
  spain:     { gradient: ["#ee0979", "#ff6a00"], emoji: "🇪🇸", greeting: "¡Hola!", fact: "Spain is home to La Tomatina — the world's largest tomato fight, held every August." },
  thailand:  { gradient: ["#f7971e", "#ffd200"], emoji: "🐘", greeting: "Sawasdee!", fact: "Thailand has over 40,000 temples, including Wat Phra Kaew housing the sacred Emerald Buddha." },
  bali:      { gradient: ["#11998e", "#38ef7d"], emoji: "🌺", greeting: "Om Swastiastu!", fact: "Bali has over 20,000 temples — known as the 'Island of the Gods.'" },
  "new york":{ gradient: ["#4776E6", "#8E54E9"], emoji: "🗽", greeting: "Welcome to NYC!", fact: "New York City's subway system has 472 stations — the most of any metro in the world." },
  london:    { gradient: ["#4776E6", "#8E54E9"], emoji: "🎡", greeting: "Cheerio!", fact: "London's Tube is the world's oldest metro system, opened in 1863." },
  dubai:     { gradient: ["#f7971e", "#ffd200"], emoji: "🏙️", greeting: "Welcome to Dubai!", fact: "Dubai's Burj Khalifa is the tallest building on earth at 828 meters." },
  australia: { gradient: ["#f46b45", "#eea849"], emoji: "🦘", greeting: "G'day!", fact: "Australia is home to 80% of species found nowhere else on earth." },
  israel:    { gradient: ["#2980B9", "#6DD5FA"], emoji: "🕍", greeting: "Shalom!", fact: "Israel has more museums per capita than any other country in the world." },
  "tel aviv":{ gradient: ["#11998e", "#38ef7d"], emoji: "🏖️", greeting: "Shalom!", fact: "Tel Aviv was founded in 1909 and has the world's highest concentration of Bauhaus buildings." },
  default:   { gradient: ["#f97316", "#ec4899"], emoji: "🌍", greeting: "Adventure awaits!", fact: null },
};

function getTheme(destination) {
  if (!destination) return DESTINATION_THEMES.default;
  const key = destination.toLowerCase();
  for (const [k, v] of Object.entries(DESTINATION_THEMES)) {
    if (key.includes(k)) return v;
  }
  return DESTINATION_THEMES.default;
}

const BUDGET_CATS = {
  accommodation: { color: "#f97316", label: "Accommodation" },
  food:          { color: "#ec4899", label: "Food & Dining" },
  activities:    { color: "#8b5cf6", label: "Activities" },
  transportation:{ color: "#3b82f6", label: "Transportation" },
  other:         { color: "#9ca3af", label: "Other" },
};

const STYLE_ICONS = { adventure: "🧗", relaxed: "🏖️", cultural: "🏛️", luxury: "✨" };

const TIME_STYLE = {
  morning:   { bg: "#fff7ed", text: "#ea580c", label: "Morning" },
  afternoon: { bg: "#fdf4ff", text: "#9333ea", label: "Afternoon" },
  evening:   { bg: "#eff6ff", text: "#2563eb", label: "Evening" },
};

export default function TripPage() {
  const { id } = useParams();
  const router = useRouter();
  const [trip, setTrip] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(`trip_${id}`);
    if (!stored) { router.push("/plan"); return; }
    try { setTrip(JSON.parse(stored)); }
    catch { router.push("/plan"); }
  }, [id, router]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  if (!trip) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#FFF8F0" }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-orange-400 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-gray-400 font-medium">Loading your trip...</p>
      </div>
    </div>
  );

  const { daily_itinerary = [], budget_breakdown = {}, tips = [], form } = trip;
  const totalBudget = Object.values(budget_breakdown).reduce((a, b) => a + b, 0);
  const theme = getTheme(trip.destination || form?.destination);
  const heroGradient = `linear-gradient(135deg, ${theme.gradient[0]}, ${theme.gradient[1]})`;

  return (
    <main className="min-h-screen" style={{ background: "#FFF8F0" }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between bg-white/80 backdrop-blur-xl rounded-2xl px-5 py-3 shadow-sm border border-orange-100">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors">
              ← Home
            </Link>
            <span className="text-gray-200">|</span>
            <span className="font-black text-gray-900 text-sm">
              ✈️ <span className="gradient-text">AI-gency</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/plan"
              className="text-xs font-bold px-4 py-2 rounded-xl border-2 border-orange-100 text-gray-600 hover:border-orange-200 transition-colors bg-white">
              New Trip
            </Link>
            <button onClick={copyLink}
              className="text-xs font-bold px-4 py-2 rounded-xl text-white shadow-md shadow-orange-200 transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #f97316, #ec4899)" }}>
              {copied ? "✓ Copied!" : "🔗 Share"}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="mx-4 sm:mx-6 mt-3 rounded-3xl overflow-hidden" style={{ background: heroGradient }}>
        <div className="max-w-5xl mx-auto px-6 py-10 sm:py-12">
          {/* Greeting */}
          <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-1">
            ✦ {theme.greeting}
          </p>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  STYLE_ICONS[trip.style] + " " + (trip.style?.charAt(0).toUpperCase() + trip.style?.slice(1)),
                  `👥 ${trip.travelers} ${trip.travelers === 1 ? "traveler" : "travelers"}`,
                  `🗓️ ${trip.days} days`,
                ].map((tag) => (
                  <span key={tag} className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-1">
                {theme.emoji} {trip.destination}
              </h1>
              <p className="text-white/60 text-sm font-medium">
                {form?.startDate} → {form?.endDate}
              </p>
            </div>

            {/* Cost badge */}
            <div className="rounded-2xl p-5 text-center"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)" }}>
              <div className="text-3xl font-black text-white">
                {trip.currency} {trip.total_estimated_cost?.toLocaleString()}
              </div>
              <div className="text-white/60 text-xs mt-1 font-medium">Total Estimate</div>
              {trip.travelers > 1 && (
                <div className="text-white/50 text-xs mt-0.5">
                  ≈ {trip.currency} {Math.round(trip.total_estimated_cost / trip.travelers).toLocaleString()} / person
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {trip.summary && (
            <p className="mt-5 text-white/75 text-sm leading-relaxed max-w-2xl rounded-2xl px-5 py-4"
              style={{ background: "rgba(255,255,255,0.12)" }}>
              {trip.summary}
            </p>
          )}

          {/* Fun fact */}
          {theme.fact && (
            <div className="mt-3 flex items-start gap-3 max-w-2xl rounded-2xl px-5 py-3"
              style={{ background: "rgba(255,255,255,0.1)" }}>
              <span className="text-yellow-300 flex-shrink-0">💡</span>
              <p className="text-white/65 text-xs leading-relaxed">{theme.fact}</p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* Budget Breakdown */}
        {totalBudget > 0 && (
          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-5">💰 Budget Breakdown</h2>
            <div className="bg-white rounded-3xl border border-orange-100 p-6 shadow-sm">
              {/* Bar */}
              <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-6">
                {Object.entries(budget_breakdown).map(([key, val]) => {
                  const pct = totalBudget > 0 ? (val / totalBudget) * 100 : 0;
                  return (
                    <div key={key} className="rounded-full transition-all"
                      style={{ width: `${pct}%`, background: BUDGET_CATS[key]?.color || "#9ca3af" }} />
                  );
                })}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(budget_breakdown).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: BUDGET_CATS[key]?.color || "#9ca3af" }} />
                    <div>
                      <div className="text-xs text-gray-400">{BUDGET_CATS[key]?.label || key}</div>
                      <div className="text-sm font-bold text-gray-900">
                        {trip.currency} {val?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Itinerary */}
        {daily_itinerary.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-5">🗓️ Day-by-Day Itinerary</h2>

            {/* Day tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-5">
              {daily_itinerary.map((day, i) => (
                <button key={i} onClick={() => setActiveDay(i)}
                  className="flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-bold transition-all"
                  style={activeDay === i
                    ? { background: heroGradient, color: "white", boxShadow: "0 4px 12px rgba(249,115,22,0.3)" }
                    : { background: "white", color: "#6b7280", border: "2px solid #ffedd5" }}>
                  Day {day.day}
                </button>
              ))}
            </div>

            {/* Day content */}
            {daily_itinerary[activeDay] && (
              <div className="bg-white rounded-3xl border border-orange-100 overflow-hidden shadow-sm">
                {/* Day header */}
                <div className="p-6 border-b border-orange-50" style={{ background: "#FFF8F0" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: theme.gradient[0] }}>
                        Day {daily_itinerary[activeDay].day} · {daily_itinerary[activeDay].date}
                      </div>
                      <h3 className="text-xl font-black text-gray-900">
                        {daily_itinerary[activeDay].title}
                      </h3>
                      {daily_itinerary[activeDay].accommodation && (
                        <p className="text-sm text-gray-400 mt-1 font-medium">
                          🏨 {daily_itinerary[activeDay].accommodation}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 rounded-2xl px-4 py-2"
                      style={{ background: "white", border: "2px solid #ffedd5" }}>
                      <div className="text-lg font-black" style={{ color: theme.gradient[0] }}>
                        {trip.currency} {daily_itinerary[activeDay].daily_cost?.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">day total</div>
                    </div>
                  </div>
                </div>

                {/* Activities */}
                <div className="divide-y divide-orange-50">
                  {daily_itinerary[activeDay].activities?.map((a, j) => {
                    const ts = TIME_STYLE[a.time] || TIME_STYLE.morning;
                    return (
                      <div key={j} className="p-5 flex gap-4 hover:bg-orange-50/30 transition-colors">
                        <div className="flex-shrink-0 pt-0.5">
                          <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                            style={{ background: ts.bg, color: ts.text }}>
                            {ts.label}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-gray-900 text-sm">{a.name}</h4>
                            {a.estimated_cost > 0 && (
                              <span className="text-xs font-bold text-gray-400 flex-shrink-0 mt-0.5">
                                {trip.currency} {a.estimated_cost?.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mt-1 leading-relaxed">{a.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Prev/Next */}
                <div className="px-6 py-4 flex justify-between" style={{ background: "#FFF8F0" }}>
                  <button onClick={() => setActiveDay((p) => Math.max(0, p - 1))}
                    disabled={activeDay === 0}
                    className="text-sm font-bold text-gray-400 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    ← Previous
                  </button>
                  <button onClick={() => setActiveDay((p) => Math.min(daily_itinerary.length - 1, p + 1))}
                    disabled={activeDay === daily_itinerary.length - 1}
                    className="text-sm font-bold text-gray-400 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tips */}
        {tips.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-5">
              💡 Tips for {trip.destination}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tips.map((tip, i) => (
                <div key={i} className="flex gap-3 bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
                  <span className="text-xs font-black flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-white"
                    style={{ background: heroGradient }}>
                    {i + 1}
                  </span>
                  <p className="text-gray-500 text-sm leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Share CTA */}
        <section>
          <div className="relative rounded-3xl overflow-hidden p-8 sm:p-10 text-center text-white"
            style={{ background: heroGradient }}>
            <div className="relative">
              <div className="text-4xl mb-3">{theme.emoji}</div>
              <h2 className="text-2xl sm:text-3xl font-black mb-2">Your trip is ready!</h2>
              <p className="text-white/70 mb-6 text-sm">Share this plan with your travel companions.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={copyLink}
                  className="bg-white font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:-translate-y-0.5 transition-all text-sm"
                  style={{ color: theme.gradient[0] }}>
                  {copied ? "✓ Link Copied!" : "🔗 Copy Share Link"}
                </button>
                <Link href="/plan"
                  className="font-bold px-8 py-3.5 rounded-2xl transition-all text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.3)" }}>
                  Plan Another Trip
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
