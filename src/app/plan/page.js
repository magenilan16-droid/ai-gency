"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveTrip, generateId, createEmptyTrip } from "@/lib/trips";

const G = "linear-gradient(135deg,#f97316,#ec4899)";
const CURRENCIES = ["USD", "EUR", "GBP", "ILS", "JPY", "AUD", "CAD"];

// ─── Parse Claude's special markers ──────────────────────────────────────────
function parseMarkers(text) {
  const cities     = text.match(/\[CITIES:\s*([^\]]+)\]/);
  const options    = text.match(/\[OPTIONS:\s*([^\]]+)\]/);
  const multiOpts  = text.match(/\[MULTI_OPTIONS:\s*([^\]]+)\]/);
  const datePicker = /\[DATE_PICKER\]/.test(text);
  const budgetPicker = /\[BUDGET_PICKER\]/.test(text);
  const readyMatch = text.match(/\[READY\]([\s\S]*?)\[\/READY\]/);

  return {
    cities:       cities     ? cities[1].split(",").map(s => s.trim()).filter(Boolean) : null,
    options:      options    ? options[1].split(",").map(s => s.trim()).filter(Boolean) : null,
    multiOptions: multiOpts  ? multiOpts[1].split(",").map(s => s.trim()).filter(Boolean) : null,
    datePicker,
    budgetPicker,
    ready: readyMatch ? (() => { try { return JSON.parse(readyMatch[1].trim()); } catch { return null; } })() : null,
    cleanText: text
      .replace(/\[CITIES:[^\]]+\]/g, "")
      .replace(/\[OPTIONS:[^\]]+\]/g, "")
      .replace(/\[MULTI_OPTIONS:[^\]]+\]/g, "")
      .replace(/\[DATE_PICKER\]/g, "")
      .replace(/\[BUDGET_PICKER\]/g, "")
      .replace(/\[READY\][\s\S]*?\[\/READY\]/g, "")
      .trim(),
  };
}

// ─── Interactive widgets ──────────────────────────────────────────────────────

function DatePickerWidget({ onConfirm }) {
  const today = new Date().toISOString().split("T")[0];
  const [start, setStart] = useState("");
  const [end, setEnd]     = useState("");
  const days = start && end ? Math.ceil((new Date(end) - new Date(start)) / 86400000) : 0;

  return (
    <div className="mt-3 bg-white rounded-2xl border-2 border-orange-100 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-black text-orange-400 uppercase tracking-wide mb-1.5">✈️ Depart</p>
          <input type="date" value={start} min={today}
            onChange={e => { setStart(e.target.value); if (end && e.target.value >= end) setEnd(""); }}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-orange-100 focus:border-orange-300 outline-none text-sm font-medium text-gray-800" />
        </div>
        <div>
          <p className="text-xs font-black text-orange-400 uppercase tracking-wide mb-1.5">🏠 Return</p>
          <input type="date" value={end} min={start || today}
            onChange={e => setEnd(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-orange-100 focus:border-orange-300 outline-none text-sm font-medium text-gray-800" />
        </div>
      </div>
      {days > 0 && (
        <p className="text-xs font-black text-orange-500">✓ {days} day trip</p>
      )}
      <button
        disabled={!start || !end || days <= 0}
        onClick={() => onConfirm(`Departing ${start}, returning ${end} (${days} days)`)}
        className="w-full py-3.5 rounded-xl text-white text-sm font-black disabled:opacity-40 transition-opacity"
        style={{ background: G }}>
        Confirm Dates →
      </button>
    </div>
  );
}

function BudgetPickerWidget({ currency, onConfirm }) {
  const PRESETS = [500, 1000, 1500, 2000, 3000, 5000, 8000, 10000];
  const [selected, setSelected] = useState(null);
  const [custom, setCustom]     = useState("");
  const value = selected === "custom" ? Number(custom) : selected;

  return (
    <div className="mt-3 bg-white rounded-2xl border-2 border-orange-100 p-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(p => (
          <button key={p}
            onClick={() => { setSelected(p); setCustom(""); }}
            className="px-3 py-2 rounded-xl text-xs font-black border-2 transition-all"
            style={selected === p
              ? { borderColor: "#f97316", background: "#fff7ed", color: "#ea580c" }
              : { borderColor: "#ffe4cc", background: "white", color: "#6b7280" }}>
            {currency} {p.toLocaleString()}
          </button>
        ))}
        <button
          onClick={() => setSelected("custom")}
          className="px-3 py-2 rounded-xl text-xs font-black border-2 transition-all"
          style={selected === "custom"
            ? { borderColor: "#f97316", background: "#fff7ed", color: "#ea580c" }
            : { borderColor: "#ffe4cc", background: "white", color: "#6b7280" }}>
          ✏️ Custom
        </button>
      </div>
      {selected === "custom" && (
        <input
          type="number" value={custom} onChange={e => setCustom(e.target.value)}
          placeholder={`Your amount in ${currency}`}
          className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-400 outline-none text-sm font-medium" />
      )}
      <button
        disabled={!value || value <= 0}
        onClick={() => onConfirm(`My total budget is ${currency} ${Number(value).toLocaleString()}`)}
        className="w-full py-3.5 rounded-xl text-white text-sm font-black disabled:opacity-40 transition-opacity"
        style={{ background: G }}>
        Set Budget →
      </button>
    </div>
  );
}

