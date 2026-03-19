"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Conversation steps ───────────────────────────────────────────────────────
const STEPS = [
  {
    id: "destination",
    ask: "Where would you like to travel? 🌍\nType a city, country, or region — the more specific the better!",
    placeholder: "e.g. Tokyo, Japan",
    type: "text",
  },
  {
    id: "startDate",
    ask: (prev) =>
      `Great choice — ${prev.destination}! 🎉\nWhen do you plan to depart?`,
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
      const days =
        prev.startDate && prev.endDate
          ? Math.ceil(
              (new Date(prev.endDate) - new Date(prev.startDate)) /
                (1000 * 60 * 60 * 24)
            )
          : null;
      return `Perfect! ${prev.travelers === 1 ? "Solo trip" : `${prev.travelers} travelers`}${days ? `, ${days} days` : ""} — sounds amazing! 😊\n\nWhat's your total budget for the trip? And which currency?`;
    },
    type: "budget",
    placeholder: "e.g. 3000",
  },
  {
    id: "style",
    ask: () =>
      "Almost there! What kind of trip are you looking for? Pick a vibe 👇",
    type: "style",
  },
];

const STYLE_OPTIONS = [
  { value: "adventure", label: "Adventure", icon: "🧗", desc: "Hiking & outdoors" },
  { value: "relaxed", label: "Relaxed", icon: "🏖️", desc: "Beach & slow pace" },
  { value: "cultural", label: "Cultural", icon: "🏛️", desc: "History & art" },
  { value: "luxury", label: "Luxury", icon: "✨", desc: "Fine dining & 5-star" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "ILS", "JPY", "AUD", "CAD"];

// ─── Bot message with typing animation ───────────────────────────────────────
function BotMessage({ text, animate }) {
  const [displayed, setDisplayed] = useState(animate ? "" : text);

  useEffect(() => {
    if (!animate) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 18);
    return () => clearInterval(interval);
  }, [text, animate]);

  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center text-white text-sm flex-shrink-0 shadow-sm">
        ✈️
      </div>
      <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-sm border border-gray-100 max-w-lg">
        {displayed.split("\n").map((line, i) => (
          <p key={i} className={`text-gray-800 leading-relaxed ${i > 0 ? "mt-1" : ""}`}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

// ─── User bubble ─────────────────────────────────────────────────────────────
function UserMessage({ text }) {
  return (
    <div className="flex justify-end">
      <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 max-w-xs shadow-sm">
        <p>{text}</p>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function PlanPage() {
  const router = useRouter();
  const bottomRef = useRef(null);

  // messages = array of { role: "bot" | "user", text, animate? }
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hey there! I'm your AI travel planner. 🌟\n\nTell me about your dream trip and I'll build a personalized day-by-day itinerary with budget breakdown and local tips.",
      animate: true,
    },
    {
      role: "bot",
      text: STEPS[0].ask,
      animate: true,
    },
  ]);

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({
    travelers: 2,
    currency: "USD",
  });
  const [inputValue, setInputValue] = useState("");
  const [tempCurrency, setTempCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Scroll to bottom whenever messages change
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

    // Show user reply
    addMessage("user", displayText || String(answer));

    const nextIndex = stepIndex + 1;

    // Show next bot message after a short delay
    setTimeout(() => {
      if (nextIndex < STEPS.length) {
        const nextStep = STEPS[nextIndex];
        const nextAsk =
          typeof nextStep.ask === "function"
            ? nextStep.ask(newAnswers)
            : nextStep.ask;
        addMessage("bot", nextAsk, true);
        setStepIndex(nextIndex);
      } else {
        // All questions answered — show confirmation
        addMessage(
          "bot",
          `Amazing! Here's your trip summary:\n📍 ${newAnswers.destination}\n📅 ${newAnswers.startDate} → ${newAnswers.endDate}\n👥 ${newAnswers.travelers} ${newAnswers.travelers === 1 ? "traveler" : "travelers"}\n💰 ${newAnswers.currency} ${Number(newAnswers.budget).toLocaleString()}\n🎨 ${newAnswers.style?.charAt(0).toUpperCase() + newAnswers.style?.slice(1)} style\n\nLet me build your personalized itinerary! This takes about 20 seconds... ✨`,
          true
        );
        setStepIndex(nextIndex);
        // Auto-generate after a moment
        setTimeout(() => generateTrip(newAnswers), 1500);
      }
    }, 350);
  }

  function handleTextSubmit(e) {
    e?.preventDefault();
    const val = inputValue.trim();
    if (!val) return;
    setInputValue("");

    if (currentStep.id === "destination" && val.length < 2) {
      setError("Please enter a valid destination.");
      return;
    }
    setError("");
    advanceStep(val, val);
  }

  function handleDateSubmit(e) {
    e?.preventDefault();
    const val = inputValue.trim();
    if (!val) return;

    if (currentStep.id === "endDate" && answers.startDate) {
      if (new Date(val) <= new Date(answers.startDate)) {
        setError("End date must be after start date.");
        return;
      }
    }
    setError("");
    setInputValue("");
    advanceStep(val, val);
  }

  function handleBudgetSubmit(e) {
    e?.preventDefault();
    const val = inputValue.trim();
    if (!val || Number(val) <= 0) {
      setError("Please enter a valid budget amount.");
      return;
    }
    setError("");
    setInputValue("");
    const newAnswers = { ...answers, currency: tempCurrency };
    setAnswers(newAnswers);
    advanceStep(val, `${tempCurrency} ${Number(val).toLocaleString()}`);
    // patch currency into answers before advancing
    answers.currency = tempCurrency;
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
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate trip");
      }
      const data = await res.json();
      const id = Date.now().toString(36);
      sessionStorage.setItem(`trip_${id}`, JSON.stringify({ ...data, form: tripAnswers }));
      router.push(`/trip/${id}`);
    } catch (err) {
      setLoading(false);
      setError(err.message || "Something went wrong. Please try again.");
      addMessage(
        "bot",
        "Oops, something went wrong while building your plan. Please try again. 😔",
        true
      );
    }
  }

  // ── Render input area based on step type ──
  function renderInput() {
    if (isFinished || loading) {
      return (
        <div className="flex items-center justify-center gap-3 py-4 text-gray-500">
          <svg className="animate-spin w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Building your personalized trip plan...</span>
        </div>
      );
    }

    if (!currentStep) return null;

    switch (currentStep.type) {
      case "text":
        return (
          <form onSubmit={handleTextSubmit} className="flex gap-3">
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={currentStep.placeholder}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 placeholder-gray-400 transition-all"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="bg-blue-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              →
            </button>
          </form>
        );

      case "date":
        return (
          <form onSubmit={handleDateSubmit} className="flex gap-3">
            <input
              autoFocus
              type="date"
              value={inputValue}
              min={
                currentStep.id === "endDate"
                  ? answers.startDate
                  : new Date().toISOString().split("T")[0]
              }
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 transition-all"
            />
            <button
              type="submit"
              disabled={!inputValue}
              className="bg-blue-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              →
            </button>
          </form>
        );

      case "counter":
        return (
          <div className="flex flex-col gap-3 bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-center gap-5">
              <button
                onClick={() =>
                  setAnswers((p) => ({ ...p, travelers: Math.max(1, p.travelers - 1) }))
                }
                className="w-11 h-11 rounded-full border-2 border-gray-200 text-gray-600 font-bold text-xl hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center"
              >
                −
              </button>
              <div className="text-center">
                <span className="text-4xl font-bold text-gray-900 block">
                  {answers.travelers}
                </span>
                <span className="text-gray-500 text-sm">
                  {answers.travelers === 1 ? "Solo traveler" : `${answers.travelers} people`}
                </span>
              </div>
              <button
                onClick={() =>
                  setAnswers((p) => ({ ...p, travelers: Math.min(20, p.travelers + 1) }))
                }
                className="w-11 h-11 rounded-full border-2 border-gray-200 text-gray-600 font-bold text-xl hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center"
              >
                +
              </button>
            </div>
            <button
              onClick={() =>
                advanceStep(
                  answers.travelers,
                  answers.travelers === 1 ? "Just me!" : `${answers.travelers} travelers`
                )
              }
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Confirm →
            </button>
          </div>
        );

      case "budget":
        return (
          <form onSubmit={handleBudgetSubmit} className="flex flex-col gap-3">
            <div className="flex gap-3">
              <select
                value={tempCurrency}
                onChange={(e) => setTempCurrency(e.target.value)}
                className="px-3 py-3 rounded-xl border border-gray-200 focus:border-blue-400 outline-none text-gray-900 bg-white font-medium transition-all"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                autoFocus
                type="number"
                min="1"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={currentStep.placeholder}
                className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 placeholder-gray-400 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!inputValue || Number(inputValue) <= 0}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirm →
            </button>
          </form>
        );

      case "style":
        return (
          <div className="grid grid-cols-2 gap-3">
            {STYLE_OPTIONS.map((style) => (
              <button
                key={style.value}
                onClick={() => advanceStep(style.value, `${style.icon} ${style.label}`)}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <span className="text-2xl">{style.icon}</span>
                <div>
                  <div className="font-semibold text-gray-900 text-sm group-hover:text-blue-700">
                    {style.label}
                  </div>
                  <div className="text-xs text-gray-500">{style.desc}</div>
                </div>
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 flex-shrink-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
            ← Home
          </Link>
          <span className="text-xl font-bold text-gray-900">✈️ AI-gency</span>
        </div>
      </nav>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg, i) =>
            msg.role === "bot" ? (
              <BotMessage key={i} text={msg.text} animate={msg.animate && i >= messages.length - 2} />
            ) : (
              <UserMessage key={i} text={msg.text} />
            )
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="mb-3 text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl border border-red-100">
              {error}
            </div>
          )}
          {renderInput()}
        </div>
      </div>
    </main>
  );
}
