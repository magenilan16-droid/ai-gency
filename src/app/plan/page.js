"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveTrip, generateId, createEmptyTrip } from "@/lib/trips";
import { useLanguage } from "@/app/LanguageProvider";
import {
  Bot, Plane, Sparkles, Shuffle, Pencil, MapPin, ArrowLeft, ArrowRight, Send,
  Mountain, Palmtree, Landmark, Gem, Calendar, Users, Wallet, Check,
} from "lucide-react";

const CURRENCIES = ["USD", "EUR", "GBP", "ILS", "JPY", "AUD", "CAD"];

const SURPRISE_DESTINATIONS = [
  "Paris, France", "Rome, Italy", "Barcelona, Spain", "Amsterdam, Netherlands",
  "Prague, Czech Republic", "Lisbon, Portugal", "Vienna, Austria", "Athens, Greece",
  "Copenhagen, Denmark", "Edinburgh, Scotland", "Budapest, Hungary", "Dubrovnik, Croatia",
  "Tokyo, Japan", "Bali, Indonesia", "Bangkok, Thailand", "Singapore",
  "Kyoto, Japan", "Seoul, South Korea", "Chiang Mai, Thailand", "Hong Kong",
  "New York, USA", "Mexico City, Mexico", "Buenos Aires, Argentina",
  "Rio de Janeiro, Brazil", "Cartagena, Colombia", "Vancouver, Canada",
  "Dubai, UAE", "Tel Aviv, Israel", "Marrakech, Morocco", "Cape Town, South Africa",
  "Sydney, Australia", "Queenstown, New Zealand"
];

const COUNTRIES = [
  { name: "Japan", flag: "🇯🇵" }, { name: "Thailand", flag: "🇹🇭" },
  { name: "Italy", flag: "🇮🇹" }, { name: "France", flag: "🇫🇷" },
  { name: "Spain", flag: "🇪🇸" }, { name: "Greece", flag: "🇬🇷" },
  { name: "Portugal", flag: "🇵🇹" }, { name: "Turkey", flag: "🇹🇷" },
  { name: "UAE", flag: "🇦🇪" }, { name: "Bali", flag: "🇮🇩" },
  { name: "Mexico", flag: "🇲🇽" }, { name: "USA", flag: "🇺🇸" },
  { name: "UK", flag: "🇬🇧" }, { name: "Vietnam", flag: "🇻🇳" },
  { name: "Morocco", flag: "🇲🇦" }, { name: "India", flag: "🇮🇳" },
  { name: "South Korea", flag: "🇰🇷" }, { name: "Brazil", flag: "🇧🇷" },
  { name: "Switzerland", flag: "🇨🇭" }, { name: "Croatia", flag: "🇭🇷" },
  { name: "Israel", flag: "🇮🇱" }, { name: "Jordan", flag: "🇯🇴" },
  { name: "South Africa", flag: "🇿🇦" }, { name: "Netherlands", flag: "🇳🇱" },
  { name: "Peru", flag: "🇵🇪" }, { name: "Nepal", flag: "🇳🇵" },
  { name: "Argentina", flag: "🇦🇷" }, { name: "Australia", flag: "🇦🇺" },
  { name: "Germany", flag: "🇩🇪" }, { name: "Czech Republic", flag: "🇨🇿" },
];

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

function DatePickerWidget({ onConfirm, t }) {
  const today = new Date().toISOString().split("T")[0];
  const [start, setStart] = useState("");
  const [end, setEnd]     = useState("");
  const days = start && end ? Math.ceil((new Date(end) - new Date(start)) / 86400000) : 0;

  return (
    <div className="mt-3 card p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="label-micro mb-1.5">{t("depart_label")}</p>
          <input type="date" value={start} min={today}
            onChange={e => { setStart(e.target.value); if (end && e.target.value >= end) setEnd(""); }}
            className="input-field num" />
        </div>
        <div>
          <p className="label-micro mb-1.5">{t("return_label")}</p>
          <input type="date" value={end} min={start || today}
            onChange={e => setEnd(e.target.value)}
            className="input-field num" />
        </div>
      </div>
      {days > 0 && (
        <p className="text-[12px] font-medium text-gray-500 num">{t("x_day_trip", { n: days })}</p>
      )}
      <button
        disabled={!start || !end || days <= 0}
        onClick={() => onConfirm(`Departing ${start}, returning ${end} (${days} days)`)}
        className="btn-primary w-full disabled:opacity-40">
        {t("confirm_dates")} <ArrowRight size={15} strokeWidth={2} />
      </button>
    </div>
  );
}

