"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// ─── Destination themes ───────────────────────────────────────────────────────
const DESTINATION_THEMES = {
  japan: {
    gradient: "from-red-500 to-pink-400",
    emoji: "🗾",
    greeting: "Konnichiwa! Your Japan adventure awaits",
    fact: "Japan has 14 UNESCO World Heritage Sites and some of the world's best street food.",
  },
  tokyo: {
    gradient: "from-red-500 to-pink-400",
    emoji: "🗾",
    greeting: "Konnichiwa! Tokyo, here you come",
    fact: "Tokyo is the world's most populous metropolitan area with over 37 million people.",
  },
  paris: {
    gradient: "from-blue-600 to-indigo-400",
    emoji: "🗼",
    greeting: "Bonjour! The City of Light is waiting",
    fact: "Paris has more than 1,800 monuments and 173 museums — including the Louvre, the world's most visited museum.",
  },
  france: {
    gradient: "from-blue-600 to-indigo-400",
    emoji: "🇫🇷",
    greeting: "Bonjour! France is calling your name",
    fact: "France is the most visited country in the world, welcoming nearly 90 million tourists a year.",
  },
  italy: {
    gradient: "from-green-500 to-emerald-400",
    emoji: "🇮🇹",
    greeting: "Benvenuto! Italy will steal your heart",
    fact: "Italy has more UNESCO World Heritage Sites than any other country in the world — 58 in total.",
  },
  rome: {
    gradient: "from-amber-500 to-orange-400",
    emoji: "🏛️",
    greeting: "When in Rome! La dolce vita awaits",
    fact: "Rome has more ancient fountains than any other city in the world.",
  },
  greece: {
    gradient: "from-blue-500 to-cyan-400",
    emoji: "🏛️",
    greeting: "Kalimera! Greece is pure magic",
    fact: "Greece has over 6,000 islands, though only around 250 are inhabited.",
  },
  spain: {
    gradient: "from-red-500 to-yellow-400",
    emoji: "🇪🇸",
    greeting: "¡Hola! Spain is one unforgettable fiesta",
    fact: "Spain is home to La Tomatina, the world's largest tomato fight — held every August.",
  },
  thailand: {
    gradient: "from-orange-500 to-yellow-400",
    emoji: "🐘",
    greeting: "Sawasdee! Thailand's warmth is legendary",
    fact: "Thailand has over 40,000 temples, including Wat Phra Kaew which houses the sacred Emerald Buddha.",
  },
  bali: {
    gradient: "from-green-500 to-teal-400",
    emoji: "🌺",
    greeting: "Om Swastiastu! Bali is pure paradise",
    fact: "Bali has over 20,000 temples. It's known as the 'Island of the Gods.'",
  },
  new_york: {
    gradient: "from-gray-700 to-blue-600",
    emoji: "🗽",
    greeting: "New York, New York! The city that never sleeps",
    fact: "New York City's subway system has 472 stations — the most of any metro system in the world.",
  },
  "new york": {
    gradient: "from-gray-700 to-blue-600",
    emoji: "🗽",
    greeting: "New York, New York! The city that never sleeps",
    fact: "New York City's subway system has 472 stations — the most of any metro system in the world.",
  },
  london: {
    gradient: "from-purple-600 to-blue-500",
    emoji: "🎡",
    greeting: "Cheerio! London has something for everyone",
    fact: "London's underground (The Tube) is the world's oldest metro system, opened in 1863.",
  },
  dubai: {
    gradient: "from-yellow-500 to-amber-400",
    emoji: "🏙️",
    greeting: "Welcome to Dubai — where the future is now!",
    fact: "Dubai is home to the Burj Khalifa, the tallest building in the world at 828 meters.",
  },
  australia: {
    gradient: "from-yellow-500 to-orange-400",
    emoji: "🦘",
    greeting: "G'day! Australia is wild and wonderful",
    fact: "Australia is the only continent that is also a single country, and it's home to 80% of species found nowhere else on Earth.",
  },
  israel: {
    gradient: "from-blue-500 to-sky-400",
    emoji: "🕍",
    greeting: "Shalom! Israel — ancient history meets modern energy",
    fact: "Israel has more museums per capita than any other country in the world.",
  },
  "tel aviv": {
    gradient: "from-blue-400 to-cyan-400",
    emoji: "🏖️",
    greeting: "Shalom! Tel Aviv — the city that never stops",
    fact: "Tel Aviv was founded in 1909 and has the world's highest concentration of Bauhaus buildings.",
  },
  default: {
    gradient: "from-blue-600 to-sky-500",
    emoji: "🌍",
    greeting: "Your adventure starts here",
    fact: null,
  },
};

