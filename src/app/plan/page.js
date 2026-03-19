"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STEPS = [
  {
    id: "destination",
    ask: "Where would you like to travel? 🌍\nType a city, country, or region!",
    placeholder: "e.g. Tokyo, Japan",
    type: "text",
  },
  {
    id: "startDate",
    ask: (prev) => `Amazing choice — ${prev.destination}! 🎉\nWhen do you plan to depart?`,
    placeholder: "Start date",
    type: "date",
  },
  {
    id: "endDate",
    ask: () => "And when will you return?",
    placeholder: "End date",
    type: "date",
  },
  {
    id: "travelers",
    ask: () => "How many travelers will be going? 👥",
    type: "counter",
  },
  {
    id: "budget",
    ask: (prev) => {
      const days = prev.startDate && prev.endDate
        ? Math.ceil((new Date(prev.endDate) - new Date(prev.startDate)) / (1000 * 60 * 60 * 24))
        : null;
      return `${prev.travelers === 1 ? "Solo trip" : `${prev.travelers} travelers`}${days ? `, ${days} days` : ""} 🤩\n\nWhat's your total budget and currency?`;
    },
    type: "budget",
    placeholder: "e.g. 3000",
  },
  {
    id: "style",
    ask: () => "Last one! What's the vibe of this trip? ✨",
    type: "style",
  },
];