function MultiOptionsWidget({ options, onConfirm }) {
  const [selected, setSelected] = useState(new Set());

  function toggle(o) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(o) ? next.delete(o) : next.add(o);
      return next;
    });
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button key={o} onClick={() => toggle(o)}
            className="px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all"
            style={selected.has(o)
              ? { borderColor: "#f97316", background: "#fff7ed", color: "#ea580c" }
              : { borderColor: "#ffe4cc", background: "white", color: "#374151" }}>
            {o}
          </button>
        ))}
      </div>
      <button
        disabled={selected.size === 0}
        onClick={() => onConfirm(Array.from(selected).join(", "))}
        className="w-full py-3.5 rounded-xl text-white text-sm font-black disabled:opacity-40 transition-opacity"
        style={{ background: G }}>
        {selected.size > 0 ? `Confirm (${selected.size} selected) →` : "Select at least one →"}
      </button>
    </div>
  );
}

// ─── Chat bubbles ─────────────────────────────────────────────────────────────
function BotBubble({ text, cities, options, multiOptions, datePicker, budgetPicker, onChip, onWidget, currency, streaming, widgetUsed }) {
  const lines = text.split("\n").filter(Boolean);
  return (
    <div className="flex items-end gap-3">
      <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-base flex-shrink-0 shadow-md" style={{ background: G }}>🤖</div>
      <div className="flex-1 space-y-3">
        <div className="rounded-3xl rounded-bl-sm px-5 py-4 max-w-sm shadow-sm bg-white" style={{ border: "1.5px solid #ffe4cc" }}>
          {lines.map((l, i) => <p key={i} className={`text-gray-800 text-sm leading-relaxed ${i > 0 ? "mt-1" : ""}`}>{l}</p>)}
          {streaming && <span className="inline-block w-1.5 h-4 bg-orange-300 rounded animate-pulse ml-1 align-middle" />}
        </div>

        {/* City chips */}
        {!widgetUsed && cities?.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-1">
            {cities.map(c => (
              <button key={c} onClick={() => onChip(c)}
                className="px-3 py-2 rounded-xl text-xs font-bold border-2 border-orange-200 bg-orange-50 text-orange-600 hover:border-orange-400 hover:bg-orange-100 transition-all">
                📍 {c}
              </button>
            ))}
          </div>
        )}

        {/* Single-select options */}
        {!widgetUsed && options?.length > 0 && (
          <div className="flex flex-col gap-2 pl-1">
            {options.map(o => (
              <button key={o} onClick={() => onChip(o)}
                className="px-4 py-3 rounded-xl text-sm font-bold border-2 border-orange-100 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all text-left shadow-sm">
                {o}
              </button>
            ))}
          </div>
        )}

        {/* Multi-select options */}
        {!widgetUsed && multiOptions?.length > 0 && (
          <MultiOptionsWidget options={multiOptions} onConfirm={onWidget} />
        )}

        {/* Date picker */}
        {!widgetUsed && datePicker && (
          <DatePickerWidget onConfirm={onWidget} />
        )}

        {/* Budget picker */}
        {!widgetUsed && budgetPicker && (
          <BudgetPickerWidget currency={currency} onConfirm={onWidget} />
        )}
      </div>
    </div>
  );
}

function UserBubble({ text }) {
  return (
    <div className="flex justify-end">
      <div className="rounded-3xl rounded-br-sm px-5 py-4 max-w-xs shadow-md text-white text-sm font-medium" style={{ background: G }}>{text}</div>
    </div>
  );
}