function getTheme(destination) {
  if (!destination) return DESTINATION_THEMES.default;
  const key = destination.toLowerCase();
  for (const [k, v] of Object.entries(DESTINATION_THEMES)) {
    if (key.includes(k)) return v;
  }
  return DESTINATION_THEMES.default;
}

// ─── Budget colors ────────────────────────────────────────────────────────────
const BUDGET_COLORS = {
  accommodation: { color: "bg-blue-500", label: "Accommodation" },
  food: { color: "bg-orange-400", label: "Food & Dining" },
  activities: { color: "bg-green-500", label: "Activities" },
  transportation: { color: "bg-purple-500", label: "Transportation" },
  other: { color: "bg-gray-400", label: "Other" },
};

const STYLE_ICONS = {
  adventure: "🧗", relaxed: "🏖️", cultural: "🏛️", luxury: "✨",
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

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading your trip...</p>
        </div>
      </div>
    );
  }

  const { daily_itinerary = [], budget_breakdown = {}, tips = [], form } = trip;
  const totalBudget = Object.values(budget_breakdown).reduce((a, b) => a + b, 0);
  const theme = getTheme(trip.destination || form?.destination);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
              ← Home
            </Link>
            <span className="text-xl font-bold text-gray-900">✈️ AI-gency</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/plan" className="text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-full hover:border-gray-300 transition-colors">
              New Trip
            </Link>
            <button
              onClick={copyLink}
              className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
            >
              {copied ? "✓ Copied!" : "🔗 Share"}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero — destination-themed */}
      <div className={`bg-gradient-to-br ${theme.gradient} text-white py-12 px-4 sm:px-6`}>
        <div className="max-w-5xl mx-auto">
          {/* Greeting */}
          <p className="text-white/80 text-sm font-medium mb-2 tracking-wide uppercase">
            {theme.greeting}
          </p>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
                  {STYLE_ICONS[trip.style] || "🌍"} {trip.style?.charAt(0).toUpperCase() + trip.style?.slice(1)} Trip
                </span>
                <span className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
                  👥 {trip.travelers} {trip.travelers === 1 ? "Traveler" : "Travelers"}
                </span>
                <span className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
                  🗓️ {trip.days} {trip.days === 1 ? "day" : "days"}
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-1">
                {theme.emoji} {trip.destination}
              </h1>
              <p className="text-white/70 text-base">
                {form?.startDate} → {form?.endDate}
              </p>
            </div>

            {/* Cost badge */}
            <div className="bg-white/15 rounded-2xl p-5 text-center backdrop-blur-sm border border-white/20">
              <div className="text-3xl font-extrabold">
                {trip.currency} {trip.total_estimated_cost?.toLocaleString()}
              </div>
              <div className="text-white/70 text-sm mt-1">Estimated Total</div>
              {trip.travelers > 1 && (
                <div className="text-white/60 text-xs mt-1">
                  ≈ {trip.currency}{" "}
                  {Math.round(trip.total_estimated_cost / trip.travelers).toLocaleString()} / person
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {trip.summary && (
            <p className="mt-6 text-white/80 text-base max-w-3xl leading-relaxed bg-white/10 rounded-xl px-5 py-4">
              {trip.summary}
            </p>
          )}

          {/* Destination fun fact */}
          {theme.fact && (
            <div className="mt-4 flex items-start gap-3 bg-white/10 rounded-xl px-5 py-3 max-w-3xl">
              <span className="text-yellow-300 text-lg flex-shrink-0">💡</span>
              <p className="text-white/80 text-sm">{theme.fact}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* Budget Breakdown */}
        {totalBudget > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-5">💰 Budget Breakdown</h2>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex h-4 rounded-full overflow-hidden mb-5 gap-0.5">
                {Object.entries(budget_breakdown).map(([key, val]) => {
                  const pct = totalBudget > 0 ? (val / totalBudget) * 100 : 0;
                  return (
                    <div
                      key={key}
                      className={`${BUDGET_COLORS[key]?.color || "bg-gray-300"} transition-all`}
                      style={{ width: `${pct}%` }}
                      title={`${BUDGET_COLORS[key]?.label || key}: ${trip.currency}${val}`}
                    />
                  );
                })}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(budget_breakdown).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${BUDGET_COLORS[key]?.color || "bg-gray-300"}`} />
                    <div>
                      <div className="text-xs text-gray-500">{BUDGET_COLORS[key]?.label || key}</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {trip.currency} {val?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Day-by-day Itinerary */}
        {daily_itinerary.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-5">🗓️ Day-by-Day Itinerary</h2>

            {/* Day tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
              {daily_itinerary.map((day, i) => (
                <button
                  key={i}
                  onClick={() => setActiveDay(i)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeDay === i
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  Day {day.day}
                </button>
              ))}
            </div>

            {/* Active Day */}
            {daily_itinerary[activeDay] && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                        Day {daily_itinerary[activeDay].day} · {daily_itinerary[activeDay].date}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {daily_itinerary[activeDay].title}
                      </h3>
                      {daily_itinerary[activeDay].accommodation && (
                        <p className="text-sm text-gray-500 mt-1">
                          🏨 {daily_itinerary[activeDay].accommodation}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold text-gray-900">
                        {trip.currency} {daily_itinerary[activeDay].daily_cost?.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">day total</div>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-50">
                  {daily_itinerary[activeDay].activities?.map((activity, j) => (
                    <div key={j} className="p-5 flex gap-4">
                      <div className="flex-shrink-0 pt-0.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          activity.time === "morning"
                            ? "bg-yellow-100 text-yellow-700"
                            : activity.time === "afternoon"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-indigo-100 text-indigo-700"
                        }`}>
                          {activity.time}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-gray-900">{activity.name}</h4>
                          {activity.estimated_cost > 0 && (
                            <span className="text-sm text-gray-500 flex-shrink-0 font-medium">
                              {trip.currency} {activity.estimated_cost?.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-6 py-4 bg-gray-50 flex justify-between">
                  <button
                    onClick={() => setActiveDay((p) => Math.max(0, p - 1))}
                    disabled={activeDay === 0}
                    className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                  >
                    ← Previous Day
                  </button>
                  <button
                    onClick={() => setActiveDay((p) => Math.min(daily_itinerary.length - 1, p + 1))}
                    disabled={activeDay === daily_itinerary.length - 1}
                    className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                  >
                    Next Day →
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tips */}
        {tips.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-5">
              💡 Tips for {trip.destination}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tips.map((tip, i) => (
                <div key={i} className="flex gap-3 bg-white rounded-xl border border-gray-200 p-5">
                  <span className="text-blue-500 font-bold text-sm flex-shrink-0 mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-gray-600 text-sm leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Share CTA */}
        <section>
          <div className={`bg-gradient-to-br ${theme.gradient} rounded-2xl p-8 text-white text-center shadow-xl`}>
            <div className="text-4xl mb-3">{theme.emoji}</div>
            <h2 className="text-2xl font-bold mb-2">Your trip is ready!</h2>
            <p className="text-white/80 mb-6">
              Share this plan with your travel companions.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={copyLink}
                className="bg-white text-gray-800 font-semibold px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {copied ? "✓ Link Copied!" : "🔗 Copy Share Link"}
              </button>
              <Link
                href="/plan"
                className="bg-white/20 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/30 transition-colors border border-white/30"
              >
                Plan Another Trip
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
