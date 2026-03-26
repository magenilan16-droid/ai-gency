"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { saveTrip, generateId, createEmptyTrip } from "@/lib/trips";
import { useLanguage } from "@/app/LanguageProvider";

const G = "linear-gradient(135deg,#f97316,#ec4899)";
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
    <div className="mt-3 bg-white rounded-xl border border-gray-100 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{t("depart_label")}</p>
          <input type="date" value={start} min={today}
            onChange={e => { setStart(e.target.value); if (end && e.target.value >= end) setEnd(""); }}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 outline-none text-sm font-medium text-gray-800 transition-colors" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{t("return_label")}</p>
          <input type="date" value={end} min={start || today}
            onChange={e => setEnd(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 outline-none text-sm font-medium text-gray-800 transition-colors" />
        </div>
      </div>
      {days > 0 && (
        <p className="text-xs font-semibold text-orange-500">{t("x_day_trip", { n: days })}</p>
      )}
      <button
        disabled={!start || !end || days <= 0}
        onClick={() => onConfirm(`Departing ${start}, returning ${end} (${days} days)`)}
        className="w-full py-3 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-40 hover:bg-orange-600 transition-all">
        {t("confirm_dates")}
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
    <div className="mt-3 bg-white rounded-xl border border-gray-100 p-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(p => (
          <button key={p}
            onClick={() => { setSelected(p); setCustom(""); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              selected === p
                ? "border-orange-400 bg-orange-50 text-orange-600"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
            }`}>
            {currency} {p.toLocaleString()}
          </button>
        ))}
        <button
          onClick={() => setSelected("custom")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            selected === "custom"
              ? "border-orange-400 bg-orange-50 text-orange-600"
              : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
          }`}>
          {t("custom_label")}
        </button>
      </div>
      {selected === "custom" && (
        <input
          type="number" value={custom} onChange={e => setCustom(e.target.value)}
          placeholder={t("your_amount", { c: currency })}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 outline-none text-sm font-medium transition-colors" />
      )}
      <button
        disabled={!value || value <= 0}
        onClick={() => onConfirm(`My total budget is ${currency} ${Number(value).toLocaleString()}`)}
        className="w-full py-3 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-40 hover:bg-orange-600 transition-all">
        {t("set_budget")}
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
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              selected.has(o)
                ? "border-orange-400 bg-orange-50 text-orange-600"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}>
            {o}
          </button>
        ))}
      </div>
      <button
        disabled={selected.size === 0}
        onClick={() => onConfirm(Array.from(selected).join(", "))}
        className="w-full py-3 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-40 hover:bg-orange-600 transition-all">
        {selected.size > 0 ? t("confirm_selection", { n: selected.size }) : t("select_at_least_one")}
      </button>
    </div>
  );
}

