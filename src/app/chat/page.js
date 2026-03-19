"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useLanguage } from "@/app/LanguageProvider";

const G = "linear-gradient(135deg,#f97316,#ec4899)";
const CHAT_STORAGE_KEY = "aigency_chat_history";

// ─── localStorage helpers ───────────────────────────────────────────────────

function getAllTrips() {
  if (typeof window === "undefined") return [];
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("aigency_trip_")) {
      try { out.push({ id: k.replace("aigency_trip_", ""), ...JSON.parse(localStorage.getItem(k)) }); }
      catch {}
    }
  }
  return out.sort((a, b) => b.id.localeCompare(a.id));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function saveTrip(data) {
  const id = generateId();
  const trip = {
    destination: data.destination || "Unknown",
    days: data.days || Math.ceil((new Date(data.endDate) - new Date(data.startDate)) / 86400000) || 1,
    style: data.style || "balanced",
    currency: data.currency || "USD",
    total_estimated_cost: data.budget || 0,
    summary: data.summary || "",
    form: {
      destination: data.destination || "",
      startDate: data.startDate || "",
      endDate: data.endDate || "",
      travelers: data.travelers || 1,
      budget: data.budget || 0,
      currency: data.currency || "USD",
      style: data.style || "balanced",
    },
    createdAt: Date.now(),
  };
  localStorage.setItem(`aigency_trip_${id}`, JSON.stringify(trip));
  return id;
}

function updateTripField(tripId, field, value) {
  const raw = localStorage.getItem(`aigency_trip_${tripId}`);
  if (!raw) return false;
  try {
    const trip = JSON.parse(raw);
    if (["startDate","endDate","travelers","budget"].includes(field)) {
      trip.form = trip.form || {};
      trip.form[field] = isNaN(value) ? value : Number(value);
    }
    trip[field] = isNaN(value) ? value : (["total_estimated_cost","travelers","budget","days"].includes(field) ? Number(value) : value);
    localStorage.setItem(`aigency_trip_${tripId}`, JSON.stringify(trip));
    return true;
  } catch { return false; }
}

function deleteTrip(tripId) {
  localStorage.removeItem(`aigency_trip_${tripId}`);
}

// ─── Chat persistence ───────────────────────────────────────────────────────

function saveChatHistory(messages, tripId) {
  if (typeof window === "undefined") return;
  // Only save if there's actual conversation (more than the initial greeting)
  if (messages.length <= 1) {
    localStorage.removeItem(CHAT_STORAGE_KEY);
    return;
  }
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({
    messages,
    tripId: tripId || null,
    savedAt: Date.now(),
  }));
}

function loadChatHistory() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.messages || data.messages.length <= 1) return null;
    return data;
  } catch { return null; }
}

function clearChatHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CHAT_STORAGE_KEY);
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Command parser ─────────────────────────────────────────────────────────

function parseAndExecuteCommands(text, setTrips) {
  let notifications = [];

  const saveMatch = text.match(/\[SAVE_TRIP\]([\s\S]*?)\[\/SAVE_TRIP\]/);
  if (saveMatch) {
    try {
      const data = JSON.parse(saveMatch[1].trim());
      const id = saveTrip(data);
      notifications.push({ type: "saved", id, destination: data.destination });
    } catch (e) { console.error("SAVE_TRIP parse error", e); }
  }

  const editMatches = [...text.matchAll(/\[EDIT_TRIP:([^:]+):([^:]+):([^\]]+)\]/g)];
  for (const m of editMatches) {
    const [, tripId, field, value] = m;
    updateTripField(tripId.trim(), field.trim(), value.trim());
    notifications.push({ type: "edited" });
  }

  const deleteMatches = [...text.matchAll(/\[DELETE_TRIP:([^\]]+)\]/g)];
  for (const m of deleteMatches) {
    deleteTrip(m[1].trim());
    notifications.push({ type: "deleted" });
  }

  if (notifications.length > 0) {
    setTrips(getAllTrips());
  }

  return notifications;
}

// ─── Message renderer ───────────────────────────────────────────────────────

