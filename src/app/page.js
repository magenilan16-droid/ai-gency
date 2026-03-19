"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ─── Per Diem Data (USD/day) ──────────────────────────────────────────────────
const PER_DIEM = {
  "United States":  { lodging: 107, meals: 59,  incidentals: 5,  flag: "🇺🇸" },
  "United Kingdom": { lodging: 180, meals: 75,  incidentals: 10, flag: "🇬🇧" },
  "France":         { lodging: 195, meals: 80,  incidentals: 10, flag: "🇫🇷" },
  "Germany":        { lodging: 170, meals: 70,  incidentals: 10, flag: "🇩🇪" },
  "Japan":          { lodging: 210, meals: 90,  incidentals: 15, flag: "🇯🇵" },
  "Israel":         { lodging: 175, meals: 95,  incidentals: 15, flag: "🇮🇱" },
  "UAE / Dubai":    { lodging: 200, meals: 90,  incidentals: 15, flag: "🇦🇪" },
  "Italy":          { lodging: 175, meals: 75,  incidentals: 10, flag: "🇮🇹" },
  "Spain":          { lodging: 165, meals: 65,  incidentals: 10, flag: "🇪🇸" },
  "Australia":      { lodging: 155, meals: 65,  incidentals: 10, flag: "🇦🇺" },
  "Canada":         { lodging: 140, meals: 60,  incidentals: 8,  flag: "🇨🇦" },
  "Netherlands":    { lodging: 175, meals: 70,  incidentals: 10, flag: "🇳🇱" },
  "Switzerland":    { lodging: 250, meals: 100, incidentals: 20, flag: "🇨🇭" },
  "Singapore":      { lodging: 200, meals: 80,  incidentals: 15, flag: "🇸🇬" },
  "Thailand":       { lodging: 100, meals: 50,  incidentals: 8,  flag: "🇹🇭" },
  "Greece":         { lodging: 155, meals: 65,  incidentals: 10, flag: "🇬🇷" },
  "Portugal":       { lodging: 150, meals: 60,  incidentals: 8,  flag: "🇵🇹" },
  "Turkey":         { lodging: 120, meals: 55,  incidentals: 8,  flag: "🇹🇷" },
  "Mexico":         { lodging: 115, meals: 55,  incidentals: 7,  flag: "🇲🇽" },
  "Brazil":         { lodging: 130, meals: 60,  incidentals: 8,  flag: "🇧🇷" },
};

const EXPENSE_CATS = ["Meals","Transport","Accommodation","Entertainment","Conference","Other"];

// ─── localStorage helpers ─────────────────────────────────────────────────────
function getAllTrips() {
  if (typeof window === "undefined") return [];
  const trips = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("aigency_trip_")) {
      try { trips.push({ id: k.replace("aigency_trip_",""), ...JSON.parse(localStorage.getItem(k)) }); }
      catch {}
    }
  }
  return trips.sort((a, b) => b.id.localeCompare(a.id));
}

function deleteTrip(id) {
  localStorage.removeItem(`aigency_trip_${id}`);
}