const STYLE_OPTIONS = [
  { value: "adventure", label: "Adventure", icon: "🧗", desc: "Hiking & thrills" },
  { value: "relaxed", label: "Relaxed", icon: "🏖️", desc: "Beach & slow pace" },
  { value: "cultural", label: "Cultural", icon: "🏛️", desc: "History & art" },
  { value: "luxury", label: "Luxury", icon: "✨", desc: "Fine dining & 5★" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "ILS", "JPY", "AUD", "CAD"];

function BotMessage({ text, animate }) {
  const [displayed, setDisplayed] = useState(animate ? "" : text);

  useEffect(() => {
    if (!animate) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [text, animate]);

  return (
    <div className="flex items-end gap-3">
      <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-base flex-shrink-0 shadow-md"
        style={{ background: "linear-gradient(135deg, #f97316, #ec4899)" }}>
        ✈️
      </div>
      <div className="rounded-3xl rounded-bl-sm px-5 py-4 max-w-sm shadow-sm"
        style={{ background: "white", border: "1.5px solid #ffe4cc" }}>
        {displayed.split("\n").map((line, i) => (
          <p key={i} className={`text-gray-800 leading-relaxed text-sm ${i > 0 ? "mt-1" : ""}`}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function UserMessage({ text }) {
  return (
    <div className="flex justify-end">
      <div className="rounded-3xl rounded-br-sm px-5 py-4 max-w-xs shadow-md text-white text-sm font-medium"
        style={{ background: "linear-gradient(135deg, #f97316, #ec4899)" }}>
        {text}
      </div>
    </div>
  );
}

export default function PlanPage() {
  const router = useRouter();
  const bottomRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hey! I'm your AI travel planner 🌟\n\nI'll ask you a few quick questions and build a personalized trip plan — just for you.",
      animate: true,
    },
    { role: "bot", text: STEPS[0].ask, animate: true },
  ]);

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({ travelers: 2, currency: "USD" });
  const [inputValue, setInputValue] = useState("");
  const [tempCurrency, setTempCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, [messages, stepIndex]);

  const currentStep = STEPS[stepIndex];
  const isFinished = stepIndex >= STEPS.length;

  function addMessage(role, text, animate = false) {
    setMessages((prev) => [...prev, { role, text, animate }]);
  }

  function advanceStep(answer, displayText) {
    const newAnswers = { ...answers, [currentStep.id]: answer };
    setAnswers(newAnswers);
    addMessage("user", displayText || String(answer));
    const nextIndex = stepIndex + 1;
    setTimeout(() => {
      if (nextIndex < STEPS.length) {
        const next = STEPS[nextIndex];
        const ask = typeof next.ask === "function" ? next.ask(newAnswers) : next.ask;
        addMessage("bot", ask, true);
        setStepIndex(nextIndex);
      } else {
        const days = newAnswers.startDate && newAnswers.endDate
          ? Math.ceil((new Date(newAnswers.endDate) - new Date(newAnswers.startDate)) / (1000 * 60 * 60 * 24))
          : "?";
        addMessage("bot",
          `Perfect! Here's your trip summary 🗺️\n\n📍 ${newAnswers.destination}\n📅 ${newAnswers.startDate} → ${newAnswers.endDate} (${days} days)\n👥 ${newAnswers.travelers} ${newAnswers.travelers === 1 ? "traveler" : "travelers"}\n💰 ${newAnswers.currency} ${Number(newAnswers.budget).toLocaleString()}\n✨ ${newAnswers.style?.charAt(0).toUpperCase() + newAnswers.style?.slice(1)} style\n\nBuilding your personalized itinerary...`,
          true
        );
        setStepIndex(nextIndex);
        setTimeout(() => generateTrip(newAnswers), 1500);
      }
    }, 350);
  }

  function handleTextSubmit(e) {
    e?.preventDefault();
    const val = inputValue.trim();
    if (!val || val.length < 2) { setError("Please enter a valid destination."); return; }
    setError("");
    setInputValue("");
    advanceStep(val, val);
  }

  function handleDateSubmit(e) {
    e?.preventDefault();
    const val = inputValue.trim();
    if (!val) return;
    if (currentStep.id === "endDate" && answers.startDate && new Date(val) <= new Date(answers.startDate)) {
      setError("End date must be after start date.");
      return;
    }
    setError("");
    setInputValue("");
    advanceStep(val, val);
  }

  function handleBudgetSubmit(e) {
    e?.preventDefault();
    const val = inputValue.trim();
    if (!val || Number(val) <= 0) { setError("Please enter a valid budget."); return; }
    setError("");
    setInputValue("");
    answers.currency = tempCurrency;
    setAnswers((p) => ({ ...p, currency: tempCurrency }));
    advanceStep(val, `${tempCurrency} ${Number(val).toLocaleString()}`);
  }

  async function generateTrip(tripAnswers) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripAnswers),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      const id = Date.now().toString(36);
      sessionStorage.setItem(`trip_${id}`, JSON.stringify({ ...data, form: tripAnswers }));
      router.push(`/trip/${id}`);
    } catch (err) {
      setLoading(false);
      setError(err.message || "Something went wrong.");
      addMessage("bot", "Oops, something went wrong. Let's try again 😔", true);
    }
  }

  function renderInput() {
    if (isFinished || loading) {
      return (
        <div className="flex items-center justify-center gap-3 py-5 text-gray-400">
          <div className="w-5 h-5 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
          <span className="text-sm font-medium">Crafting your itinerary with AI...</span>
        </div>
      );
    }
    if (!currentStep) return null;

    const inputBase = "flex-1 min-w-0 px-4 py-3.5 rounded-2xl outline-none text-gray-900 placeholder-gray-300 text-sm font-medium transition-all border-2 border-orange-100 focus:border-orange-300 bg-white";
    const btnBase = "font-bold text-white px-5 py-3.5 rounded-2xl transition-all hover:opacity-90 active:scale-95 text-sm flex-shrink-0";

    switch (currentStep.type) {
      case "text":
        return (
          <form onSubmit={handleTextSubmit} className="flex gap-2.5">
            <input autoFocus type="text" value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={currentStep.placeholder}
              className={inputBase} />
            <button type="submit" disabled={!inputValue.trim()}
              className={btnBase + " shadow-md shadow-orange-200 disabled:opacity-40"}
              style={{ background: "linear-gradient(135deg, #f97316, #ec4899)" }}>
              →
            </button>
          </form>
        );

      case "date":
        return (
          <form onSubmit={handleDateSubmit} className="flex gap-2.5">
            <input autoFocus type="date" value={inputValue}
              min={currentStep.id === "endDate" ? answers.startDate : new Date().toISOString().split("T")[0]}
              onChange={(e) => setInputValue(e.target.value)}
              className={inputBase} />
            <button type="submit" disabled={!inputValue}
              className={btnBase + " shadow-md shadow-orange-200 disabled:opacity-40"}
              style={{ background: "linear-gradient(135deg, #f97316, #ec4899)" }}>
              →
            </button>
          </form>
        );

      case "counter":
        return (
          <div className="flex flex-col gap-3 bg-white rounded-3xl border-2 border-orange-100 p-4">
            <div className="flex items-center justify-center gap-6">
              <button onClick={() => setAnswers((p) => ({ ...p, travelers: Math.max(1, p.travelers - 1) }))}
                className="w-11 h-11 rounded-2xl font-bold text-xl border-2 border-orange-100 text-orange-400 hover:border-orange-300 hover:bg-orange-50 transition-all flex items-center justify-center">
                −
              </button>
              <div className="text-center">
                <div className="text-4xl font-black text-gray-900">{answers.travelers}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {answers.travelers === 1 ? "Solo traveler" : `${answers.travelers} people`}
                </div>
              </div>
              <button onClick={() => setAnswers((p) => ({ ...p, travelers: Math.min(20, p.travelers + 1) }))}
                className="w-11 h-11 rounded-2xl font-bold text-xl border-2 border-orange-100 text-orange-400 hover:border-orange-300 hover:bg-orange-50 transition-all flex items-center justify-center">
                +
              </button>
            </div>
            <button
              onClick={() => advanceStep(answers.travelers, answers.travelers === 1 ? "Just me!" : `${answers.travelers} travelers`)}
              className={btnBase + " w-full shadow-md shadow-orange-200"}
              style={{ background: "linear-gradient(135deg, #f97316, #ec4899)" }}>
              Confirm →
            </button>
          </div>
        );

      case "budget":
        return (
          <form onSubmit={handleBudgetSubmit} className="flex flex-col gap-2.5">
            <div className="flex gap-2.5">
              <select value={tempCurrency} onChange={(e) => setTempCurrency(e.target.value)}
                className="px-3 py-3.5 rounded-2xl border-2 border-orange-100 focus:border-orange-300 outline-none text-gray-900 bg-white font-bold text-sm">
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input autoFocus type="number" min="1" value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={currentStep.placeholder}
                className={inputBase} />
            </div>
            <button type="submit" disabled={!inputValue || Number(inputValue) <= 0}
              className={btnBase + " w-full shadow-md shadow-orange-200 disabled:opacity-40"}
              style={{ background: "linear-gradient(135deg, #f97316, #ec4899)" }}>
              Confirm →
            </button>
          </form>
        );

      case "style":
        return (
          <div className="grid grid-cols-2 gap-2.5">
            {STYLE_OPTIONS.map((s) => (
              <button key={s.value} onClick={() => advanceStep(s.value, `${s.icon} ${s.label}`)}
                className="flex items-center gap-3 p-4 bg-white rounded-2xl border-2 border-orange-100 hover:border-orange-300 hover:bg-orange-50 transition-all text-left group">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <div className="font-bold text-gray-900 text-sm group-hover:text-orange-500 transition-colors">{s.label}</div>
                  <div className="text-xs text-gray-400">{s.desc}</div>
                </div>
              </button>
            ))}
          </div>
        );

      default: return null;
    }
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "#FFF8F0" }}>

      {/* Nav */}
      <nav className="flex-shrink-0 px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between bg-white rounded-2xl px-5 py-3 shadow-sm border border-orange-100">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium">
            ← Home
          </Link>
          <span className="font-black text-gray-900 text-base">
            ✈️ <span className="gradient-text">AI-gency</span>
          </span>
          <div className="w-16" />
        </div>
      </nav>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto py-4 px-4 sm:px-6">
        <div className="max-w-xl mx-auto space-y-4">
          {messages.map((msg, i) =>
            msg.role === "bot"
              ? <BotMessage key={i} text={msg.text} animate={msg.animate && i >= messages.length - 2} />
              : <UserMessage key={i} text={msg.text} />
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-4 sm:px-6 pb-6 pt-3">
        <div className="max-w-xl mx-auto">
          {error && (
            <div className="mb-3 text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-2xl border border-red-100 font-medium">
              {error}
            </div>
          )}
          {renderInput()}
        </div>
      </div>
    </main>
  );
}