function cleanText(text) {
  return text
    .replace(/\[SAVE_TRIP\][\s\S]*?\[\/SAVE_TRIP\]/g, "")
    .replace(/\[EDIT_TRIP:[^\]]+\]/g, "")
    .replace(/\[DELETE_TRIP:[^\]]+\]/g, "")
    .replace(/\[HOTEL:[^\]]+\]/g, "")
    .replace(/\[FLIGHT:[^\]]+\]/g, "")
    .trim();
}

function HotelCard({ raw }) {
  const parts = raw.split("|");
  if (parts.length < 5) return null;
  const [name, stars, area, price, url] = parts;
  const starCount = parseInt(stars) || 3;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-2xl p-3 hover:bg-orange-100 transition-colors no-underline block mt-2">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: G }}>🏨</div>
      <div className="flex-1 min-w-0">
        <div className="font-black text-gray-900 text-sm truncate">{name}</div>
        <div className="text-xs text-gray-500 mt-0.5">{"⭐".repeat(starCount)} · {area}</div>
        <div className="text-xs font-bold text-orange-500 mt-1">From ${price}/night · Book →</div>
      </div>
    </a>
  );
}

function FlightCard({ raw }) {
  const parts = raw.split("|");
  if (parts.length < 6) return null;
  const [origin, dest, depart, ret, price, url] = parts;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-3 hover:bg-blue-100 transition-colors no-underline block mt-2">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-blue-500">✈️</div>
      <div className="flex-1 min-w-0">
        <div className="font-black text-gray-900 text-sm">{origin} → {dest}</div>
        <div className="text-xs text-gray-500 mt-0.5">{depart}{ret ? ` · Return: ${ret}` : ""}</div>
        <div className="text-xs font-bold text-blue-500 mt-1">From ~${price} · Search flights →</div>
      </div>
    </a>
  );
}

function MessageContent({ text }) {
  if (!text) return (
    <span className="inline-flex gap-1 items-center">
      <span className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </span>
  );

  const hotelMatches = [...text.matchAll(/\[HOTEL:([^\]]+)\]/g)];
  const flightMatches = [...text.matchAll(/\[FLIGHT:([^\]]+)\]/g)];
  const displayText = cleanText(text);

  return (
    <>
      <span className="whitespace-pre-wrap">{displayText}</span>
      {hotelMatches.map((m, i) => <HotelCard key={i} raw={m[1]} />)}
      {flightMatches.map((m, i) => <FlightCard key={i} raw={m[1]} />)}
    </>
  );
}

// ─── Quick prompts ──────────────────────────────────────────────────────────

// QUICK_PROMPTS moved inside component to use t()

// ─── Main component ─────────────────────────────────────────────────────────