function CountryPickerWidget({ onSelect, t }) {
  return (
    <div className="mt-3 bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t("popular_destinations")}</p>
      <div className="grid grid-cols-3 gap-2">
        {COUNTRIES.map(c => (
          <button key={c.name} onClick={() => onSelect(c.name)}
            className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-gray-100 bg-white hover:border-orange-300 hover:bg-orange-50 transition-all">
            <span className="text-2xl">{c.flag}</span>
            <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{c.name}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 text-center mt-3">{t("or_type_dest")}</p>
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
    ? `${t("select_cities_btn")} →`
    : selected.size === 1
      ? `Visit ${Array.from(selected)[0]} →`
      : `Visit ${Array.from(selected).join(" + ")} →`;

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        {cities.map(c => (
          <button key={c} onClick={() => toggle(c)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              selected.has(c)
                ? "border-orange-400 bg-orange-50 text-orange-600"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}>
            📍 {c}
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
        className="w-full py-3 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-40 hover:bg-orange-600 transition-all">
        {label}
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
    <div className="flex items-end gap-3 rtl:flex-row-reverse">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: G }}>🤖</div>
      <div className="flex-1 space-y-3">
        <div className="rounded-2xl rounded-bl-sm rtl:rounded-bl-2xl rtl:rounded-br-sm px-4 py-3.5 max-w-sm bg-white border border-gray-100 shadow-sm">
          {renderMarkdown(text)}
          {streaming && <span className="inline-block w-1.5 h-4 bg-orange-300 rounded animate-pulse ml-1 align-middle" />}
        </div>

        {!widgetUsed && countryPicker && (
          <CountryPickerWidget onSelect={country => onChip(country)} t={t} />
        )}

        {!widgetUsed && cities?.length > 0 && (
          <CitiesMultiWidget cities={cities} onConfirm={val => onWidget(val)} t={t} />
        )}

        {!widgetUsed && options?.length > 0 && (
          <div className="flex flex-col gap-2 pl-1">
            {options.map(o => (
              <button key={o} onClick={() => onChip(o)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all text-left">
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
    <div className="flex justify-end rtl:justify-start">
      <div className="rounded-2xl rounded-br-sm rtl:rounded-br-2xl rtl:rounded-bl-sm px-4 py-3.5 max-w-xs text-white text-sm font-medium" style={{ background: G }}>{text}</div>
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
    { value:"adventure", labelKey:"style_adventure", icon:"🧗" },
    { value:"relaxed",   labelKey:"style_relaxed",   icon:"🏖️" },
    { value:"cultural",  labelKey:"style_cultural",  icon:"🏛️" },
    { value:"luxury",    labelKey:"style_luxury",    icon:"✨" },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">{t("destination_label")}</label>
        <input value={f.destination} onChange={e => set("destination", e.target.value)} placeholder={t("destination_placeholder")}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 outline-none text-gray-900 placeholder-gray-400 text-sm font-medium transition-colors" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">{t("dates_label")}</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">{t("from_label")}</p>
            <input type="date" value={f.startDate} min={new Date().toISOString().split("T")[0]} onChange={e => set("startDate", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 outline-none text-sm transition-colors" />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">{t("to_label")}</p>
            <input type="date" value={f.endDate} min={f.startDate} onChange={e => set("endDate", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 outline-none text-sm transition-colors" />
          </div>
        </div>
        {days > 0 && <p className="text-xs text-orange-500 font-semibold mt-2">{t("x_day_trip", { n: days })}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">{t("travelers_label")}</label>
          <div className="flex items-center gap-3 justify-center">
            <button onClick={() => set("travelers", Math.max(1, f.travelers - 1))} className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 font-semibold hover:bg-gray-50 flex items-center justify-center transition-colors">−</button>
            <span className="text-2xl font-bold text-gray-900">{f.travelers}</span>
            <button onClick={() => set("travelers", Math.min(20, f.travelers + 1))} className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 font-semibold hover:bg-gray-50 flex items-center justify-center transition-colors">+</button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">{t("budget_label")}</label>
          <div className="flex gap-2">
            <select value={f.currency} onChange={e => set("currency", e.target.value)} className="px-2 py-2 rounded-xl border border-gray-200 outline-none bg-white text-xs font-semibold text-gray-700">{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select>
            <input type="number" min="1" value={f.budget} onChange={e => set("budget", e.target.value)} placeholder="3000" className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 focus:border-orange-400 outline-none text-sm font-medium transition-colors" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-3">{t("trip_style_label")}</label>
        <div className="grid grid-cols-2 gap-2">
          {STYLES.map(s => (
            <button key={s.value} onClick={() => set("style", s.value)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                f.style === s.value ? "border-orange-400 bg-orange-50" : "border-gray-200 bg-white hover:border-gray-300"
              }`}>
              <span className="text-xl">{s.icon}</span>
              <span className="text-xs font-semibold text-gray-900">{t(s.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>
      <button onClick={() => valid && onSubmit(f)} disabled={!valid}
        className="w-full bg-orange-500 text-white text-sm font-semibold py-3.5 rounded-xl hover:bg-orange-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
        {t("build_template")}
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
    setChatMsgs(prev => [...prev, {
      role: "assistant",
      content: t("building_itinerary_msg", { destination: data.destination }),
    }]);
    scrollBottom();

    try {
      const res = await fetch("/api/generate-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, currency, language: lang }),
      });
      const text = await res.text();
      let tripData;
      try { tripData = JSON.parse(text); }
      catch { throw new Error(t("server_timeout")); }
      if (!res.ok) throw new Error(tripData.error || "Generation failed.");

      const id = generateId();
      saveTrip(id, { ...tripData, form: data });
      clearPlanChat();
      window.location.href = `/trip/${id}`;
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

  async function generateSurprise(data) {
    setGenerating(true);
    setError("");
    const randomDest = SURPRISE_DESTINATIONS[Math.floor(Math.random() * SURPRISE_DESTINATIONS.length)];
    setSurpriseNote(t("visa_verify_warning"));
    setTimeout(() => setSurpriseNote(""), 4000);
    try {
      const res = await fetch("/api/surprise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, destination: randomDest, currency, language: lang }),
      });
      const text = await res.text();
      let tripData;
      try { tripData = JSON.parse(text); }
      catch { throw new Error(t("server_timeout")); }
      if (!res.ok) throw new Error(tripData.error || "Generation failed.");
      const id = generateId();
      saveTrip(id, { ...tripData, isSurprise: true, form: data });
      window.location.href = `/trip/${id}?surprise=true`;
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  // ── Mode selection ──
  if (!mode) return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50">
      <nav className="fixed top-0 left-0 right-0 px-4 py-4 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between bg-white rounded-xl px-5 py-3 shadow-sm border border-gray-100">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium">← {t("nav_home")}</Link>
          <span className="font-bold text-gray-900">✈️ <span style={{ background: G, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI-gency</span></span>
          <div className="w-16" />
        </div>
      </nav>

      <div className="max-w-lg w-full mt-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("plan_your_trip")}</h1>
          <p className="text-gray-400 font-medium">{t("how_to_start")}</p>
        </div>

        {/* Quick Templates */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t("trip_templates_title")}</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { labelKey: "trip_template_weekend", days: 3, style: "relaxed", budget: 500 },
              { labelKey: "trip_template_honeymoon", days: 7, style: "luxury", budget: 5000 },
              { labelKey: "trip_template_backpacker", days: 14, style: "adventure", budget: 1000 },
              { labelKey: "trip_template_family", days: 7, style: "cultural", budget: 3000 },
            ].map((tpl) => (
              <motion.button key={tpl.labelKey} onClick={() => {
                setSf(p => ({ ...p, style: tpl.style, budget: tpl.budget }));
                startAI();
              }}
                whileHover={{ y: -2 }}
                className="bg-white rounded-xl p-4 text-left border border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition-all">
                <div className="font-semibold text-xs text-gray-900">{t(tpl.labelKey)}</div>
                <div className="text-xs text-gray-400 mt-0.5">{tpl.days} days · {currency} {tpl.budget.toLocaleString()}</div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Chat with AI — solid orange */}
          <motion.button onClick={startAI}
            whileHover={{ y: -4 }}
            className="relative overflow-hidden rounded-xl p-8 bg-orange-500 text-white text-left shadow-lg shadow-orange-200 transition-all hover:bg-orange-600">
            <div className="absolute top-0 right-0 text-[120px] opacity-10 font-bold leading-none -mt-6 -mr-4">AI</div>
            <div className="relative">
              <div className="text-4xl mb-3">🤖</div>
              <div className="text-xl font-bold mb-1">{t("chat_with_claude")}</div>
              <div className="text-white/80 text-sm leading-relaxed">{t("chat_desc")}</div>
              <div className="mt-5 inline-flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2.5 text-sm font-semibold">{t("start_chatting")} →</div>
            </div>
          </motion.button>

          <div className="grid grid-cols-2 gap-4">
            {/* Build yourself — white with gray border */}
            <motion.button onClick={() => setMode("manual")}
              whileHover={{ y: -4 }}
              className="relative overflow-hidden rounded-xl p-8 text-left bg-white border border-gray-200 hover:border-gray-300 transition-all">
              <div className="text-4xl mb-3">✏️</div>
              <div className="text-base font-bold text-gray-900 mb-1">{t("build_yourself")}</div>
              <div className="text-gray-400 text-xs leading-relaxed">{t("build_yourself_desc")}</div>
            </motion.button>

            {/* Surprise me — dark purple */}
            <motion.button onClick={() => setMode("surprise")}
              whileHover={{ y: -4 }}
              className="relative overflow-hidden rounded-xl p-8 text-white text-left transition-all"
              style={{ background: "#7c3aed" }}>
              <div className="absolute top-0 right-0 text-7xl opacity-10 font-bold leading-none -mt-2 -mr-2">🎲</div>
              <div className="relative">
                <div className="text-4xl mb-3">🎲</div>
                <div className="text-base font-bold mb-1">{t("surprise_me")}</div>
                <div className="text-white/70 text-xs leading-relaxed">{t("surprise_me_desc")}</div>
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    </main>
  );

  // ── Surprise mode ──
  if (mode === "surprise") {
    const today = new Date().toISOString().split("T")[0];
    const STYLES_S = [
      { value:"adventure", labelKey:"style_adventure", icon:"🧗" },
      { value:"relaxed",   labelKey:"style_relaxed",   icon:"🏖️" },
      { value:"cultural",  labelKey:"style_cultural",  icon:"🏛️" },
      { value:"luxury",    labelKey:"style_luxury",    icon:"✨" },
    ];
    const BUDGETS = [500,1000,2000,3000,5000,8000];
    const setS = (k,v) => setSf(p=>({...p,[k]:v}));
    const days  = sf.startDate && sf.endDate ? Math.ceil((new Date(sf.endDate)-new Date(sf.startDate))/86400000) : 0;
    const valid = sf.startDate && sf.endDate && days > 0 && sf.budget;
    return (
      <main className="min-h-screen bg-gray-50">
        <nav className="px-4 py-4 sticky top-0 z-50">
          <div className="max-w-lg mx-auto flex items-center justify-between bg-white rounded-xl px-5 py-3 shadow-sm border border-gray-100">
            <button onClick={()=>setMode(null)} className="text-gray-400 hover:text-gray-600 text-sm font-medium">← {t("back")}</button>
            <span className="font-bold" style={{color:"#7c3aed"}}>🎲 {t("surprise_me")}</span>
            <select value={currency} onChange={e=>setCurrency(e.target.value)} className="text-xs font-semibold px-2 py-1.5 rounded-lg border border-gray-200 bg-white outline-none text-gray-600">
              {CURRENCIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </nav>
        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
          <div className="rounded-xl p-6 text-white text-center" style={{background:"#7c3aed"}}>
            <div className="text-5xl mb-3">🎲</div>
            <h1 className="text-2xl font-bold mb-1">{t("mystery_destination")}</h1>
            <p className="text-white/70 text-sm">{t("surprise_subtitle")}</p>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-3">{t("when_going")}</label>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-gray-400 mb-1">{t("depart_label")}</p><input type="date" value={sf.startDate} min={today} onChange={e=>setS("startDate",e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 outline-none text-sm transition-colors"/></div>
              <div><p className="text-xs text-gray-400 mb-1">{t("return_label")}</p><input type="date" value={sf.endDate} min={sf.startDate||today} onChange={e=>setS("endDate",e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 outline-none text-sm transition-colors"/></div>
            </div>
            {days > 0 && <p className="text-xs font-semibold text-orange-500 mt-2">{t("x_day_trip", { n: days })}</p>}
          </div>

          {/* Travelers */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-3">{t("how_many")}</label>
            <div className="flex items-center gap-4 justify-center">
              <button type="button" onClick={()=>setS("travelers",Math.max(1,sf.travelers-1))} className="w-10 h-10 rounded-lg border border-gray-200 text-gray-500 font-bold text-xl hover:bg-gray-50 flex items-center justify-center transition-colors">−</button>
              <span className="text-3xl font-bold text-gray-900">{sf.travelers}</span>
              <button type="button" onClick={()=>setS("travelers",Math.min(20,sf.travelers+1))} className="w-10 h-10 rounded-lg border border-gray-200 text-gray-500 font-bold text-xl hover:bg-gray-50 flex items-center justify-center transition-colors">+</button>
            </div>
          </div>

          {/* Budget */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-3">{t("total_budget_c", { c: currency })}</label>
            <div className="flex flex-wrap gap-2">
              {BUDGETS.map(b=>(
                <button key={b} type="button" onClick={()=>setS("budget",b)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                    sf.budget===b ? "border-violet-500 bg-violet-50 text-violet-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}>
                  {currency} {b.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-3">{t("trip_style_label")}</label>
            <div className="grid grid-cols-2 gap-2">
              {STYLES_S.map(s=>(
                <button key={s.value} type="button" onClick={()=>setS("style",s.value)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                    sf.style===s.value ? "border-violet-400 bg-violet-50" : "border-gray-200 bg-white hover:border-gray-300"
                  }`}>
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-xs font-semibold text-gray-900">{t(s.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>

          {surpriseNote && (
            <div className="px-4 py-2.5 rounded-xl text-xs font-semibold text-orange-600 border border-orange-200 bg-orange-50">
              {surpriseNote}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl border border-red-100 bg-red-50">
              <p className="font-semibold text-sm mb-1 text-red-500">{t("error_title")}</p>
              <p className="text-xs text-red-400">{error}</p>
              <button onClick={() => setError("")} className="mt-2 text-xs font-semibold underline text-red-400">
                {t("dismiss_btn")}
              </button>
            </div>
          )}

          <button onClick={()=>valid&&generateSurprise(sf)} disabled={!valid||generating}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-40 hover:-translate-y-0.5 transition-all"
            style={{background:"#7c3aed"}}>
            {generating ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-5 h-5 rounded-full border-2 border-white/50 border-t-white animate-spin"/>
                {t("claude_picking")}
              </span>
            ) : t("reveal_destination")}
          </button>
        </div>
      </main>
    );
  }

  // ── Manual mode ──
  if (mode === "manual") return (
    <main className="min-h-screen bg-gray-50">
      <nav className="px-4 py-4 sticky top-0 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-between bg-white rounded-xl px-5 py-3 shadow-sm border border-gray-100">
          <button onClick={() => setMode(null)} className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium">← {t("back")}</button>
          <span className="font-bold text-gray-900">✈️ <span style={{ background: G, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI-gency</span></span>
          <div className="w-16" />
        </div>
      </nav>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("build_yourself")} ✏️</h1>
          <p className="text-gray-400 font-medium">{t("build_yourself_desc")}</p>
        </div>
        <ManualForm onSubmit={handleManualSubmit} t={t} />
      </div>
    </main>
  );

  // ── AI Chat mode ──
  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      {/* Nav */}
      <nav className="flex-shrink-0 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between bg-white rounded-xl px-5 py-3 shadow-sm border border-gray-100">
          <button onClick={() => { setMode(null); setChatMsgs([]); }} className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium">← {t("back")}</button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-semibold text-gray-900">{t("claude_planner")}</span>
          </div>
          <select value={currency} onChange={e => setCurrency(e.target.value)}
            className="text-xs font-semibold px-2 py-1.5 rounded-lg border border-gray-200 bg-white outline-none text-gray-600">
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </nav>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 px-4 sm:px-6">
        <div className="max-w-xl mx-auto space-y-4">
          {restored && (
            <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-xs">
              <span className="text-orange-600 font-semibold">{t("continuing_session")}</span>
              <button onClick={() => { clearPlanChat(); setRestored(false); startAI(); }}
                className="text-orange-500 hover:text-orange-700 font-semibold underline">
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
            <div className="flex items-end gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{ background: G }}>🤖</div>
              <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3.5 border border-gray-100 shadow-sm">
                <span className="inline-flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
            <div className="mb-3 p-4 rounded-xl border border-red-100 bg-red-50">
              <p className="font-semibold text-sm mb-1 text-red-500">{t("error_title")}</p>
              <p className="text-xs text-red-400">{error}</p>
              <div className="flex items-center gap-3 mt-2">
                <button onClick={() => setError("")} className="text-xs font-semibold underline text-red-400">
                  {t("dismiss_btn")}
                </button>
                {collectedData && (
                  <button onClick={() => generateTrip(collectedData)}
                    className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-red-600">
                    {t("retry")}
                  </button>
                )}
              </div>
            </div>
          )}

          {generating ? (
            <div className="flex flex-col items-center gap-3 py-5">
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full animate-pulse" style={{ width: "60%" }} />
              </div>
              <span className="text-sm text-gray-400 font-medium">{t("building_itinerary")}</span>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex gap-2.5">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={t("or_type_answer")}
                disabled={streaming || generating}
                className="flex-1 min-w-0 px-4 py-3 rounded-xl outline-none text-gray-900 placeholder-gray-400 text-sm font-medium border border-gray-200 focus:border-orange-400 bg-white transition-colors disabled:opacity-50"
              />
              <button type="submit" disabled={!input.trim() || streaming || generating}
                className="bg-orange-500 text-white px-5 py-3 rounded-xl text-sm font-semibold flex-shrink-0 hover:bg-orange-600 disabled:opacity-40 transition-all">
                →
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