// ─── Manual form ──────────────────────────────────────────────────────────────
function ManualForm({ onSubmit }) {
  const [f, setF] = useState({ destination: "", startDate: "", endDate: "", travelers: 2, budget: "", currency: "USD", style: "cultural" });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const days = f.startDate && f.endDate ? Math.ceil((new Date(f.endDate) - new Date(f.startDate)) / 86400000) : null;
  const valid = f.destination && f.startDate && f.endDate && f.budget > 0 && (!f.endDate || !f.startDate || new Date(f.endDate) > new Date(f.startDate));
  const STYLES = [{ value:"adventure",label:"Adventure",icon:"🧗" },{ value:"relaxed",label:"Relaxed",icon:"🏖️" },{ value:"cultural",label:"Cultural",icon:"🏛️" },{ value:"luxury",label:"Luxury",icon:"✨" }];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border-2 border-orange-100 p-4">
        <label className="text-xs font-black text-orange-400 uppercase tracking-widest block mb-2">📍 Destination</label>
        <input value={f.destination} onChange={e => set("destination", e.target.value)} placeholder="e.g. Rome, Italy"
          className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 focus:border-orange-300 outline-none text-gray-900 placeholder-gray-300 text-sm font-medium" />
      </div>
      <div className="bg-white rounded-2xl border-2 border-orange-100 p-4">
        <label className="text-xs font-black text-orange-400 uppercase tracking-widest block mb-2">📅 Dates</label>
        <div className="grid grid-cols-2 gap-3">
          <div><p className="text-xs text-gray-400 mb-1">From</p><input type="date" value={f.startDate} min={new Date().toISOString().split("T")[0]} onChange={e => set("startDate", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-orange-100 focus:border-orange-300 outline-none text-sm" /></div>
          <div><p className="text-xs text-gray-400 mb-1">To</p><input type="date" value={f.endDate} min={f.startDate} onChange={e => set("endDate", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-orange-100 focus:border-orange-300 outline-none text-sm" /></div>
        </div>
        {days > 0 && <p className="text-xs text-orange-500 font-bold mt-2">✓ {days} day trip</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border-2 border-orange-100 p-4">
          <label className="text-xs font-black text-orange-400 uppercase tracking-widest block mb-2">👥 Travelers</label>
          <div className="flex items-center gap-3 justify-center">
            <button onClick={() => set("travelers", Math.max(1, f.travelers - 1))} className="w-8 h-8 rounded-xl border-2 border-orange-100 text-orange-400 font-bold hover:bg-orange-50 flex items-center justify-center">−</button>
            <span className="text-2xl font-black text-gray-900">{f.travelers}</span>
            <button onClick={() => set("travelers", Math.min(20, f.travelers + 1))} className="w-8 h-8 rounded-xl border-2 border-orange-100 text-orange-400 font-bold hover:bg-orange-50 flex items-center justify-center">+</button>
          </div>
        </div>
        <div className="bg-white rounded-2xl border-2 border-orange-100 p-4">
          <label className="text-xs font-black text-orange-400 uppercase tracking-widest block mb-2">💰 Budget</label>
          <div className="flex gap-2">
            <select value={f.currency} onChange={e => set("currency", e.target.value)} className="px-2 py-2 rounded-xl border-2 border-orange-100 outline-none bg-white text-xs font-bold">{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select>
            <input type="number" min="1" value={f.budget} onChange={e => set("budget", e.target.value)} placeholder="3000" className="flex-1 min-w-0 px-3 py-2 rounded-xl border-2 border-orange-100 focus:border-orange-300 outline-none text-sm font-medium" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border-2 border-orange-100 p-4">
        <label className="text-xs font-black text-orange-400 uppercase tracking-widest block mb-3">✨ Trip Style</label>
        <div className="grid grid-cols-2 gap-2">
          {STYLES.map(s => (
            <button key={s.value} onClick={() => set("style", s.value)}
              className="flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all"
              style={f.style === s.value ? { borderColor: "#f97316", background: "#fff7ed" } : { borderColor: "#ffe4cc", background: "white" }}>
              <span className="text-xl">{s.icon}</span>
              <span className="text-xs font-bold text-gray-900">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
      <button onClick={() => valid && onSubmit(f)} disabled={!valid}
        className="w-full font-black text-white py-4 rounded-2xl shadow-lg shadow-orange-200 transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: G }}>
        Build My Trip Template →
      </button>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function PlanPage() {
  const router = useRouter();
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const [mode, setMode] = useState(null);

  const [chatMsgs, setChatMsgs]       = useState([]);
  const [input, setInput]             = useState("");
  const [streaming, setStreaming]     = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [error, setError]             = useState("");
  const [collectedData, setCollectedData] = useState(null);
  const [currency, setCurrency]       = useState("USD");
  const [usedWidgets, setUsedWidgets] = useState(new Set()); // indices of bot messages whose widget was submitted

  function scrollBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  function startAI() {
    setMode("ai");
    setChatMsgs([{
      role: "assistant",
      content: "Hey! I'm Claude, your personal AI travel planner 🌍\nWhere in the world are you dreaming of going?",
      cities: null, options: null, multiOptions: null, datePicker: false, budgetPicker: false, streaming: false, initial: true,
    }]);
    setCollectedData(null);
    setError("");
    setUsedWidgets(new Set());
  }

  async function callClaude(history) {
    if (!history.length || history[0].role !== "user") return;
    setStreaming(true);
    let fullText = "";

    setChatMsgs(prev => [...prev, { role: "assistant", content: "", streaming: true }]);

    try {
      const res = await fetch("/api/plan-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.text) {
                fullText += parsed.text;
                setChatMsgs(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: fullText, streaming: true };
                  return updated;
                });
                scrollBottom();
              }
            } catch {}
          }
        }
      }

      const { cities, options, multiOptions, datePicker, budgetPicker, ready, cleanText } = parseMarkers(fullText);

      setChatMsgs(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: cleanText || fullText,
          cities, options, multiOptions, datePicker, budgetPicker,
          streaming: false,
        };
        return updated;
      });

      if (ready) {
        setCollectedData(ready);
        await generateTrip(ready);
      }

      scrollBottom();
    } catch (err) {
      setChatMsgs(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Sorry, something went wrong. Please try again.", streaming: false };
        return updated;
      });
      setError(err.message);
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  function sendMessage(text, fromWidgetIndex = null) {
    if (!text.trim() || streaming || generating) return;
    const userMsg = text.trim();
    setInput("");
    setError("");

    if (fromWidgetIndex !== null) {
      setUsedWidgets(prev => new Set([...prev, fromWidgetIndex]));
    }

    const history = chatMsgs
      .filter(m => !m.initial)
      .map(m => ({ role: m.role, content: m.content }));

    setChatMsgs(prev => [...prev, { role: "user", content: userMsg }]);
    scrollBottom();

    callClaude([...history, { role: "user", content: userMsg }]);
  }

  async function generateTrip(data) {
    setGenerating(true);
    setChatMsgs(prev => [...prev, {
      role: "assistant",
      content: `Perfect! I have everything I need. 🗺️\n\nBuilding your personalized ${data.destination} itinerary now... This takes about 15 seconds.`,
    }]);
    scrollBottom();

    try {
      const res = await fetch("/api/generate-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, currency }),
      });
      const text = await res.text();
      let tripData;
      try { tripData = JSON.parse(text); }
      catch { throw new Error("Server timeout — please retry."); }
      if (!res.ok) throw new Error(tripData.error || "Generation failed.");

      const id = generateId();
      saveTrip(id, { ...tripData, form: data });
      await new Promise(r => setTimeout(r, 100));
      router.push(`/trip/${id}`);
    } catch (err) {
      setError(err.message);
      setChatMsgs(prev => [...prev, {
        role: "assistant",
        content: `Oops! ${err.message}\n\nJust click Retry below.`,
      }]);
    } finally {
      setGenerating(false);
    }
  }

  function handleManualSubmit(formData) {
    const id   = generateId();
    const trip = createEmptyTrip(formData);
    saveTrip(id, trip);
    router.push(`/trip/${id}?edit=true`);
  }

  // ── Mode selection ──
  if (!mode) return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: "#FFF8F0" }}>
      <nav className="fixed top-0 left-0 right-0 px-4 py-4 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between bg-white rounded-2xl px-5 py-3 shadow-sm border border-orange-100">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium">← Home</Link>
          <span className="font-black text-gray-900">✈️ <span style={{ background: G, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI-gency</span></span>
          <div className="w-16" />
        </div>
      </nav>

      <div className="max-w-lg w-full mt-16">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🗺️</div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Plan Your Trip</h1>
          <p className="text-gray-400 font-medium">How would you like to start?</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button onClick={startAI}
            className="relative overflow-hidden rounded-3xl p-7 text-white text-left shadow-xl shadow-orange-200 hover:-translate-y-1 transition-all"
            style={{ background: G }}>
            <div className="absolute top-0 right-0 text-[120px] opacity-10 font-black leading-none -mt-6 -mr-4">AI</div>
            <div className="relative">
              <div className="text-3xl mb-3">🤖</div>
              <div className="text-xl font-black mb-1">Chat with Claude AI</div>
              <div className="text-white/75 text-sm leading-relaxed">Just answer a few quick taps — Claude asks, you tap. It builds a fully personalized itinerary with hotel & flight suggestions.</div>
              <div className="mt-5 inline-flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2.5 text-sm font-bold">Start Chatting →</div>
            </div>
          </button>

          <button onClick={() => setMode("manual")}
            className="relative overflow-hidden rounded-3xl p-7 text-left border-2 bg-white hover:-translate-y-1 transition-all shadow-sm"
            style={{ borderColor: "#ffe4cc" }}>
            <div className="relative">
              <div className="text-3xl mb-3">✏️</div>
              <div className="text-xl font-black text-gray-900 mb-1">Build It Yourself</div>
              <div className="text-gray-400 text-sm leading-relaxed">Fill in the basics, then edit every detail yourself. Full creative control.</div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-orange-500 border-2 border-orange-100 bg-orange-50">Start Building →</div>
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
          <span className="font-black text-gray-900">✈️ <span style={{ background: G, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI-gency</span></span>
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

  // ── AI Chat mode ──
  return (
    <main className="min-h-screen flex flex-col" style={{ background: "#FFF8F0" }}>
      {/* Nav */}
      <nav className="flex-shrink-0 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between bg-white rounded-2xl px-5 py-3 shadow-sm border border-orange-100">
          <button onClick={() => { setMode(null); setChatMsgs([]); }} className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium">← Back</button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-black text-gray-900">Claude AI Planner</span>
          </div>
          <select value={currency} onChange={e => setCurrency(e.target.value)}
            className="text-xs font-bold px-2 py-1.5 rounded-xl border-2 border-orange-100 bg-white outline-none text-gray-600">
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </nav>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 px-4 sm:px-6">
        <div className="max-w-xl mx-auto space-y-4">
          {chatMsgs.map((m, i) =>
            m.role === "user"
              ? <UserBubble key={i} text={m.content} />
              : <BotBubble key={i}
                  text={m.content}
                  cities={m.cities}
                  options={m.options}
                  multiOptions={m.multiOptions}
                  datePicker={m.datePicker}
                  budgetPicker={m.budgetPicker}
                  streaming={m.streaming}
                  currency={currency}
                  widgetUsed={usedWidgets.has(i)}
                  onChip={chip => sendMessage(chip, i)}
                  onWidget={val => sendMessage(val, i)}
                />
          )}
          {(streaming || generating) && chatMsgs[chatMsgs.length - 1]?.role === "user" && (
            <div className="flex items-end gap-3">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-base" style={{ background: G }}>🤖</div>
              <div className="bg-white rounded-3xl rounded-bl-sm px-5 py-4 border border-orange-100 shadow-sm">
                <span className="inline-flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 sm:px-6 pb-6 pt-3">
        <div className="max-w-xl mx-auto">
          {error && (
            <div className="mb-3 flex items-center gap-3 text-sm text-red-500 bg-red-50 px-4 py-3 rounded-2xl border border-red-100">
              <span className="flex-1">{error}</span>
              {collectedData && (
                <button onClick={() => generateTrip(collectedData)}
                  className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-red-600 flex-shrink-0">
                  Retry
                </button>
              )}
            </div>
          )}

          {generating ? (
            <div className="flex items-center justify-center gap-3 py-5 text-gray-400">
              <div className="w-5 h-5 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
              <span className="text-sm font-medium">Claude is building your itinerary... (~15 sec)</span>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex gap-2.5">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Or type your answer..."
                disabled={streaming || generating}
                className="flex-1 min-w-0 px-4 py-3.5 rounded-2xl outline-none text-gray-900 placeholder-gray-300 text-sm font-medium border-2 border-orange-100 focus:border-orange-300 bg-white transition-all disabled:opacity-50"
              />
              <button type="submit" disabled={!input.trim() || streaming || generating}
                className="font-bold text-white px-5 py-3.5 rounded-2xl text-sm flex-shrink-0 shadow-md disabled:opacity-40 transition-all"
                style={{ background: G }}>
                →
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