function ChatContent() {
  const { t, lang } = useLanguage();
  const searchParams = useSearchParams();
  const initialTripId = searchParams.get("tripId");

  const QUICK_PROMPTS = [
    t("chat_quick_1"), t("chat_quick_2"), t("chat_quick_3"),
    t("chat_quick_4"), t("chat_quick_5"), t("chat_quick_6"),
  ];
  const INITIAL_MESSAGE = { role: "assistant", content: t("chat_initial_msg") };

  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(initialTripId || "");
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState(null);
  const [restoredAt, setRestoredAt] = useState(null); // timestamp of restored chat
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const allTrips = getAllTrips();
    setTrips(allTrips);

    // Try to restore saved chat
    const saved = loadChatHistory();
    if (saved && !initialTripId) {
      setMessages(saved.messages);
      if (saved.tripId) setSelectedTripId(saved.tripId);
      setRestoredAt(saved.savedAt);
    } else if (initialTripId && allTrips.find(tr => tr.id === initialTripId)) {
      setSelectedTripId(initialTripId);
      const trip = allTrips.find(tr => tr.id === initialTripId);
      const welcomeBack = { role: "assistant", content: t("chat_focused_greeting", { dest: trip.destination }) };
      setMessages([welcomeBack]);
    }
  }, []);

  // Update initial greeting when language changes (useState only runs once with initial lang)
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].role === "assistant") {
        return [{ role: "assistant", content: t("chat_initial_msg") }];
      }
      return prev;
    });
  }, [lang]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-save chat whenever messages change
  useEffect(() => {
    if (!mounted) return;
    saveChatHistory(messages, selectedTripId);
  }, [messages, selectedTripId, mounted]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function startFresh() {
    clearChatHistory();
    setMessages([INITIAL_MESSAGE]);
    setRestoredAt(null);
    setSelectedTripId("");
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setRestoredAt(null); // hide banner once they start chatting

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          trips,
          currentTripId: selectedTripId || null,
          language: lang,
        }),
      });

      if (!res.ok) throw new Error("Network error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                assistantText += parsed.text;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: assistantText };
                  return updated;
                });
              }
            } catch {}
          }
        }
      }

      const notifications = parseAndExecuteCommands(assistantText, setTrips);
      for (const n of notifications) {
        if (n.type === "saved") showToast(`✅ Trip to ${n.destination} saved!`);
        else if (n.type === "edited") showToast(`✅ Trip updated!`);
        else if (n.type === "deleted") showToast(`🗑️ Trip deleted.`);
      }

    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-orange-300 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-page)" }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-8 pb-3 max-w-2xl mx-auto w-full">
        <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-1">{t("ai_assistant_label")}</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-gray-900">{t("ai_chat_title")}</h1>
          <select
            value={selectedTripId}
            onChange={e => setSelectedTripId(e.target.value)}
            className="text-xs font-bold px-3 py-2 rounded-xl border-2 border-orange-100 bg-white text-gray-600 max-w-[160px] truncate"
          >
            <option value="">{t("no_trip_selected")}</option>
            {trips.map(trip => (
              <option key={trip.id} value={trip.id}>{trip.destination || "Untitled"}</option>
            ))}
          </select>
        </div>
        {selectedTrip && (
          <div className="mt-2 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 inline-flex items-center gap-1.5">
            📍 {selectedTrip.destination} · {selectedTrip.days} days
          </div>
        )}
      </div>

      {/* Restored chat banner */}
      {restoredAt && (
        <div className="px-4 max-w-2xl mx-auto w-full mb-2">
          <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-base">💬</span>
              <div>
                <p className="text-xs font-black text-orange-700">{t("continuing_conversation")}</p>
                <p className="text-xs text-orange-400">Saved {timeAgo(restoredAt)}</p>
              </div>
            </div>
            <button onClick={startFresh}
              className="text-xs font-bold text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-xl border border-gray-200 bg-white transition-colors">
              {t("start_fresh")}
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 max-w-2xl mx-auto w-full space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] ${m.role === "user" ? "order-1" : "order-2"}`}>
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-2xl flex items-center justify-center text-sm mb-1" style={{ background: G }}>🤖</div>
              )}
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "text-white font-medium rounded-tr-sm"
                    : "bg-white border border-orange-100 text-gray-800 rounded-tl-sm shadow-sm"
                }`}
                style={m.role === "user" ? { background: G } : {}}
              >
                {m.role === "assistant"
                  ? <MessageContent text={m.content} />
                  : m.content}
              </div>
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-white border border-orange-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <span className="inline-flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts — only on fresh chat */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 max-w-2xl mx-auto w-full">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {QUICK_PROMPTS.map(p => (
              <button key={p} onClick={() => sendMessage(p)}
                className="flex-shrink-0 text-xs font-bold px-3 py-2 rounded-xl bg-white border-2 border-orange-100 text-orange-500 hover:bg-orange-50 transition-colors whitespace-nowrap">
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 max-w-2xl mx-auto w-full">
        <div className="flex gap-2 bg-white rounded-2xl border-2 border-orange-100 p-2 shadow-sm">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder={t("chat_placeholder")}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-300 outline-none px-2 font-medium"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 disabled:opacity-40 transition-opacity"
            style={{ background: G }}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-orange-300 border-t-transparent animate-spin" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
