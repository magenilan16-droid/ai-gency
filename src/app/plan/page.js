"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveTrip, generateId, createEmptyTrip } from "@/lib/trips";

// ─── Steps for AI chatbot ─────────────────────────────────────────────────────
const STEPS = [
  { id: "destination", ask: "Where do you want to travel? 🌍\nCity, country, or region — be as specific as you like!", placeholder: "e.g. Tokyo, Japan", type: "text" },
  { id: "startDate", ask: (p) => `${p.destination} — great pick! 🎉\nWhen do you depart?`, type: "date" },
  { id: "endDate", ask: () => "And when do you return?", type: "date" },
  { id: "travelers", ask: () => "How many travelers? 👥", type: "counter" },
  {
    id: "budget", type: "budget", placeholder: "e.g. 3000",
    ask: (p) => {
      const d = p.startDate && p.endDate ? Math.ceil((new Date(p.endDate) - new Date(p.startDate)) / 86400000) : null;
      return `${p.travelers === 1 ? "Solo trip" : `${p.travelers} travelers`}${d ? `, ${d} days` : ""} 🤩\nWhat's your total budget?`;
    },
  },
  { id: "style", ask: () => "Last one — what's the vibe? ✨", type: "style" },
];

const STYLE_OPTIONS = [
  { value: "adventure", label: "Adventure", icon: "🧗", desc: "Hiking & thrills" },
  { value: "relaxed",   label: "Relaxed",   icon: "🏖️", desc: "Beach & slow pace" },
  { value: "cultural",  label: "Cultural",  icon: "🏛️", desc: "History & art" },
  { value: "luxury",    label: "Luxury",    icon: "✨", desc: "Fine dining & 5★" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "ILS", "JPY", "AUD", "CAD"];

// ─── Chat bubbles ─────────────────────────────────────────────────────────────
function BotMessage({ text, animate }) {
  const [shown, setShown] = useState(animate ? "" : text);
  useEffect(() => {
    if (!animate) return;
    let i = 0;
    const t = setInterval(() => { i++; setShown(text.slice(0, i)); if (i >= text.length) clearInterval(t); }, 14);
    return () => clearInterval(t);
  }, [text, animate]);
  return (
    <div className="flex items-end gap-3">
      <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-base flex-shrink-0 shadow-md" style={{ background: "linear-gradient(135deg,#f97316,#ec4899)" }}>✈️</div>
      <div className="rounded-3xl rounded-bl-sm px-5 py-4 max-w-sm shadow-sm bg-white" style={{ border: "1.5px solid #ffe4cc" }}>
        {shown.split("\n").map((l, i) => <p key={i} className={`text-gray-800 text-sm leading-relaxed ${i > 0 ? "mt-1" : ""}`}>{l}</p>)}
      </div>
    </div>
  );
}

function UserMessage({ text }) {
  return (
    <div className="flex justify-end">
      <div className="rounded-3xl rounded-br-sm px-5 py-4 max-w-xs shadow-md text-white text-sm font-medium" style={{ background: "linear-gradient(135deg,#f97316,#ec4899)" }}>{text}</div>
    </div>
  );
}

// ─── Manual quick-form ────────────────────────────────────────────────────────
function ManualForm({ onSubmit }) {
  const [f, setF] = useState({ destination: "", startDate: "", endDate: "", travelers: 2, budget: "", currency: "USD", style: "cultural" });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const days = f.startDate && f.endDate ? Math.ceil((new Date(f.endDate) - new Date(f.startDate)) / 86400000) : null;
  const valid = f.destination && f.startDate && f.endDate && f.budget > 0 && (!f.endDate || !f.startDate || new Date(f.endDate) > new Date(f.startDate));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border-2 border-orange-100 p-4">
        <label className="text-xs font-black text-orange-400 uppercase tracking-widest block mb-2">📍 Destination</label>
        <input value={f.destination} onChange={e => set("destination", e.target.value)} placeholder="e.g. Bali, Indonesia"
          className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 focus:border-orange-300 outline-none text-gray-900 placeholder-gray-300 text-sm font-medium" />
      </div>

      <div className="bg-white rounded-2xl border-2 border-orange-100 p-4">
        <label className="text-xs font-black text-orange-400 uppercase tracking-widest block mb-2">📅 Dates</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">From</p>
            <input type="date" value={f.startDate} min={new Date().toISOString().split("T")[0]} onChange={e => set("startDate", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-orange-100 focus:border-orange-300 outline-none text-gray-900 text-sm" />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">To</p>
            <input type="date" value={f.endDate} min={f.startDate} onChange={e => set("endDate", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-orange-100 focus:border-orange-300 outline-none text-gray-900 text-sm" />
          </div>
        </div>
        {days && days > 0 && <p className="text-xs text-orange-500 font-bold mt-2">✓ {days} day trip</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border-2 border-orange-100 p-4">
          <label className="text-xs font-black text-orange-400 uppercase tracking-widest block mb-2">👥 Travelers</label>
          <div className="flex items-center gap-3 justify-center">
            <button onClick={() => set("travelers", Math.max(1, f.travelers - 1))} className="w-8 h-8 rounded-xl border-2 border-orange-100 text-orange-400 font-bold hover:bg-orange-50 transition-colors flex items-center justify-center">−</button>
            <span className="text-2xl font-black text-gray-900">{f.travelers}</span>
            <button onClick={() => set("travelers", Math.min(20, f.travelers + 1))} className="w-8 h-8 rounded-xl border-2 border-orange-100 text-orange-400 font-bold hover:bg-orange-50 transition-colors flex items-center justify-center">+</button>
          </div>
        </div>
        <div className="bg-white rounded-2xl border-2 border-orange-100 p-4">
          <label className="text-xs font-black text-orange-400 uppercase tracking-widest block mb-2">💰 Budget</label>
          <div className="flex gap-2">
            <select value={f.currency} onChange={e => set("currency", e.target.value)} className="px-2 py-2 rounded-xl border-2 border-orange-100 outline-none text-gray-900 bg-white text-xs font-bold">
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="number" min="1" value={f.budget} onChange={e => set("budget", e.target.value)} placeholder="3000"
              className="flex-1 min-w-0 px-3 py-2 rounded-xl border-2 border-orange-100 focus:border-orange-300 outline-none text-gray-900 text-sm font-medium" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-orange-100 p-4">
        <label className="text-xs font-black text-orange-400 uppercase tracking-widest block mb-3">✨ Trip Style</label>
        <div className="grid grid-cols-2 gap-2">
          {STYLE_OPTIONS.map(s => (
            <button key={s.value} onClick={() => set("style", s.value)}
              className="flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all"
              style={f.style === s.value ? { borderColor: "#f97316", background: "#fff7ed" } : { borderColor: "#ffe4cc", background: "white" }}>
              <span className="text-xl">{s.icon}</span>
              <div>
                <div className="text-xs font-bold text-gray-900">{s.label}</div>
                <div className="text-xs text-gray-400">{s.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => valid && onSubmit(f)} disabled={!valid}
        className="w-full font-black text-white py-4 rounded-2xl shadow-lg shadow-orange-200 transition-all hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
        style={{ background: "linear-gradient(135deg,#f97316,#ec4899)" }}>
        Build My Trip Template →
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PlanPage() {
  const router = useRouter();
  const bottomRef = useRef(null);
  const [mode, setMode] = useState(null); // null | "ai" | "manual"

  const [messages, setMessages] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({ travelers: 2, currency: "USD" });
  const [inputValue, setInputValue] = useState("");
  const [tempCurrency, setTempCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Start AI mode
  function startAI() {
    setMode("ai");
    setMessages([
      { role: "bot", text: "Hey! I'm your AI travel planner 🌟\nLet me build you a personalized itinerary in seconds.", animate: true },
      { role: "bot", text: STEPS[0].ask, animate: true },
    ]);
    setStepIndex(0);
  }

  useEffect(() => {
    if (mode === "ai") setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, [messages, mode]);

  const currentStep = STEPS[stepIndex];
  const isFinished = stepIndex >= STEPS.length;

  function addMsg(role, text, animate = false) {
    setMessages(p => [...p, { role, text, animate }]);
  }

  function advance(answer, display) {
    const next = { ...answers, [currentStep.id]: answer };
    setAnswers(next);
    addMsg("user", display || String(answer));
    const ni = stepIndex + 1;
    setTimeout(() => {
      if (ni < STEPS.length) {
        const s = STEPS[ni];
        addMsg("bot", typeof s.ask === "function" ? s.ask(next) : s.ask, true);
        setStepIndex(ni);
      } else {
        const d = next.startDate && next.endDate ? Math.ceil((new Date(next.endDate) - new Date(next.startDate)) / 86400000) : "?";
        addMsg("bot", `Perfect! Here's your trip 🗺️\n\n📍 ${next.destination}\n📅 ${next.startDate} → ${next.endDate} (${d} days)\n👥 ${next.travelers} ${next.travelers === 1 ? "traveler" : "travelers"}\n💰 ${next.currency} ${Number(next.budget).toLocaleString()}\n✨ ${next.style?.charAt(0).toUpperCase() + next.style?.slice(1)}\n\nGenerating your personalized plan... ✨`, true);
        setStepIndex(ni);
        setTimeout(() => generateTrip(next), 1500);
      }
    }, 350);
  }

  async function generateTrip(a) {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/generate-trip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(a) });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      const id = generateId();
      saveTrip(id, { ...data, form: a });
      router.push(`/trip/${id}`);
    } catch (err) {
      setLoading(false);
      setError(err.message || "Something went wrong.");
      addMsg("bot", "Oops! Something went wrong 😔 Try again below.", true);
    }
  }

  // Manual mode submit
  function handleManualSubmit(formData) {
    const id = generateId();
    const trip = createEmptyTrip(formData);
    saveTrip(id, trip);
    router.push(`/trip/${id}?edit=true`);
  }

  // Render AI input
  function renderInput() {
    if (isFinished || loading) return (
      <div className="flex items-center justify-center gap-3 py-5 text-gray-400">
        <div className="w-5 h-5 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
        <span className="text-sm font-medium">AI is crafting your itinerary... (~20 sec)</span>
      </div>
    );
    if (!currentStep) return null;

    const inputCls = "flex-1 min-w-0 px-4 py-3.5 rounded-2xl outline-none text-gray-900 placeholder-gray-300 text-sm font-medium border-2 border-orange-100 focus:border-orange-300 bg-white transition-all";
    const btnStyle = { background: "linear-gradient(135deg,#f97316,#ec4899)" };
    const btnCls = "font-bold text-white px-5 py-3.5 rounded-2xl hover:opacity-90 active:scale-95 text-sm flex-shrink-0 shadow-md shadow-orange-200 disabled:opacity-40 transition-all";

    if (currentStep.type === "text") return (
      <form onSubmit={e => { e.preventDefault(); const v = inputValue.trim(); if (!v) return; setError(""); setInputValue(""); advance(v, v); }} className="flex gap-2.5">
        <input autoFocus type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder={currentStep.placeholder} className={inputCls} />
        <button type="submit" disabled={!inputValue.trim()} style={btnStyle} className={btnCls}>→</button>
      </form>
    );

    if (currentStep.type === "date") return (
      <form onSubmit={e => {
        e.preventDefault(); const v = inputValue;
        if (!v) return;
        if (currentStep.id === "endDate" && answers.startDate && new Date(v) <= new Date(answers.startDate)) { setError("End date must be after start date."); return; }
        setError(""); setInputValue(""); advance(v, v);
      }} className="flex gap-2.5">
        <input autoFocus type="date" value={inputValue} min={currentStep.id === "endDate" ? answers.startDate : new Date().toISOString().split("T")[0]} onChange={e => setInputValue(e.target.value)} className={inputCls} />
        <button type="submit" disabled={!inputValue} style={btnStyle} className={btnCls}>→</button>
      </form>
    );

    if (currentStep.type === "counter") return (
      <div className="flex flex-col gap-3 bg-white rounded-3xl border-2 border-orange-100 p-4">
        <div className="flex items-center justify-center gap-6">
          <button onClick={() => setAnswers(p => ({ ...p, travelers: Math.max(1, p.travelers - 1) }))} className="w-11 h-11 rounded-2xl font-bold text-xl border-2 border-orange-100 text-orange-400 hover:bg-orange-50 transition-all flex items-center justify-center">−</button>
          <div className="text-center"><div className="text-4xl font-black text-gray-900">{answers.travelers}</div><div className="text-xs text-gray-400 mt-0.5">{answers.travelers === 1 ? "Solo traveler" : `${answers.travelers} people`}</div></div>
          <button onClick={() => setAnswers(p => ({ ...p, travelers: Math.min(20, p.travelers + 1) }))} className="w-11 h-11 rounded-2xl font-bold text-xl border-2 border-orange-100 text-orange-400 hover:bg-orange-50 transition-all flex items-center justify-center">+</button>
        </div>
        <button onClick={() => advance(answers.travelers, answers.travelers === 1 ? "Just me!" : `${answers.travelers} travelers`)} style={btnStyle} className={btnCls + " w-full text-center"}>Confirm →</button>
      </div>
    );

    if (currentStep.type === "budget") return (
      <form onSubmit={e => { e.preventDefault(); const v = inputValue.trim(); if (!v || Number(v) <= 0) { setError("Enter a valid amount."); return; } setError(""); setInputValue(""); answers.currency = tempCurrency; setAnswers(p => ({ ...p, currency: tempCurrency })); advance(v, `${tempCurrency} ${Number(v).toLocaleString()}`); }} className="flex flex-col gap-2.5">
        <div className="flex gap-2.5">
          <select value={tempCurrency} onChange={e => setTempCurrency(e.target.value)} className="px-3 py-3.5 rounded-2xl border-2 border-orange-100 focus:border-orange-300 outline-none text-gray-900 bg-white font-bold text-sm">
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input autoFocus type="number" min="1" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder={currentStep.placeholder} className={inputCls} />
        </div>
        <button type="submit" disabled={!inputValue || Number(inputValue) <= 0} style={btnStyle} className={btnCls + " w-full text-center"}>Confirm →</button>
      </form>
    );

    if (currentStep.type === "style") return (
      <div className="grid grid-cols-2 gap-2.5">
        {STYLE_OPTIONS.map(s => (
          <button key={s.value} onClick={() => advance(s.value, `${s.icon} ${s.label}`)} className="flex items-center gap-3 p-4 bg-white rounded-2xl border-2 border-orange-100 hover:border-orange-300 hover:bg-orange-50 transition-all text-left group">
            <span className="text-2xl">{s.icon}</span>
            <div><div className="font-bold text-gray-900 text-sm group-hover:text-orange-500 transition-colors">{s.label}</div><div className="text-xs text-gray-400">{s.desc}</div></div>
          </button>
        ))}
      </div>
    );
  }

  // ── Mode selection screen ──
  if (!mode) return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: "#FFF8F0" }}>
      <nav className="fixed top-0 left-0 right-0 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between bg-white rounded-2xl px-5 py-3 shadow-sm border border-orange-100">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium">← Home</Link>
          <span className="font-black text-gray-900">✈️ <span className="gradient-text">AI-gency</span></span>
          <div className="w-16" />
        </div>
      </nav>

      <div className="max-w-lg w-full mt-16">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🗺️</div>
          <h1 className="text-4xl font-black text-gray-900 mb-3">
            How do you want to plan?
          </h1>
          <p className="text-gray-400 font-medium">Choose your adventure style</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* AI Planning */}
          <button onClick={startAI}
            className="relative overflow-hidden rounded-3xl p-7 text-white text-left shadow-xl shadow-orange-200 hover:-translate-y-1 transition-all group"
            style={{ background: "linear-gradient(135deg,#f97316,#ec4899)" }}>
            <div className="absolute top-0 right-0 text-9xl opacity-10 font-black leading-none -mt-4 -mr-4">AI</div>
            <div className="relative">
              <div className="text-3xl mb-3">🤖</div>
              <div className="text-xl font-black mb-1">Plan with AI</div>
              <div className="text-white/70 text-sm font-medium">Answer a few quick questions and Claude AI builds your complete day-by-day itinerary instantly.</div>
              <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2 text-sm font-bold">
                Start Chatting →
              </div>
            </div>
          </button>

          {/* Manual Planning */}
          <button onClick={() => setMode("manual")}
            className="relative overflow-hidden rounded-3xl p-7 text-left border-2 bg-white hover:-translate-y-1 transition-all group shadow-sm"
            style={{ borderColor: "#ffe4cc" }}>
            <div className="absolute top-0 right-0 text-9xl opacity-5 font-black leading-none -mt-4 -mr-4 text-orange-400">✏️</div>
            <div className="relative">
              <div className="text-3xl mb-3">✏️</div>
              <div className="text-xl font-black text-gray-900 mb-1">Build It Yourself</div>
              <div className="text-gray-400 text-sm font-medium">Set your destination and dates, then fill in your own activities day by day. Full creative control.</div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-orange-500 border-2 border-orange-100 bg-orange-50">
                Start Building →
              </div>
            </div>
          </button>
        </div>
      </div>
    </main>
  );

  // ── Manual mode ──
  if (mode === "manual") return (
    <main className="min-h-screen" style={{ background: "#FFF8F0" }}>
      <nav className="px-4 py-4 sticky top-0 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-between bg-white rounded-2xl px-5 py-3 shadow-sm border border-orange-100">
          <button onClick={() => setMode(null)} className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium">← Back</button>
          <span className="font-black text-gray-900">✈️ <span className="gradient-text">AI-gency</span></span>
          <div className="w-16" />
        </div>
      </nav>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Build Your Trip ✏️</h1>
          <p className="text-gray-400 font-medium">Fill in the basics — then edit every detail yourself.</p>
        </div>
        <ManualForm onSubmit={handleManualSubmit} />
      </div>
    </main>
  );

  // ── AI chatbot mode ──
  return (
    <main className="min-h-screen flex flex-col" style={{ background: "#FFF8F0" }}>
      <nav className="flex-shrink-0 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between bg-white rounded-2xl px-5 py-3 shadow-sm border border-orange-100">
          <button onClick={() => { setMode(null); setMessages([]); setStepIndex(0); setAnswers({ travelers: 2, currency: "USD" }); }} className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium">← Back</button>
          <span className="font-black text-gray-900">✈️ <span className="gradient-text">AI-gency</span></span>
          <div className="w-16" />
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto py-4 px-4 sm:px-6">
        <div className="max-w-xl mx-auto space-y-4">
          {messages.map((m, i) =>
            m.role === "bot"
              ? <BotMessage key={i} text={m.text} animate={m.animate && i >= messages.length - 2} />
              : <UserMessage key={i} text={m.text} />
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="flex-shrink-0 px-4 sm:px-6 pb-6 pt-3">
        <div className="max-w-xl mx-auto">
          {error && (
            <div className="mb-3 flex items-center gap-3 text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-2xl border border-red-100 font-medium">
              <span>{error}</span>
              {isFinished && <button onClick={() => { setStepIndex(STEPS.length); generateTrip(answers); }} className="ml-auto text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-red-600 transition-colors">Retry</button>}
            </div>
          )}
          {renderInput()}
        </div>
      </div>
    </main>
  );
}