function BudgetPickerWidget({ currency, onConfirm, t }) {
  const PRESETS = [500, 1000, 1500, 2000, 3000, 5000, 8000, 10000];
  const [selected, setSelected] = useState(null);
  const [custom, setCustom]     = useState("");
  const value = selected === "custom" ? Number(custom) : selected;

  return (
    <div className="mt-3 card p-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(p => (
          <button key={p}
            onClick={() => { setSelected(p); setCustom(""); }}
            className={`px-3 py-2 rounded-md text-[12px] font-medium border transition-all num ${
              selected === p
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}>
            {currency} {p.toLocaleString()}
          </button>
        ))}
        <button
          onClick={() => setSelected("custom")}
          className={`px-3 py-2 rounded-md text-[12px] font-medium border transition-all ${
            selected === "custom"
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
          }`}>
          {t("custom_label")}
        </button>
      </div>
      {selected === "custom" && (
        <input
          type="number" value={custom} onChange={e => setCustom(e.target.value)}
          placeholder={t("your_amount", { c: currency })}
          className="input-field num" />
      )}
      <button
        disabled={!value || value <= 0}
        onClick={() => onConfirm(`My total budget is ${currency} ${Number(value).toLocaleString()}`)}
        className="btn-primary w-full disabled:opacity-40">
        {t("set_budget")} <ArrowRight size={15} strokeWidth={2} />
      </button>
    </div>
  );
}

function MultiOptionsWidget({ options, onConfirm }) {
  const { t } = useLanguage();
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
            className={`px-3 py-2 rounded-md text-[12px] font-medium border transition-all ${
              selected.has(o)
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}>
            {o}
          </button>
        ))}
      </div>
      <button
        disabled={selected.size === 0}
        onClick={() => onConfirm(Array.from(selected).join(", "))}
        className="btn-primary w-full disabled:opacity-40">
        {selected.size > 0 ? t("confirm_selection", { n: selected.size }) : t("select_at_least_one")}
        {selected.size > 0 && <ArrowRight size={15} strokeWidth={2} />}
      </button>
    </div>
  );
}

function CountryPickerWidget({ onSelect, t }) {
  return (
    <div className="mt-3 card p-4">
      <p className="label-micro mb-3">{t("popular_destinations")}</p>
      <div className="grid grid-cols-3 gap-2">
        {COUNTRIES.map(c => (
          <button key={c.name} onClick={() => onSelect(c.name)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-md border border-gray-100 bg-white hover:border-gray-900 hover:bg-gray-50 transition-all active:scale-95">
            <span className="text-xl">{c.flag}</span>
            <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">{c.name}</span>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-gray-400 text-center mt-3">{t("or_type_dest")}</p>
    </div>
  );
}

function CitiesMultiWidget({ cities, onConfirm, t }) {
  const [selected, setSelected] = useState(new Set());

  function toggle(c) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  }

  const label = selected.size === 0
    ? t("select_cities_btn")
    : selected.size === 1
      ? `Visit ${Array.from(selected)[0]}`
      : `Visit ${Array.from(selected).join(" + ")}`;

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        {cities.map(c => (
          <button key={c} onClick={() => toggle(c)}
            className={`px-3 py-2 rounded-md text-[12px] font-medium border transition-all inline-flex items-center gap-1.5 ${
              selected.has(c)
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}>
            <MapPin size={11} strokeWidth={2} /> {c}
          </button>
        ))}
      </div>
      <button
        disabled={selected.size === 0}
        onClick={() => {
          const arr = Array.from(selected);
          const text = arr.length === 1
            ? `I want to visit ${arr[0]}`
            : `I'd like to visit ${arr.slice(0, -1).join(", ")} and ${arr[arr.length - 1]}`;
          onConfirm(text);
        }}
        className="btn-primary w-full disabled:opacity-40">
        {label} <ArrowRight size={15} strokeWidth={2} />
      </button>
    </div>
  );
}

// ─── Markdown renderer for bot messages ──────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return null;
  return text.split("\n").filter(Boolean).map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return (
      <p key={i} className={`text-gray-800 text-sm leading-relaxed ${i > 0 ? "mt-1.5" : ""}`}>
        {parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**"))
            return <strong key={j} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
          if (part.startsWith("*") && part.endsWith("*"))
            return <em key={j} className="italic">{part.slice(1, -1)}</em>;
          return part;
        })}
      </p>
    );
  });
}

