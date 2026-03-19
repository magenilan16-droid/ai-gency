"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getTrip, updateTrip } from "@/lib/trips";

// ─── Destination themes ───────────────────────────────────────────────────────
const THEMES = {
  japan:     { g: ["#FF6B6B","#FF8E53"], e: "🗾", hi: "Konnichiwa!", fact: "Japan has 14 UNESCO World Heritage Sites and some of the world's best street food." },
  tokyo:     { g: ["#FF6B6B","#FF8E53"], e: "🗼", hi: "Konnichiwa!", fact: "Tokyo is the world's most populous metro area — over 37 million people." },
  paris:     { g: ["#667eea","#764ba2"], e: "🗼", hi: "Bonjour!", fact: "Paris has 1,800+ monuments and 173 museums, including the world's most visited." },
  france:    { g: ["#667eea","#764ba2"], e: "🇫🇷", hi: "Bonjour!", fact: "France is the most visited country on earth, welcoming 90M tourists per year." },
  italy:     { g: ["#11998e","#38ef7d"], e: "🇮🇹", hi: "Benvenuto!", fact: "Italy has more UNESCO World Heritage Sites than any other country — 58 total." },
  rome:      { g: ["#f7971e","#ffd200"], e: "🏛️", hi: "When in Rome!", fact: "Rome has more ancient fountains than any other city in the world." },
  greece:    { g: ["#2980B9","#6DD5FA"], e: "🏛️", hi: "Kalimera!", fact: "Greece has over 6,000 islands, though only 250 are inhabited." },
  spain:     { g: ["#ee0979","#ff6a00"], e: "🇪🇸", hi: "¡Hola!", fact: "Spain hosts La Tomatina — the world's largest tomato fight, every August." },
  thailand:  { g: ["#f7971e","#ffd200"], e: "🐘", hi: "Sawasdee!", fact: "Thailand has 40,000+ temples, including the sacred Wat Phra Kaew." },
  bali:      { g: ["#11998e","#38ef7d"], e: "🌺", hi: "Om Swastiastu!", fact: "Bali has 20,000+ temples — known as the Island of the Gods." },
  "new york":{ g: ["#4776E6","#8E54E9"], e: "🗽", hi: "Welcome to NYC!", fact: "NYC's subway has 472 stations — the most of any metro in the world." },
  london:    { g: ["#4776E6","#8E54E9"], e: "🎡", hi: "Cheerio!", fact: "London's Tube is the world's oldest metro system, opened in 1863." },
  dubai:     { g: ["#f7971e","#ffd200"], e: "🏙️", hi: "Welcome to Dubai!", fact: "The Burj Khalifa is the tallest building on earth at 828 meters." },
  australia: { g: ["#f46b45","#eea849"], e: "🦘", hi: "G'day!", fact: "Australia is home to 80% of species found nowhere else on earth." },
  israel:    { g: ["#2980B9","#6DD5FA"], e: "🕍", hi: "Shalom!", fact: "Israel has more museums per capita than any other country." },
  "tel aviv":{ g: ["#11998e","#38ef7d"], e: "🏖️", hi: "Shalom!", fact: "Tel Aviv was founded in 1909 and has the world's highest concentration of Bauhaus buildings." },
  default:   { g: ["#f97316","#ec4899"], e: "🌍", hi: "Adventure awaits!", fact: null },
};

function getTheme(dest) {
  if (!dest) return THEMES.default;
  const k = dest.toLowerCase();
  for (const [key, val] of Object.entries(THEMES)) {
    if (k.includes(key)) return val;
  }
  return THEMES.default;
}

const BUDGET_CATS = {
  accommodation: { color: "#f97316", label: "Accommodation" },
  food:          { color: "#ec4899", label: "Food & Dining" },
  activities:    { color: "#8b5cf6", label: "Activities" },
  transportation:{ color: "#3b82f6", label: "Transportation" },
  other:         { color: "#9ca3af", label: "Other" },
};
const STYLE_ICONS = { adventure:"🧗", relaxed:"🏖️", cultural:"🏛️", luxury:"✨" };
const TIME_OPTS = ["morning","afternoon","evening"];
const TIME_STYLE = {
  morning:   { bg:"#fff7ed", text:"#ea580c" },
  afternoon: { bg:"#fdf4ff", text:"#9333ea" },
  evening:   { bg:"#eff6ff", text:"#2563eb" },
};