// ─── Shared gradient ──────────────────────────────────────────────────────────
const G = "linear-gradient(135deg,#f97316,#ec4899)";
const btnPrimary = "font-bold text-white rounded-2xl hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-lg shadow-orange-200";

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab({ trips }) {
  const countries = [...new Set(trips.map(t => t.destination?.split(",").pop()?.trim()).filter(Boolean))];
  const totalSpent = trips.reduce((s, t) => s + (t.total_estimated_cost || 0), 0);
  const upcoming = trips.filter(t => t.form?.startDate && new Date(t.form.startDate) >= new Date()).slice(0, 3);
  const recent = trips.slice(0, 3);

  const stats = [
    { icon: "✈️", value: trips.length, label: "Trips Planned" },
    { icon: "🌍", value: countries.length, label: "Countries" },
    { icon: "💰", value: `$${totalSpent.toLocaleString()}`, label: "Total Planned Budget" },
    { icon: "📅", value: upcoming.length, label: "Upcoming Trips" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="rounded-3xl overflow-hidden relative" style={{ background: G }}>
        <div className="absolute top-0 right-0 text-[120px] opacity-10 leading-none font-black">✈️</div>
        <div className="relative px-7 py-8">
          <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-2">✦ Welcome to your Travel OS</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Where will you go<br />next? 🌍
          </h1>
          <p className="text-white/70 text-sm mb-6 max-w-md">
            Plan leisure trips, manage business travel expenses, and coordinate group adventures — all in one place.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/plan" className={btnPrimary + " px-6 py-3 text-sm bg-white"} style={{ color: "#f97316", boxShadow: "none" }}>
              ✈️ Plan New Trip
            </Link>
            <Link href="/plan" className="font-bold text-white text-sm px-6 py-3 rounded-2xl transition-all" style={{ background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.3)" }}>
              💼 Business Trip
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-orange-100 p-5 text-center shadow-sm">
            <div className="text-3xl mb-1">{s.icon}</div>
            <div className="text-2xl font-black text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Upcoming / Recent */}
      {trips.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-orange-100">
          <div className="text-5xl mb-4">🗺️</div>
          <h3 className="text-xl font-black text-gray-900 mb-2">No trips yet!</h3>
          <p className="text-gray-400 text-sm mb-6">Plan your first trip and it'll appear here.</p>
          <Link href="/plan" className={btnPrimary + " px-8 py-3 text-sm inline-block"} style={{ background: G }}>Plan My First Trip →</Link>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-black text-gray-900 mb-4">🕐 Recent Trips</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recent.map(t => <TripCard key={t.id} trip={t} compact />)}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-xl font-black text-gray-900 mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: "🤖", label: "AI Trip Planner", desc: "Chat-based planning", href: "/plan", color: "#fff7ed", border: "#fed7aa" },
            { icon: "✏️", label: "Build Manually", desc: "Full creative control", href: "/plan", color: "#fdf4ff", border: "#e9d5ff" },
            { icon: "💼", label: "Business Trip", desc: "Per diems & expenses", href: "#business", color: "#f0fdf4", border: "#bbf7d0" },
            { icon: "👥", label: "Group Trip", desc: "Plan together", href: "#groups", color: "#eff6ff", border: "#bfdbfe" },
          ].map(a => (
            <Link key={a.label} href={a.href} className="p-5 rounded-2xl border-2 hover:-translate-y-1 transition-all block" style={{ background: a.color, borderColor: a.border }}>
              <div className="text-2xl mb-2">{a.icon}</div>
              <div className="font-black text-gray-900 text-sm">{a.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{a.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TRIP CARD ────────────────────────────────────────────────────────────────
const DEST_COLORS = {
  japan: "#FF6B6B", tokyo: "#FF6B6B", paris: "#667eea", france: "#667eea",
  italy: "#11998e", rome: "#f7971e", greece: "#2980B9", spain: "#ee0979",
  thailand: "#f7971e", bali: "#11998e", "new york": "#4776E6", london: "#4776E6",
  dubai: "#f7971e", israel: "#2980B9", "tel aviv": "#11998e",
};
function destColor(d) {
  if (!d) return "#f97316";
  const k = d.toLowerCase();
  for (const [key, val] of Object.entries(DEST_COLORS)) { if (k.includes(key)) return val; }
  return "#f97316";
}

function TripCard({ trip, compact, onDelete }) {
  const color = destColor(trip.destination);
  const days = trip.days || trip.form?.days;
  const style_icons = { adventure:"🧗", relaxed:"🏖️", cultural:"🏛️", luxury:"✨", business:"💼" };
  return (
    <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-sm hover:-translate-y-1 transition-all group">
      <div className="h-2" style={{ background: `linear-gradient(90deg,${color},${color}99)` }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="font-black text-gray-900 text-sm leading-tight">{trip.destination || "Untitled Trip"}</div>
            <div className="text-xs text-gray-400 mt-0.5">{trip.form?.startDate || ""} {trip.form?.endDate ? `→ ${trip.form.endDate}` : ""}</div>
          </div>
          <span className="text-lg">{style_icons[trip.style] || "🌍"}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-black" style={{ color }}>{trip.currency || "$"} {trip.total_estimated_cost?.toLocaleString() || "—"}</div>
            <div className="text-xs text-gray-300">{days ? `${days} days` : ""} {trip.travelers ? `· ${trip.travelers} travelers` : ""}</div>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Link href={`/trip/${trip.id}`} className="flex-1 text-center text-xs font-bold py-2 rounded-xl text-white" style={{ background: G }}>Open →</Link>
          {onDelete && (
            <button onClick={() => onDelete(trip.id)} className="text-xs font-bold py-2 px-3 rounded-xl border-2 border-red-100 text-red-300 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">🗑️</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MY TRIPS TAB ─────────────────────────────────────────────────────────────
function MyTripsTab({ trips, onDelete }) {
  const [filter, setFilter] = useState("all");
  const filters = [
    { id: "all", label: "All Trips" },
    { id: "leisure", label: "🌴 Leisure" },
    { id: "business", label: "💼 Business" },
    { id: "group", label: "👥 Group" },
  ];
  const shown = filter === "all" ? trips : trips.filter(t =>
    filter === "business" ? t.style === "business" || t.isManual :
    filter === "group" ? t.isGroup :
    !t.isGroup && t.style !== "business"
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-gray-900">🗺️ My Trips ({trips.length})</h2>
        <Link href="/plan" className={btnPrimary + " px-5 py-2.5 text-sm text-center"} style={{ background: G }}>+ New Trip</Link>
      </div>
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-bold transition-all"
            style={filter === f.id
              ? { background: G, color: "white" }
              : { background: "white", color: "#6b7280", border: "2px solid #ffedd5" }}>
            {f.label}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-orange-100">
          <div className="text-5xl mb-3">🗺️</div>
          <p className="font-black text-gray-900 mb-1">No trips here yet</p>
          <p className="text-sm text-gray-400 mb-6">Start planning to see them here!</p>
          <Link href="/plan" className={btnPrimary + " px-8 py-3 text-sm inline-block"} style={{ background: G }}>Plan a Trip →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shown.map(t => <TripCard key={t.id} trip={t} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  );
}

// ─── BUSINESS TAB ─────────────────────────────────────────────────────────────
function BusinessTab() {
  const [country, setCountry] = useState("United States");
  const [days, setDays] = useState(3);
  const [travelers, setTravelers] = useState(1);
  const [expenses, setExpenses] = useState([]);
  const [expForm, setExpForm] = useState({ desc: "", amount: "", cat: "Meals" });
  const [currency, setCurrency] = useState("USD");

  const pd = PER_DIEM[country];
  const dailyTotal = pd ? pd.lodging + pd.meals + pd.incidentals : 0;
  const totalAllowance = dailyTotal * days * travelers;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalAllowance - totalExpenses;

  function addExpense() {
    if (!expForm.desc || !expForm.amount) return;
    setExpenses(p => [...p, { id: Date.now(), ...expForm, amount: Number(expForm.amount) }]);
    setExpForm(p => ({ ...p, desc: "", amount: "" }));
  }

  function removeExpense(id) { setExpenses(p => p.filter(e => e.id !== id)); }

  const catColors = { Meals:"#f97316", Transport:"#3b82f6", Accommodation:"#8b5cf6", Entertainment:"#ec4899", Conference:"#10b981", Other:"#9ca3af" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-gray-900">💼 Business Travel</h2>
        <Link href="/plan" className={btnPrimary + " px-5 py-2.5 text-sm"} style={{ background: G }}>+ Plan Business Trip</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Per Diem Calculator */}
        <div className="bg-white rounded-3xl border border-orange-100 p-6 shadow-sm">
          <h3 className="font-black text-gray-900 text-lg mb-5">📊 Per Diem Calculator</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-black text-orange-400 uppercase tracking-widest block mb-2">Destination Country</label>
              <select value={country} onChange={e => setCountry(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-orange-100 focus:border-orange-300 outline-none text-gray-900 font-medium bg-white text-sm">
                {Object.entries(PER_DIEM).map(([c, d]) => (
                  <option key={c} value={c}>{d.flag} {c}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-orange-400 uppercase tracking-widest block mb-2">Days</label>
                <div className="flex items-center gap-2 bg-orange-50 rounded-2xl px-3 py-2">
                  <button onClick={() => setDays(d => Math.max(1, d-1))} className="w-7 h-7 rounded-xl bg-white border border-orange-100 font-bold text-orange-400 flex items-center justify-center hover:bg-orange-100 transition-colors">−</button>
                  <span className="flex-1 text-center font-black text-gray-900">{days}</span>
                  <button onClick={() => setDays(d => d+1)} className="w-7 h-7 rounded-xl bg-white border border-orange-100 font-bold text-orange-400 flex items-center justify-center hover:bg-orange-100 transition-colors">+</button>
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-orange-400 uppercase tracking-widest block mb-2">Travelers</label>
                <div className="flex items-center gap-2 bg-orange-50 rounded-2xl px-3 py-2">
                  <button onClick={() => setTravelers(d => Math.max(1, d-1))} className="w-7 h-7 rounded-xl bg-white border border-orange-100 font-bold text-orange-400 flex items-center justify-center hover:bg-orange-100 transition-colors">−</button>
                  <span className="flex-1 text-center font-black text-gray-900">{travelers}</span>
                  <button onClick={() => setTravelers(d => d+1)} className="w-7 h-7 rounded-xl bg-white border border-orange-100 font-bold text-orange-400 flex items-center justify-center hover:bg-orange-100 transition-colors">+</button>
                </div>
              </div>
            </div>
          </div>

          {pd && (
            <div className="mt-5 space-y-2">
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Daily Breakdown ({pd.flag} {country})</div>
              {[
                { label: "Lodging", val: pd.lodging, color: "#f97316" },
                { label: "Meals & Incidentals", val: pd.meals + pd.incidentals, color: "#ec4899" },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#FFF8F0" }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                  <span className="text-sm text-gray-600 flex-1">{r.label}</span>
                  <span className="text-sm font-black text-gray-900">${r.val}/day</span>
                </div>
              ))}
              <div className="rounded-2xl p-4 mt-3" style={{ background: G }}>
                <div className="text-white/70 text-xs font-bold mb-1">TOTAL ALLOWANCE</div>
                <div className="text-3xl font-black text-white">${totalAllowance.toLocaleString()}</div>
                <div className="text-white/60 text-xs mt-1">${dailyTotal}/day × {days} days × {travelers} {travelers===1?"traveler":"travelers"}</div>
              </div>
            </div>
          )}
        </div>

        {/* Expense Tracker */}
        <div className="bg-white rounded-3xl border border-orange-100 p-6 shadow-sm">
          <h3 className="font-black text-gray-900 text-lg mb-5">🧾 Expense Tracker</h3>

          {/* Budget bar */}
          {pd && (
            <div className="mb-5">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-gray-400">Spent: ${totalExpenses.toLocaleString()}</span>
                <span style={{ color: balance >= 0 ? "#10b981" : "#ef4444" }}>
                  {balance >= 0 ? `$${balance.toLocaleString()} remaining` : `$${Math.abs(balance).toLocaleString()} over budget`}
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: "#FFF8F0" }}>
                <div className="h-full rounded-full transition-all" style={{
                  width: `${Math.min(100, totalAllowance > 0 ? (totalExpenses/totalAllowance)*100 : 0)}%`,
                  background: balance >= 0 ? G : "linear-gradient(135deg,#ef4444,#dc2626)"
                }} />
              </div>
            </div>
          )}

          {/* Add expense */}
          <div className="space-y-3 mb-5">
            <select value={expForm.cat} onChange={e => setExpForm(p => ({...p, cat: e.target.value}))}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-orange-100 outline-none text-gray-900 text-sm font-medium bg-white">
              {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
            </select>
            <div className="flex gap-2">
              <input value={expForm.desc} onChange={e => setExpForm(p => ({...p, desc: e.target.value}))} placeholder="Description..." onKeyDown={e => e.key==="Enter" && addExpense()}
                className="flex-1 px-3 py-2.5 rounded-xl border-2 border-orange-100 focus:border-orange-300 outline-none text-gray-900 text-sm font-medium" />
              <input type="number" min="0" value={expForm.amount} onChange={e => setExpForm(p => ({...p, amount: e.target.value}))} placeholder="$0" onKeyDown={e => e.key==="Enter" && addExpense()}
                className="w-24 px-3 py-2.5 rounded-xl border-2 border-orange-100 focus:border-orange-300 outline-none text-gray-900 text-sm font-bold" />
              <button onClick={addExpense} className="px-4 py-2.5 rounded-xl font-black text-white text-sm" style={{ background: G }}>+</button>
            </div>
          </div>

          {/* Expense list */}
          {expenses.length === 0 ? (
            <div className="text-center py-6 rounded-2xl" style={{ background: "#FFF8F0" }}>
              <p className="text-gray-400 text-sm">No expenses yet. Add your first one above.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {expenses.map(e => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl group" style={{ background: "#FFF8F0" }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: catColors[e.cat] || "#9ca3af" }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-900 truncate">{e.desc}</div>
                    <div className="text-xs text-gray-400">{e.cat}</div>
                  </div>
                  <div className="text-sm font-black text-gray-900">${e.amount.toLocaleString()}</div>
                  <button onClick={() => removeExpense(e.id)} className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 transition-all text-xs font-black">×</button>
                </div>
              ))}
            </div>
          )}

          {/* Export report */}
          {expenses.length > 0 && (
            <button onClick={() => {
              const lines = [`EXPENSE REPORT\n${"─".repeat(40)}`,
                `Country: ${country}  |  Days: ${days}  |  Travelers: ${travelers}`,
                `Allowance: $${totalAllowance}  |  Spent: $${totalExpenses}  |  Balance: $${balance}`,
                `${"─".repeat(40)}`,
                ...expenses.map(e => `${e.cat.padEnd(15)} ${e.desc.padEnd(20)} $${e.amount}`),
                `${"─".repeat(40)}`,
                `TOTAL: $${totalExpenses}`].join("\n");
              const blob = new Blob([lines], { type: "text/plain" });
              const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
              a.download = `expense-report-${country.replace(/ /g,"-")}.txt`; a.click();
            }} className="mt-4 w-full py-3 rounded-2xl text-sm font-bold border-2 border-orange-200 text-orange-500 hover:bg-orange-50 transition-colors">
              📄 Export Expense Report
            </button>
          )}
        </div>
      </div>

      {/* Business Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: "📋", title: "Per Diem Rates", desc: "Standard GSA rates shown. Actual rates may vary by company policy and travel grade." },
          { icon: "🧾", title: "Keep Receipts", desc: "Upload and tag receipts in real time. Export a complete expense report at any time." },
          { icon: "✈️", title: "AI Business Trip", desc: "Use AI Trip Planner to generate a business-optimized itinerary with conference centers, business hotels, and networking spots." },
        ].map(t => (
          <div key={t.title} className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
            <div className="text-2xl mb-2">{t.icon}</div>
            <div className="font-black text-gray-900 text-sm mb-1">{t.title}</div>
            <div className="text-xs text-gray-400 leading-relaxed">{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── GROUPS TAB ───────────────────────────────────────────────────────────────
function GroupsTab() {
  const [step, setStep] = useState("home"); // home | create | view
  const [group, setGroup] = useState({ name: "", destination: "", startDate: "", endDate: "", members: [] });
  const [memberInput, setMemberInput] = useState("");
  const [votes, setVotes] = useState({});
  const [savedGroup, setSavedGroup] = useState(null);

  const ideas = [
    { id: 1, icon: "🏯", label: "Visit Senso-ji Temple", votes: 0 },
    { id: 2, icon: "🍜", label: "Ramen cooking class", votes: 0 },
    { id: 3, icon: "🎮", label: "Akihabara gaming district", votes: 0 },
    { id: 4, icon: "🌸", label: "Shinjuku Gyoen park walk", votes: 0 },
    { id: 5, icon: "🎭", label: "Kabuki theatre show", votes: 0 },
  ];

  const [activityVotes, setActivityVotes] = useState({});
  function vote(id) { setActivityVotes(p => ({ ...p, [id]: (p[id]||0) + 1 })); }

  function addMember() {
    if (!memberInput.trim()) return;
    setGroup(p => ({ ...p, members: [...p.members, memberInput.trim()] }));
    setMemberInput("");
  }

  function createGroup() {
    setSavedGroup({ ...group, id: Date.now().toString(36), link: window.location.origin + "/group/" + Date.now().toString(36) });
    setStep("view");
  }

  if (step === "home") return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-gray-900">👥 Group Trips</h2>
        <button onClick={() => setStep("create")} className={btnPrimary + " px-5 py-2.5 text-sm"} style={{ background: G }}>+ New Group</button>
      </div>

      {/* Hero card */}
      <div className="rounded-3xl overflow-hidden relative" style={{ background: "linear-gradient(135deg,#4776E6,#8E54E9)" }}>
        <div className="absolute top-0 right-0 text-[100px] opacity-10 leading-none font-black">👥</div>
        <div className="relative px-7 py-8">
          <h3 className="text-2xl font-black text-white mb-2">Plan together, travel better</h3>
          <p className="text-white/70 text-sm mb-5 max-w-md">
            Create a group trip, invite your crew, vote on activities, and let AI merge everyone's wishes into one perfect itinerary.
          </p>
          <button onClick={() => setStep("create")} className="bg-white font-black text-sm px-6 py-3 rounded-2xl hover:-translate-y-0.5 transition-all" style={{ color: "#4776E6" }}>
            Create Group Trip →
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { step: "01", icon: "✏️", title: "Create your group", desc: "Set destination, dates, and invite members via a shareable link." },
          { step: "02", icon: "🗳️", title: "Everyone votes", desc: "Each member votes on activities, food preferences, and accommodation style." },
          { step: "03", icon: "🤖", title: "AI builds the plan", desc: "AI analyzes all votes and creates a trip everyone will love." },
        ].map(s => (
          <div key={s.step} className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-3 right-3 text-4xl font-black text-purple-50">{s.step}</div>
            <div className="text-2xl mb-3">{s.icon}</div>
            <div className="font-black text-gray-900 text-sm mb-1">{s.title}</div>
            <div className="text-xs text-gray-400 leading-relaxed">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Activity voting demo */}
      <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="font-black text-gray-900">🗳️ Live Demo: Tokyo Activity Voting</div>
          <span className="text-xs bg-purple-100 text-purple-600 font-bold px-3 py-1 rounded-full">Interactive</span>
        </div>
        <div className="space-y-3">
          {ideas.map(a => {
            const v = activityVotes[a.id] || 0;
            const maxV = Math.max(...ideas.map(x => activityVotes[x.id] || 0), 1);
            return (
              <div key={a.id} className="flex items-center gap-3">
                <span className="text-xl flex-shrink-0">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm font-bold text-gray-900 mb-1">
                    <span>{a.label}</span>
                    <span className="text-purple-500">{v} votes</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#f3e8ff" }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(v/maxV)*100}%`, background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }} />
                  </div>
                </div>
                <button onClick={() => vote(a.id)} className="flex-shrink-0 text-xs font-black px-3 py-2 rounded-xl transition-all hover:scale-105" style={{ background: "#f3e8ff", color: "#7c3aed" }}>
                  👍 Vote
                </button>
              </div>
            );
          })}
        </div>
        {Object.values(activityVotes).some(v => v > 0) && (
          <div className="mt-4 p-3 rounded-2xl text-sm font-medium text-center" style={{ background: "#f3e8ff", color: "#7c3aed" }}>
            ✨ AI will prioritize the top-voted activities in your itinerary!
          </div>
        )}
      </div>
    </div>
  );

  if (step === "create") return (
    <div className="space-y-5 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setStep("home")} className="text-gray-400 hover:text-gray-600 text-sm font-medium">← Back</button>
        <h2 className="text-2xl font-black text-gray-900">Create Group Trip</h2>
      </div>

      {[
        { label: "Group Name", placeholder: "e.g. Friends Tokyo Trip 2025", field: "name", type: "text" },
        { label: "Destination", placeholder: "e.g. Tokyo, Japan", field: "destination", type: "text" },
        { label: "Start Date", field: "startDate", type: "date" },
        { label: "End Date", field: "endDate", type: "date" },
      ].map(f => (
        <div key={f.field} className="bg-white rounded-2xl border-2 border-purple-100 p-4">
          <label className="text-xs font-black uppercase tracking-widest block mb-2" style={{ color: "#8b5cf6" }}>{f.label}</label>
          <input type={f.type} value={group[f.field]} onChange={e => setGroup(p => ({...p, [f.field]: e.target.value}))} placeholder={f.placeholder}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-purple-100 focus:border-purple-300 outline-none text-gray-900 text-sm font-medium" />
        </div>
      ))}

      <div className="bg-white rounded-2xl border-2 border-purple-100 p-4">
        <label className="text-xs font-black uppercase tracking-widest block mb-2" style={{ color: "#8b5cf6" }}>👥 Invite Members</label>
        <div className="flex gap-2 mb-3">
          <input value={memberInput} onChange={e => setMemberInput(e.target.value)} onKeyDown={e => e.key==="Enter" && addMember()} placeholder="Name or email..."
            className="flex-1 px-3 py-2.5 rounded-xl border-2 border-purple-100 focus:border-purple-300 outline-none text-gray-900 text-sm font-medium" />
          <button onClick={addMember} className="px-4 py-2.5 rounded-xl font-black text-white text-sm" style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }}>+</button>
        </div>
        {group.members.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {group.members.map((m, i) => (
              <span key={i} className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1" style={{ background: "#f3e8ff", color: "#7c3aed" }}>
                👤 {m}
                <button onClick={() => setGroup(p => ({...p, members: p.members.filter((_,j)=>j!==i)}))} className="opacity-50 hover:opacity-100 ml-1">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button onClick={createGroup} disabled={!group.name || !group.destination}
        className="w-full py-4 rounded-2xl font-black text-white text-base disabled:opacity-40 hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-lg"
        style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }}>
        Create Group & Get Invite Link →
      </button>
    </div>
  );

  if (step === "view" && savedGroup) return (
    <div className="space-y-5 max-w-lg">
      <button onClick={() => setStep("home")} className="text-gray-400 hover:text-gray-600 text-sm font-medium">← Back to Groups</button>
      <div className="rounded-3xl p-7 text-white text-center" style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }}>
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-2xl font-black mb-2">{savedGroup.name}</h3>
        <p className="text-white/70 text-sm mb-5">{savedGroup.destination} · {savedGroup.members.length} members invited</p>
        <div className="bg-white/20 rounded-2xl p-3 font-mono text-xs text-white/80 break-all mb-4">{savedGroup.link}</div>
        <button onClick={() => navigator.clipboard.writeText(savedGroup.link)} className="bg-white font-black px-6 py-3 rounded-2xl text-sm hover:-translate-y-0.5 transition-all" style={{ color: "#8b5cf6" }}>
          🔗 Copy Invite Link
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm">
        <div className="font-black text-gray-900 mb-4">🗳️ Activity Voting Board</div>
        <div className="space-y-3">
          {ideas.map(a => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#faf5ff" }}>
              <span className="text-xl">{a.icon}</span>
              <span className="flex-1 text-sm font-medium text-gray-700">{a.label}</span>
              <button onClick={() => vote(a.id)} className="text-xs font-black px-3 py-1.5 rounded-xl hover:scale-105 transition-all" style={{ background: "#ede9fe", color: "#7c3aed" }}>
                👍 {activityVotes[a.id] || 0}
              </button>
            </div>
          ))}
        </div>
        <Link href="/plan" className="mt-4 block w-full py-3 text-center rounded-2xl font-black text-white text-sm hover:opacity-90 transition-all" style={{ background: G }}>
          🤖 Generate AI Itinerary from Votes →
        </Link>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "🏠 Overview" },
  { id: "trips",    label: "🗺️ My Trips" },
  { id: "business", label: "💼 Business" },
  { id: "groups",   label: "👥 Groups" },
];

export default function App() {
  const [tab, setTab] = useState("overview");
  const [trips, setTrips] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTrips(getAllTrips());
  }, []);

  function handleDelete(id) {
    deleteTrip(id);
    setTrips(getAllTrips());
  }

  return (
    <div className="min-h-screen" style={{ background: "#FFF8F0" }}>

      {/* ── Top Nav ── */}
      <nav className="sticky top-0 z-50 px-3 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between bg-white/90 backdrop-blur-xl rounded-2xl px-5 py-3 shadow-sm border border-orange-100">
          <span className="font-black text-lg text-gray-900">✈️ <span className="gradient-text">AI-gency</span></span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium hidden sm:block">Travel OS</span>
            <Link href="/plan" className="text-xs font-black px-4 py-2.5 rounded-xl text-white shadow-md shadow-orange-200" style={{ background: G }}>
              + New Trip
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6">

        {/* ── Tab Bar ── */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-shrink-0 px-5 py-2.5 rounded-2xl text-sm font-black transition-all"
              style={tab === t.id
                ? { background: G, color: "white", boxShadow: "0 4px 14px rgba(249,115,22,0.35)" }
                : { background: "white", color: "#9ca3af", border: "2px solid #ffedd5" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        {!mounted ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 rounded-full border-4 border-orange-300 border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {tab === "overview"  && <OverviewTab trips={trips} />}
            {tab === "trips"     && <MyTripsTab trips={trips} onDelete={handleDelete} />}
            {tab === "business"  && <BusinessTab />}
            {tab === "groups"    && <GroupsTab />}
          </>
        )}
      </div>
    </div>
  );
}