// ─── Chat bubbles ─────────────────────────────────────────────────────────────
function BotBubble({ text, cities, options, multiOptions, datePicker, budgetPicker, countryPicker, onChip, onWidget, currency, streaming, widgetUsed, t }) {
  return (
    <div className="flex items-start gap-3 animate-fade-up">
      {/* AI avatar — ink square */}
      <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 bg-gray-900 text-white mt-0.5">
        <Bot size={15} strokeWidth={1.75} />
      </div>
      <div className="flex-1 space-y-3 min-w-0">
        <div className="rounded-xl rounded-tl-sm px-4 py-3 max-w-md bg-white border border-gray-100 chat-bot-bubble">
          {renderMarkdown(text)}
          {streaming && <span className="inline-block w-1 h-4 bg-gray-900 rounded-sm animate-pulse ml-1 align-middle" />}
        </div>

        {!widgetUsed && countryPicker && (
          <CountryPickerWidget onSelect={country => onChip(country)} t={t} />
        )}

        {!widgetUsed && cities?.length > 0 && (
          <CitiesMultiWidget cities={cities} onConfirm={val => onWidget(val)} t={t} />
        )}

        {!widgetUsed && options?.length > 0 && (
          <div className="flex flex-col gap-1.5 pl-0.5">
            {options.map(o => (
              <button key={o} onClick={() => onChip(o)}
                className="px-4 py-2.5 rounded-md text-[13px] font-medium border border-gray-200 bg-white text-gray-800 hover:border-gray-900 hover:bg-gray-50 transition-all text-left">
                {o}
              </button>
            ))}
          </div>
        )}

        {!widgetUsed && multiOptions?.length > 0 && (
          <MultiOptionsWidget options={multiOptions} onConfirm={onWidget} />
        )}

        {!widgetUsed && datePicker && (
          <DatePickerWidget onConfirm={onWidget} t={t} />
        )}

        {!widgetUsed && budgetPicker && (
          <BudgetPickerWidget currency={currency} onConfirm={onWidget} t={t} />
        )}
      </div>
    </div>
  );
}

function UserBubble({ text }) {
  return (
    <div className="flex justify-end animate-fade-up">
      <div className="rounded-xl rounded-tr-sm px-4 py-3 max-w-sm text-white text-[14px] font-medium bg-gray-900 chat-user-bubble">
        {text}
      </div>
    </div>
  );
}