// ─── Editable text field ──────────────────────────────────────────────────────
function Editable({ value, onChange, className = "", multiline = false, placeholder = "Click to edit..." }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);

  useEffect(() => { setLocal(value); }, [value]);

  function done() {
    setEditing(false);
    if (local !== value) onChange(local);
  }

  if (editing) {
    const cls = "w-full bg-orange-50 border-2 border-orange-300 rounded-xl px-3 py-2 outline-none text-sm text-gray-900 font-medium " + className;
    return multiline
      ? <textarea autoFocus rows={2} value={local} onChange={e => setLocal(e.target.value)} onBlur={done} className={cls} />
      : <input autoFocus type="text" value={local} onChange={e => setLocal(e.target.value)} onBlur={done} onKeyDown={e => e.key === "Enter" && done()} className={cls} />;
  }

  return (
    <span onClick={() => setEditing(true)} className={"cursor-text hover:bg-orange-50 rounded-lg px-1 -mx-1 transition-colors border border-dashed border-transparent hover:border-orange-200 " + className} title="Click to edit">
      {value || <span className="text-gray-300 italic">{placeholder}</span>}
    </span>
  );
}

// ─── Number editable ──────────────────────────────────────────────────────────
function EditableNumber({ value, onChange, prefix = "", className = "" }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);
  function done() { setEditing(false); const n = Number(local); if (!isNaN(n)) onChange(n); }
  if (editing) return <input autoFocus type="number" min="0" value={local} onChange={e => setLocal(e.target.value)} onBlur={done} onKeyDown={e => e.key === "Enter" && done()} className={"w-24 bg-orange-50 border-2 border-orange-300 rounded-lg px-2 py-1 outline-none text-sm font-bold " + className} />;
  return <span onClick={() => setEditing(true)} className={"cursor-text hover:bg-orange-50 rounded-lg px-1 -mx-1 transition-colors border border-dashed border-transparent hover:border-orange-200 font-bold " + className} title="Click to edit">{prefix}{value?.toLocaleString()}</span>;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TripPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [trip, setTrip] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const t = getTrip(id);
    if (!t) { router.push("/plan"); return; }
    setTrip(t);
    if (searchParams.get("edit") === "true") setEditMode(true);
  }, [id, router, searchParams]);

  const persist = useCallback((updated) => {
    updateTrip(id, updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [id]);

  function setTripAndSave(updater) {
    setTrip(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persist(next);
      return next;
    });
  }

  // ── Activity helpers ──
  function updateActivity(di, ai, field, value) {
    setTripAndSave(p => {
      const t = JSON.parse(JSON.stringify(p));
      t.daily_itinerary[di].activities[ai][field] = value;
      // Recalculate daily cost
      t.daily_itinerary[di].daily_cost = t.daily_itinerary[di].activities.reduce((s, a) => s + (Number(a.estimated_cost) || 0) * (t.travelers || 1), 0);
      // Recalculate total
      t.total_estimated_cost = t.daily_itinerary.reduce((s, d) => s + (d.daily_cost || 0), 0);
      return t;
    });
  }

  function addActivity(di) {
    setTripAndSave(p => {
      const t = JSON.parse(JSON.stringify(p));
      t.daily_itinerary[di].activities.push({ time: "morning", name: "New Activity", description: "Describe this activity.", estimated_cost: 0 });
      return t;
    });
  }

  function deleteActivity(di, ai) {
    setTripAndSave(p => {
      const t = JSON.parse(JSON.stringify(p));
      t.daily_itinerary[di].activities.splice(ai, 1);
      t.daily_itinerary[di].daily_cost = t.daily_itinerary[di].activities.reduce((s, a) => s + (Number(a.estimated_cost) || 0) * (t.travelers || 1), 0);
      t.total_estimated_cost = t.daily_itinerary.reduce((s, d) => s + (d.daily_cost || 0), 0);
      return t;
    });
  }

  function updateDayField(di, field, value) {
    setTripAndSave(p => { const t = JSON.parse(JSON.stringify(p)); t.daily_itinerary[di][field] = value; return t; });
  }

  function updateTip(i, value) {
    setTripAndSave(p => { const t = JSON.parse(JSON.stringify(p)); t.tips[i] = value; return t; });
  }

  function deleteTip(i) {
    setTripAndSave(p => { const t = JSON.parse(JSON.stringify(p)); t.tips.splice(i, 1); return t; });
  }

  function addTip() {
    setTripAndSave(p => { const t = JSON.parse(JSON.stringify(p)); t.tips.push("Add your tip here"); return t; });
  }

  function updateBudget(key, value) {
    setTripAndSave(p => { const t = JSON.parse(JSON.stringify(p)); t.budget_breakdown[key] = Number(value); t.total_estimated_cost = Object.values(t.budget_breakdown).reduce((a, b) => a + b, 0); return t; });
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  }

  // ── Loading ──
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
  const hero = `linear-gradient(135deg,${theme.g[0]},${theme.g[1]})`;

  return (
    <main className="min-h-screen" style={{ background: "#FFF8F0" }}>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 px-3 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between bg-white/90 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-sm border border-orange-100">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-gray-400 hover:text-gray-600 text-xs sm:text-sm font-medium transition-colors">← Home</Link>
            <span className="text-gray-200 hidden sm:inline">|</span>
            <span className="font-black text-gray-900 text-sm hidden sm:inline">✈️ <span className="gradient-text">AI-gency</span></span>
          </div>
          <div className="flex items-center gap-2">
            {/* Edit toggle */}
            <button onClick={() => setEditMode(e => !e)}
              className="text-xs font-bold px-3 py-2 rounded-xl border-2 transition-all"
              style={editMode ? { borderColor: "#f97316", background: "#fff7ed", color: "#f97316" } : { borderColor: "#ffe4cc", background: "white", color: "#9ca3af" }}>
              {editMode ? "✓ Editing" : "✏️ Edit"}
            </button>
            <Link href="/plan" className="text-xs font-bold px-3 py-2 rounded-xl border-2 border-orange-100 text-gray-500 bg-white hover:border-orange-200 transition-colors hidden sm:block">
              New Trip
            </Link>
            <button onClick={copyLink}
              className="text-xs font-bold px-3 py-2 rounded-xl text-white shadow-sm transition-all hover:opacity-90"
              style={{ background: hero }}>
              {copied ? "✓ Copied!" : "🔗 Share"}
            </button>
          </div>
        </div>
      </nav>

      {/* Edit mode banner */}
      {editMode && (
        <div className="mx-3 sm:mx-6 mb-3 rounded-2xl px-5 py-3 flex items-center gap-3 text-sm font-medium"
          style={{ background: "#fff7ed", border: "2px solid #fed7aa" }}>
          <span className="text-orange-500">✏️</span>
          <span className="text-orange-700 font-bold">Edit Mode</span>
          <span className="text-orange-500 font-medium">— Click on any text to edit it directly.</span>
          {saved && <span className="ml-auto text-green-600 font-bold text-xs">✓ Saved!</span>}
        </div>
      )}

      {/* ── Hero ── */}
      <div className="mx-3 sm:mx-6 rounded-3xl overflow-hidden mb-6" style={{ background: hero }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
          <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-1">✦ {theme.hi}</p>

          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  `${STYLE_ICONS[trip.style] || "🌍"} ${trip.style?.charAt(0).toUpperCase() + trip.style?.slice(1) || "Trip"}`,
                  `👥 ${trip.travelers} ${trip.travelers === 1 ? "traveler" : "travelers"}`,
                  `🗓️ ${trip.days} days`,
                ].map(tag => (
                  <span key={tag} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>{tag}</span>
                ))}
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-1">
                {theme.e} {editMode
                  ? <Editable value={trip.destination} onChange={v => setTripAndSave(p => ({ ...p, destination: v }))} className="text-white" />
                  : trip.destination}
              </h1>
              <p className="text-white/60 text-sm font-medium">{form?.startDate} → {form?.endDate}</p>
            </div>

            <div className="rounded-2xl p-4 text-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
              <div className="text-2xl sm:text-3xl font-black text-white">
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

          {trip.summary && (
            <p className="mt-5 text-white/75 text-sm leading-relaxed max-w-2xl rounded-2xl px-5 py-4" style={{ background: "rgba(255,255,255,0.12)" }}>
              {editMode
                ? <Editable value={trip.summary} onChange={v => setTripAndSave(p => ({ ...p, summary: v }))} multiline className="text-white" />
                : trip.summary}
            </p>
          )}

          {theme.fact && !editMode && (
            <div className="mt-3 flex items-start gap-3 max-w-2xl rounded-2xl px-5 py-3" style={{ background: "rgba(255,255,255,0.1)" }}>
              <span className="text-yellow-300 flex-shrink-0">💡</span>
              <p className="text-white/65 text-xs leading-relaxed">{theme.fact}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 space-y-8 pb-12">

        {/* ── Budget Breakdown ── */}
        {totalBudget > 0 && (
          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-4">💰 Budget Breakdown</h2>
            <div className="bg-white rounded-3xl border border-orange-100 p-5 sm:p-6 shadow-sm">
              <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-5">
                {Object.entries(budget_breakdown).map(([k, v]) => (
                  <div key={k} className="rounded-full" style={{ width: `${totalBudget > 0 ? (v / totalBudget) * 100 : 0}%`, background: BUDGET_CATS[k]?.color || "#9ca3af" }} />
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(budget_breakdown).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: BUDGET_CATS[k]?.color || "#9ca3af" }} />
                    <div>
                      <div className="text-xs text-gray-400">{BUDGET_CATS[k]?.label || k}</div>
                      <div className="text-sm font-bold text-gray-900">
                        {trip.currency}{" "}
                        {editMode
                          ? <EditableNumber value={v} onChange={val => updateBudget(k, val)} />
                          : v?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Itinerary ── */}
        {daily_itinerary.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-4">🗓️ Day-by-Day Itinerary</h2>

            {/* Day tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
              {daily_itinerary.map((day, i) => (
                <button key={i} onClick={() => setActiveDay(i)}
                  className="flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-bold transition-all"
                  style={activeDay === i
                    ? { background: hero, color: "white", boxShadow: `0 4px 12px ${theme.g[0]}40` }
                    : { background: "white", color: "#6b7280", border: "2px solid #ffedd5" }}>
                  Day {day.day}
                </button>
              ))}
            </div>

            {/* Active day card */}
            {daily_itinerary[activeDay] && (
              <div className="bg-white rounded-3xl border border-orange-100 overflow-hidden shadow-sm">
                {/* Day header */}
                <div className="p-5 sm:p-6 border-b border-orange-50" style={{ background: "#FFF8F0" }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: theme.g[0] }}>
                        Day {daily_itinerary[activeDay].day} · {daily_itinerary[activeDay].date}
                      </div>
                      <h3 className="text-xl font-black text-gray-900">
                        {editMode
                          ? <Editable value={daily_itinerary[activeDay].title} onChange={v => updateDayField(activeDay, "title", v)} />
                          : daily_itinerary[activeDay].title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1 font-medium">
                        🏨 {editMode
                          ? <Editable value={daily_itinerary[activeDay].accommodation} onChange={v => updateDayField(activeDay, "accommodation", v)} placeholder="Add hotel..." />
                          : daily_itinerary[activeDay].accommodation}
                      </p>
                    </div>
                    <div className="rounded-2xl px-4 py-2 text-center" style={{ background: "white", border: "2px solid #ffedd5" }}>
                      <div className="text-lg font-black" style={{ color: theme.g[0] }}>
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
                      <div key={j} className="p-4 sm:p-5 flex gap-3 sm:gap-4 hover:bg-orange-50/30 transition-colors group">
                        <div className="flex-shrink-0 pt-0.5">
                          {editMode ? (
                            <select value={a.time} onChange={e => updateActivity(activeDay, j, "time", e.target.value)}
                              className="text-xs font-bold px-2 py-1.5 rounded-full border-2 outline-none"
                              style={{ background: ts.bg, color: ts.text, borderColor: ts.bg }}>
                              {TIME_OPTS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                          ) : (
                            <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: ts.bg, color: ts.text }}>
                              {a.time?.charAt(0).toUpperCase() + a.time?.slice(1)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-gray-900 text-sm">
                              {editMode
                                ? <Editable value={a.name} onChange={v => updateActivity(activeDay, j, "name", v)} />
                                : a.name}
                            </h4>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {a.estimated_cost > 0 && (
                                <span className="text-xs font-bold text-gray-400">
                                  {trip.currency} {editMode
                                    ? <EditableNumber value={a.estimated_cost} onChange={v => updateActivity(activeDay, j, "estimated_cost", v)} />
                                    : a.estimated_cost?.toLocaleString()}
                                </span>
                              )}
                              {editMode && (
                                <button onClick={() => deleteActivity(activeDay, j)}
                                  className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-red-100 text-red-400 hover:bg-red-200 hover:text-red-600 transition-all flex items-center justify-center text-xs font-black">
                                  ×
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                            {editMode
                              ? <Editable value={a.description} onChange={v => updateActivity(activeDay, j, "description", v)} multiline />
                              : a.description}
                          </p>
                          {editMode && a.estimated_cost === 0 && (
                            <button onClick={() => updateActivity(activeDay, j, "estimated_cost", 50)}
                              className="mt-1 text-xs text-orange-400 hover:text-orange-600 font-medium">
                              + Add cost
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add activity button */}
                {editMode && (
                  <div className="p-4 border-t border-orange-50">
                    <button onClick={() => addActivity(activeDay)}
                      className="w-full py-3 rounded-2xl border-2 border-dashed border-orange-200 text-orange-400 hover:border-orange-300 hover:bg-orange-50 transition-all text-sm font-bold">
                      + Add Activity
                    </button>
                  </div>
                )}

                {/* Prev/Next */}
                <div className="px-5 py-4 flex justify-between" style={{ background: "#FFF8F0" }}>
                  <button onClick={() => setActiveDay(p => Math.max(0, p - 1))} disabled={activeDay === 0}
                    className="text-sm font-bold text-gray-400 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    ← Previous
                  </button>
                  <button onClick={() => setActiveDay(p => Math.min(daily_itinerary.length - 1, p + 1))} disabled={activeDay === daily_itinerary.length - 1}
                    className="text-sm font-bold text-gray-400 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Tips ── */}
        {(tips.length > 0 || editMode) && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black text-gray-900">💡 Tips for {trip.destination}</h2>
              {editMode && (
                <button onClick={addTip} className="text-xs font-bold px-4 py-2 rounded-xl border-2 border-orange-200 text-orange-500 bg-orange-50 hover:bg-orange-100 transition-colors">
                  + Add Tip
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tips.map((tip, i) => (
                <div key={i} className="flex gap-3 bg-white rounded-2xl border border-orange-100 p-5 shadow-sm group">
                  <span className="text-xs font-black flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-white"
                    style={{ background: hero }}>{i + 1}</span>
                  <p className="text-gray-500 text-sm leading-relaxed flex-1">
                    {editMode
                      ? <Editable value={tip} onChange={v => updateTip(i, v)} multiline />
                      : tip}
                  </p>
                  {editMode && (
                    <button onClick={() => deleteTip(i)}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-lg bg-red-100 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Share CTA ── */}
        <section>
          <div className="relative rounded-3xl overflow-hidden p-7 sm:p-10 text-center text-white" style={{ background: hero }}>
            <div className="text-4xl mb-3">{theme.e}</div>
            <h2 className="text-2xl sm:text-3xl font-black mb-2">
              {trip.isManual ? "Your trip template is ready!" : "Your trip is ready!"}
            </h2>
            <p className="text-white/70 mb-6 text-sm">
              {trip.isManual ? "Keep editing to fill in all the details." : "Share this plan with your travel companions."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={copyLink}
                className="bg-white font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:-translate-y-0.5 transition-all text-sm"
                style={{ color: theme.g[0] }}>
                {copied ? "✓ Copied!" : "🔗 Copy Share Link"}
              </button>
              <Link href="/plan"
                className="font-bold px-8 py-3.5 rounded-2xl transition-all text-sm text-white border border-white/30"
                style={{ background: "rgba(255,255,255,0.2)" }}>
                Plan Another Trip
              </Link>
            </div>
            {!editMode && (
              <button onClick={() => setEditMode(true)} className="mt-4 block mx-auto text-white/60 text-xs font-medium hover:text-white/80 transition-colors">
                ✏️ Want to edit this trip?
              </button>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}