// ─── Manual form ──────────────────────────────────────────────────────────────
function ManualForm({ onSubmit, t }) {
  const [f, setF] = useState({ destination: "", startDate: "", endDate: "", travelers: 2, budget: "", currency: "USD", style: "cultural" });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const days = f.startDate && f.endDate ? Math.ceil((new Date(f.endDate) - new Date(f.startDate)) / 86400000) : null;
  const valid = f.destination && f.startDate && f.endDate && f.budget > 0 && (!f.endDate || !f.startDate || new Date(f.endDate) > new Date(f.startDate));
  const STYLES = [
    { value:"adventure", labelKey:"style_adventure", Icon: Mountain },
    { value:"relaxed",   labelKey:"style_relaxed",   Icon: Palmtree },
    { value:"cultural",  labelKey:"style_cultural",  Icon: Landmark },
    { value:"luxury",    labelKey:"style_luxury",    Icon: Gem },
  ];

  return (
    <div className="space-y-3">
      <div className="card p-5">
        <label className="label-micro block mb-2.5">{t("destination_label")}</label>
        <input value={f.destination} onChange={e => set("destination", e.target.value)} placeholder={t("destination_placeholder")}
          className="input-field" />
      </div>
      <div className="card p-5">
        <label className="label-micro block mb-2.5">{t("dates_label")}</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] text-gray-500 mb-1.5">{t("from_label")}</p>
            <input type="date" value={f.startDate} min={new Date().toISOString().split("T")[0]} onChange={e => set("startDate", e.target.value)} className="input-field num" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 mb-1.5">{t("to_label")}</p>
            <input type="date" value={f.endDate} min={f.startDate} onChange={e => set("endDate", e.target.value)} className="input-field num" />
          </div>
        </div>
        {days > 0 && <p className="text-[12px] text-gray-600 font-medium mt-3 num">{t("x_day_trip", { n: days })}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-5">
          <label className="label-micro block mb-2.5">{t("travelers_label")}</label>
          <div className="flex items-center gap-3 justify-center">
            <button onClick={() => set("travelers", Math.max(1, f.travelers - 1))} className="w-8 h-8 rounded-md border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 flex items-center justify-center transition-colors">−</button>
            <span className="text-2xl font-medium text-gray-900 font-serif num tabular-nums min-w-[32px] text-center">{f.travelers}</span>
            <button onClick={() => set("travelers", Math.min(20, f.travelers + 1))} className="w-8 h-8 rounded-md border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 flex items-center justify-center transition-colors">+</button>
          </div>
        </div>
        <div className="card p-5">
          <label className="label-micro block mb-2.5">{t("budget_label")}</label>
          <div className="flex gap-2">
            <select value={f.currency} onChange={e => set("currency", e.target.value)} className="px-2 py-2 rounded-md border border-gray-200 outline-none bg-white text-[12px] font-medium text-gray-700">{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select>
            <input type="number" min="1" value={f.budget} onChange={e => set("budget", e.target.value)} placeholder="3000" className="input-field num flex-1 min-w-0" />
          </div>
        </div>
      </div>
      <div className="card p-5">
        <label className="label-micro block mb-3">{t("trip_style_label")}</label>
        <div className="grid grid-cols-2 gap-2">
          {STYLES.map(s => (
            <button key={s.value} onClick={() => set("style", s.value)}
              className={`flex items-center gap-2.5 p-3 rounded-md border text-left transition-all ${
                f.style === s.value ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white hover:border-gray-300"
              }`}>
              <s.Icon size={16} strokeWidth={1.75} className={f.style === s.value ? "text-gray-900" : "text-gray-500"} />
              <span className="text-[12px] font-medium text-gray-900">{t(s.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>
      <button onClick={() => valid && onSubmit(f)} disabled={!valid}
        className="btn-primary w-full py-3.5 disabled:opacity-40 disabled:cursor-not-allowed">
        {t("build_template")} <ArrowRight size={15} strokeWidth={2} />
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
  const { t, lang } = useLanguage();

  const [chatMsgs, setChatMsgs]       = useState([]);
  const [input, setInput]             = useState("");
  const [streaming, setStreaming]     = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [genStep, setGenStep]         = useState(0);
  const [genStepText, setGenStepText] = useState("");
  const [error, setError]             = useState("");
  const [collectedData, setCollectedData] = useState(null);
  const [currency, setCurrency]       = useState("USD");
  const [usedWidgets, setUsedWidgets] = useState(new Set());
  const [restored, setRestored]       = useState(false);
  const [surpriseNote, setSurpriseNote] = useState("");
  const [sf, setSf] = useState({ startDate:"", endDate:"", travelers:2, budget:null, style:"cultural", accommodation:"mid-range" });

  // ── Persist & restore plan chat ──
  useEffect(() => {
    const saved = localStorage.getItem("aigency_plan_chat");
    if (saved) {
      try {
        const { messages, widgets, cur } = JSON.parse(saved);
        if (messages?.length > 1) {
          setChatMsgs(messages);
          setUsedWidgets(new Set(widgets || []));
          if (cur) setCurrency(cur);
          setMode("ai");
          setRestored(true);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (mode === "ai" && chatMsgs.length > 1) {
      localStorage.setItem("aigency_plan_chat", JSON.stringify({
        messages: chatMsgs,
        widgets: [...usedWidgets],
        cur: currency,
      }));
    }
  }, [chatMsgs, usedWidgets, currency, mode]);

  function clearPlanChat() {
    localStorage.removeItem("aigency_plan_chat");
  }

  function scrollBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  function startAI() {
    clearPlanChat();
    setRestored(false);
    setMode("ai");
    setChatMsgs([{
      role: "assistant",
      content: t("claude_greeting_initial"),
      cities: null, options: null, multiOptions: null, datePicker: false, budgetPicker: false, countryPicker: true, streaming: false, initial: true,
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
        body: JSON.stringify({ messages: history, language: lang }),
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
                // Hide [READY] block during streaming — show a friendly message instead
                const hasReady = fullText.includes("[READY]");
                const displayText = hasReady
                  ? fullText.split("[READY]")[0].trim() || t("building_itinerary_msg", { destination: "..." })
                  : fullText;
                setChatMsgs(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: displayText, streaming: true };
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
          content: cleanText.trim() !== "" ? cleanText : (ready ? "" : fullText),
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
        updated[updated.length - 1] = { role: "assistant", content: t("error_something_wrong"), streaming: false };
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
    setGenStep(0);
    setChatMsgs(prev => [...prev, {
      role: "assistant",
      content: t("building_itinerary_msg", { destination: data.destination }),
    }]);
    scrollBottom();

    // Animate through steps while waiting
    const steps = [
      t("gen_step_analyzing") || "Analyzing your preferences...",
      t("gen_step_building") || "Building your day-by-day itinerary...",
      t("gen_step_hotels") || "Finding the best hotels & restaurants...",
      t("gen_step_budget") || "Calculating your budget breakdown...",
      t("gen_step_tips") || "Adding local tips & insider secrets...",
    ];
    let stepIdx = 0;
    setGenStep(0);
    setGenStepText(steps[0]);
    const stepTimer = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1);
      setGenStep(stepIdx);
      setGenStepText(steps[stepIdx]);
    }, 4000);

    try {
      const res = await fetch("/api/generate-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, currency, language: lang }),
      });

      if (!res.ok) {
        const errText = await res.text();
        try { throw new Error(JSON.parse(errText).error || "Generation failed."); }
        catch { throw new Error("Generation failed. Please try again."); }
      }

      // Read streaming response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let tripData = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.done && parsed.trip) tripData = parsed.trip;
          } catch (e) {
            if (e.message !== "Unexpected end of JSON input") throw e;
          }
        }
      }

      if (!tripData) throw new Error("No trip data received. Please try again.");

      const id = generateId();
      saveTrip(id, { ...tripData, form: data });
      clearPlanChat();
      window.location.href = `/trip/${id}`;
    } catch (err) {
      setError(err.message);
      setChatMsgs(prev => [...prev, {
        role: "assistant",
        content: lang === "he"
          ? `אופס! ${err.message}\n\nלחץ על "נסה שנית" למטה.`
          : `Oops! ${err.message}\n\nClick Retry below.`,
      }]);
    } finally {
      clearInterval(stepTimer);
      setGenerating(false);
      setGenStep(0);
      setGenStepText("");
    }
  }

  function handleManualSubmit(formData) {
    const id   = generateId();
    const trip = createEmptyTrip(formData);
    saveTrip(id, trip);
    router.push(`/trip/${id}?edit=true`);
  }

  async function generateSurprise(data) {
    setGenerating(true);
    setGenStep(0);
    setGenStepText("Picking your mystery destination...");
    setError("");
    const stepTimer = setInterval(() => {
      setGenStep(s => Math.min(s + 1, 4));
    }, 4000);
    try {
      const res = await fetch("/api/surprise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, currency, language: lang }),
      });
      if (!res.ok) throw new Error("Generation failed. Please try again.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let tripData = null;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.done && parsed.trip) tripData = parsed.trip;
          } catch (e) {
            if (e.message !== "Unexpected end of JSON input") throw e;
          }
        }
      }
      if (!tripData) throw new Error("No trip data received. Please try again.");
      const id = generateId();
      saveTrip(id, { ...tripData, isSurprise: true });
      window.location.href = `/trip/${id}?surprise=true`;
    } catch (err) {
      setError(err.message);
    } finally {
      clearInterval(stepTimer);
      setGenerating(false);
      setGenStep(0);
      setGenStepText("");
    }
  }

  // ── Mode selection ──
  if (!mode) return (
    <main className="min-h-screen flex flex-col bg-white animate-fade-up">
      <nav className="px-6 py-5 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-[13px] font-medium">
            <ArrowLeft size={14} /> {t("nav_home")}
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-black flex items-center justify-center">
              <span className="text-white text-[9px] font-bold tracking-tighter">AI</span>
            </div>
            <span className="font-semibold text-gray-900 text-[13px]">AI-gency</span>
          </div>
          <div className="w-16" />
        </div>
      </nav>

      <div className="max-w-2xl w-full mx-auto px-6 py-12 flex-1">
        <div className="mb-12">
          <p className="eyebrow mb-3">New itinerary</p>
          <h1 className="font-serif text-[42px] font-medium text-gray-900 tracking-tight leading-[1.05] mb-3">
            Plan your trip.
          </h1>
          <p className="text-[15px] text-gray-500 max-w-md">{t("how_to_start")}</p>
        </div>

        {/* Primary — Chat with AI */}
        <button onClick={startAI}
          className="w-full relative overflow-hidden rounded-xl p-8 bg-gray-900 text-white text-left transition-all hover:bg-black active:scale-[0.995] mb-3 group">
          <div className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at top right, rgba(234,88,12,0.5) 0%, transparent 60%)" }} />
          <div className="relative flex items-start justify-between gap-6">
            <div className="flex-1">
              <span className="eyebrow" style={{ color: "#ea580c" }}>Recommended</span>
              <div className="font-serif text-[28px] font-medium tracking-tight leading-tight mt-2 mb-2">
                {t("chat_with_claude")}
              </div>
              <div className="text-gray-400 text-[13px] leading-relaxed max-w-sm">{t("chat_desc")}</div>
              <div className="mt-5 inline-flex items-center gap-2 text-[13px] font-medium">
                {t("start_chatting")} <ArrowRight size={14} strokeWidth={2} />
              </div>
            </div>
            <div className="w-12 h-12 rounded-md bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
              <Bot size={22} strokeWidth={1.75} />
            </div>
          </div>
        </button>

        {/* Secondary — Manual + Surprise */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button onClick={() => setMode("manual")}
            className="relative rounded-xl p-6 text-left bg-white border border-gray-200 hover:border-gray-900 transition-all group">
            <div className="icon-square mb-4">
              <Pencil size={16} strokeWidth={1.75} />
            </div>
            <div className="text-[14px] font-medium text-gray-900 mb-1">{t("build_yourself")}</div>
            <div className="text-gray-500 text-[12px] leading-relaxed">{t("build_yourself_desc")}</div>
          </button>

          <button onClick={() => setMode("surprise")}
            className="relative rounded-xl p-6 text-left bg-white border border-gray-200 hover:border-gray-900 transition-all group">
            <div className="icon-square mb-4">
              <Shuffle size={16} strokeWidth={1.75} />
            </div>
            <div className="text-[14px] font-medium text-gray-900 mb-1">{t("surprise_me")}</div>
            <div className="text-gray-500 text-[12px] leading-relaxed">{t("surprise_me_desc")}</div>
          </button>
        </div>

        {/* Quick Templates */}
        <div>
          <p className="label-micro mb-3">{t("trip_templates_title")}</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { labelKey: "trip_template_weekend", days: 3, style: "relaxed", budget: 500 },
              { labelKey: "trip_template_honeymoon", days: 7, style: "luxury", budget: 5000 },
              { labelKey: "trip_template_backpacker", days: 14, style: "adventure", budget: 1000 },
              { labelKey: "trip_template_family", days: 7, style: "cultural", budget: 3000 },
            ].map((tpl) => (
              <button key={tpl.labelKey} onClick={() => {
                setSf(p => ({ ...p, style: tpl.style, budget: tpl.budget }));
                startAI();
              }}
                className="card card-interactive p-4 text-left">
                <div className="font-medium text-[13px] text-gray-900">{t(tpl.labelKey)}</div>
                <div className="text-[11px] text-gray-500 mt-1 num">{tpl.days} days · {currency} {tpl.budget.toLocaleString()}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );

  // ── Surprise mode ──
  if (mode === "surprise") {
    const today = new Date().toISOString().split("T")[0];
    const STYLES_S = [
      { value:"adventure", labelKey:"style_adventure", Icon: Mountain },
      { value:"relaxed",   labelKey:"style_relaxed",   Icon: Palmtree },
      { value:"cultural",  labelKey:"style_cultural",  Icon: Landmark },
      { value:"luxury",    labelKey:"style_luxury",    Icon: Gem },
    ];
    const BUDGETS = [500,1000,2000,3000,5000,8000];
    const setS = (k,v) => setSf(p=>({...p,[k]:v}));
    const days  = sf.startDate && sf.endDate ? Math.ceil((new Date(sf.endDate)-new Date(sf.startDate))/86400000) : 0;
    const valid = sf.startDate && sf.endDate && days > 0 && sf.budget;
    return (
      <main className="min-h-screen bg-white">
        <nav className="px-6 py-5 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button onClick={()=>setMode(null)} className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-[13px] font-medium">
              <ArrowLeft size={14} /> {t("back")}
            </button>
            <div className="flex items-center gap-2">
              <Shuffle size={14} strokeWidth={1.75} />
              <span className="text-[13px] font-semibold text-gray-900">{t("surprise_me")}</span>
            </div>
            <select value={currency} onChange={e=>setCurrency(e.target.value)} className="text-[12px] font-medium px-2 py-1.5 rounded-md border border-gray-200 bg-white outline-none text-gray-600">
              {CURRENCIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </nav>
        <div className="max-w-2xl mx-auto px-6 py-10 space-y-4">
          <div className="rounded-xl p-8 bg-gray-900 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at top right, rgba(234,88,12,0.5) 0%, transparent 60%)" }} />
            <div className="relative">
              <span className="eyebrow" style={{ color: "#ea580c" }}>Mystery</span>
              <h1 className="font-serif text-[36px] font-medium tracking-tight leading-none mt-3 mb-3">
                {t("mystery_destination")}
              </h1>
              <p className="text-gray-400 text-[14px] max-w-sm leading-relaxed">{t("surprise_subtitle")}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="card p-5">
            <label className="label-micro block mb-3">{t("when_going")}</label>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-[11px] text-gray-500 mb-1.5">{t("depart_label")}</p><input type="date" value={sf.startDate} min={today} onChange={e=>setS("startDate",e.target.value)} className="input-field num"/></div>
              <div><p className="text-[11px] text-gray-500 mb-1.5">{t("return_label")}</p><input type="date" value={sf.endDate} min={sf.startDate||today} onChange={e=>setS("endDate",e.target.value)} className="input-field num"/></div>
            </div>
            {days > 0 && <p className="text-[12px] text-gray-600 font-medium mt-3 num">{t("x_day_trip", { n: days })}</p>}
          </div>

          {/* Travelers */}
          <div className="card p-5">
            <label className="label-micro block mb-3">{t("how_many")}</label>
            <div className="flex items-center gap-4 justify-center">
              <button type="button" onClick={()=>setS("travelers",Math.max(1,sf.travelers-1))} className="w-9 h-9 rounded-md border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 text-lg flex items-center justify-center transition-colors">−</button>
              <span className="font-serif text-3xl font-medium text-gray-900 num tabular-nums min-w-[40px] text-center">{sf.travelers}</span>
              <button type="button" onClick={()=>setS("travelers",Math.min(20,sf.travelers+1))} className="w-9 h-9 rounded-md border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 text-lg flex items-center justify-center transition-colors">+</button>
            </div>
          </div>

          {/* Budget */}
          <div className="card p-5">
            <label className="label-micro block mb-3">{t("total_budget_c", { c: currency })}</label>
            <div className="flex flex-wrap gap-2">
              {BUDGETS.map(b=>(
                <button key={b} type="button" onClick={()=>setS("budget",b)}
                  className={`px-3.5 py-2 rounded-md text-[12px] font-medium border transition-all num ${
                    sf.budget===b ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}>
                  {currency} {b.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="card p-5">
            <label className="label-micro block mb-3">{t("trip_style_label")}</label>
            <div className="grid grid-cols-2 gap-2">
              {STYLES_S.map(s=>(
                <button key={s.value} type="button" onClick={()=>setS("style",s.value)}
                  className={`flex items-center gap-2.5 p-3 rounded-md border text-left transition-all ${
                    sf.style===s.value ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white hover:border-gray-300"
                  }`}>
                  <s.Icon size={16} strokeWidth={1.75} className={sf.style === s.value ? "text-gray-900" : "text-gray-500"} />
                  <span className="text-[12px] font-medium text-gray-900">{t(s.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>

          {surpriseNote && (
            <div className="px-4 py-2.5 rounded-md text-[12px] font-medium text-gray-700 border border-gray-200 bg-gray-50">
              {surpriseNote}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-md border border-red-100 bg-red-50">
              <p className="font-medium text-[13px] mb-1 text-red-600">{t("error_title")}</p>
              <p className="text-[12px] text-red-500">{error}</p>
              <button onClick={() => setError("")} className="mt-2 text-[12px] font-medium underline text-red-500">
                {t("dismiss_btn")}
              </button>
            </div>
          )}

          <button onClick={()=>valid&&generateSurprise(sf)} disabled={!valid||generating}
            className="btn-primary w-full py-3.5 disabled:opacity-40">
            {generating ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>
                {t("claude_picking")}
              </span>
            ) : (
              <>{t("reveal_destination")} <ArrowRight size={15} strokeWidth={2} /></>
            )}
          </button>
        </div>
      </main>
    );
  }

  // ── Manual mode ──
  if (mode === "manual") return (
    <main className="min-h-screen bg-white">
      <nav className="px-6 py-5 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => setMode(null)} className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-[13px] font-medium">
            <ArrowLeft size={14} /> {t("back")}
          </button>
          <div className="flex items-center gap-2">
            <Pencil size={14} strokeWidth={1.75} />
            <span className="text-[13px] font-semibold text-gray-900">{t("build_yourself")}</span>
          </div>
          <div className="w-16" />
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-10">
          <p className="eyebrow mb-3">Manual planner</p>
          <h1 className="font-serif text-[36px] font-medium text-gray-900 tracking-tight leading-none mb-3">
            Build it yourself.
          </h1>
          <p className="text-[14px] text-gray-500">{t("build_yourself_desc")}</p>
        </div>
        <ManualForm onSubmit={handleManualSubmit} t={t} />
      </div>
    </main>
  );

  // ── AI Chat mode ──
  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Chat header — minimal */}
      <nav className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-white">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => { setMode(null); setChatMsgs([]); }} className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-[13px] font-medium">
            <ArrowLeft size={14} /> {t("back")}
          </button>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" style={{ animation: "pulse-soft 2s ease infinite" }} />
            <span className="text-[13px] font-semibold text-gray-900">{t("claude_planner")}</span>
          </div>
          <select value={currency} onChange={e => setCurrency(e.target.value)}
            className="text-[12px] font-medium px-2 py-1.5 rounded-md border border-gray-200 bg-white outline-none text-gray-600">
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </nav>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto space-y-4">
          {restored && (
            <div className="flex items-center justify-between bg-gray-900 text-white rounded-md px-4 py-2.5 text-[12px]">
              <span className="font-medium">{t("continuing_session")}</span>
              <button onClick={() => { clearPlanChat(); setRestored(false); startAI(); }}
                className="text-gray-300 hover:text-white font-medium underline">
                {t("start_fresh")}
              </button>
            </div>
          )}
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
                  countryPicker={m.countryPicker}
                  streaming={m.streaming}
                  currency={currency}
                  widgetUsed={usedWidgets.has(i)}
                  onChip={chip => sendMessage(chip, i)}
                  onWidget={val => sendMessage(val, i)}
                  t={t}
                />
          )}
          {(streaming || generating) && chatMsgs[chatMsgs.length - 1]?.role === "user" && (
            <div className="flex items-start gap-3 animate-fade-up">
              <div className="w-8 h-8 rounded-md flex items-center justify-center bg-gray-900 text-white mt-0.5">
                <Bot size={15} strokeWidth={1.75} />
              </div>
              <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 border border-gray-100">
                <span className="inline-flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}

          {/* Generating trip — editorial card */}
          {generating && (
            <div className="animate-fade-up">
              <div className="card p-6">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-10 h-10 rounded-md bg-gray-900 flex items-center justify-center text-white">
                    <Sparkles size={17} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-serif text-[18px] font-medium text-gray-900 leading-tight">{t("building_itinerary")}</p>
                    <p className="text-[12px] text-gray-500 mt-0.5">{genStepText}</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="progress-bar mb-4">
                  <div className="progress-bar-fill"
                    style={{ width: `${Math.min(95, 15 + genStep * 20)}%` }} />
                </div>
                {/* Step dots */}
                <div className="flex justify-between items-center">
                  {[0,1,2,3,4].map(i => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                        style={{ background: i <= genStep ? "#0a0a0a" : "#e5e5e5" }} />
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-4 num">Approx. 15–20 seconds</p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 px-4 sm:px-6 pb-6 pt-4 bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="mb-3 p-4 rounded-md border border-red-100 bg-red-50">
              <p className="font-medium text-[13px] mb-1 text-red-600">{t("error_title")}</p>
              <p className="text-[12px] text-red-500">{error}</p>
              <div className="flex items-center gap-3 mt-2">
                <button onClick={() => setError("")} className="text-[12px] font-medium underline text-red-500">
                  {t("dismiss_btn")}
                </button>
                {collectedData && (
                  <button onClick={() => generateTrip(collectedData)}
                    className="text-[12px] bg-gray-900 text-white px-3 py-1.5 rounded-md font-medium hover:bg-black">
                    {t("retry")}
                  </button>
                )}
              </div>
            </div>
          )}

          {generating ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-full progress-bar">
                <div className="progress-bar-fill"
                  style={{ width: `${Math.min(95, 10 + genStep * 20)}%` }} />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin flex-shrink-0" />
                <span className="text-[13px] text-gray-600 font-medium">{genStepText || t("building_itinerary")}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); sendMessage(input); }}
              className="flex gap-2 bg-white rounded-xl border border-gray-200 p-1.5 focus-within:border-gray-900 transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={t("or_type_answer")}
                disabled={streaming || generating}
                className="flex-1 min-w-0 px-3 py-2 outline-none text-gray-900 placeholder-gray-400 text-[14px] bg-transparent disabled:opacity-50"
              />
              <button type="submit" disabled={!input.trim() || streaming || generating}
                className="bg-gray-900 text-white w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 hover:bg-black disabled:opacity-30 transition-all">
                <Send size={14} strokeWidth={2} />
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
