"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const G = "linear-gradient(135deg,#f97316,#ec4899)";

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

function saveActivity(tripId, dayIndex, activity) {
  const raw = localStorage.getItem(`aigency_trip_${tripId}`);
  if (!raw) return false;
  try {
    const trip = JSON.parse(raw);
    if (!trip.itinerary) trip.itinerary = [];
    if (!trip.itinerary[dayIndex]) {
      trip.itinerary[dayIndex] = { day: dayIndex + 1, activities: [] };
    }
    if (!Array.isArray(trip.itinerary[dayIndex].activities)) {
      trip.itinerary[dayIndex].activities = [];
    }
    trip.itinerary[dayIndex].activities.push(activity);
    localStorage.setItem(`aigency_trip_${tripId}`, JSON.stringify(trip));
    return true;
  } catch { return false; }
}

const QUICK_PROMPTS = [
  "What should I pack for my trip?",
  "Give me restaurant recommendations",
  "What are the best hidden gems?",
  "Help me optimize my budget",
  "Suggest activities for day 1",
  "What local customs should I know?",
];

function ChatContent() {
  const searchParams = useSearchParams();
  const initialTripId = searchParams.get("tripId");

  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(initialTripId || "");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey! 👋 I'm your AI travel assistant. I know all your saved trips and can help you plan activities, find hidden gems, optimize budgets, and more. What would you like to explore?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [saveModal, setSaveModal] = useState(null); // { text, dayIndex }
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const t = getAllTrips();
    setTrips(t);
    if (initialTripId && t.find(tr => tr.id === initialTripId)) {
      setSelectedTripId(initialTripId);
      const trip = t.find(tr => tr.id === initialTripId);
      setMessages([{
        role: "assistant",
        content: `Hey! 👋 I'm ready to help with your **${trip.destination}** trip (${trip.form?.startDate || "no date"} → ${trip.form?.endDate || ""}). What would you like to know or plan?`
      }]);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          trips,
          currentTripId: selectedTripId || null,
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
        const lines = chunk.split("\n");
        for (const line of lines) {
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
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSave(msgContent) {
    // parse saveable suggestions from message
    const lines = msgContent.split("\n").filter(l => l.trim());
    setSaveModal({ content: msgContent, lines });
  }

  function confirmSave(tripId, dayIndex, activityText) {
    const ok = saveActivity(tripId, dayIndex, { name: activityText, cost: 0, type: "ai_suggestion" });
    setSaveModal(null);
    if (ok) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `✅ Saved to your trip! Head to the trip page to see it.`
      }]);
    }
  }

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-orange-300 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FFF8F0" }}>
      {/* Header */}
      <div className="px-4 pt-8 pb-3 max-w-2xl mx-auto w-full">
        <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-1">✦ AI Assistant</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-gray-900">AI Chat</h1>
          {/* Trip selector */}
          <select
            value={selectedTripId}
            onChange={e => setSelectedTripId(e.target.value)}
            className="text-xs font-bold px-3 py-2 rounded-xl border-2 border-orange-100 bg-white text-gray-600 max-w-[160px] truncate"
          >
            <option value="">No trip selected</option>
            {trips.map(t => (
              <option key={t.id} value={t.id}>{t.destination || "Untitled"}</option>
            ))}
          </select>
        </div>
        {selectedTrip && (
          <div className="mt-2 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 inline-flex items-center gap-1.5">
            📍 Context: {selectedTrip.destination} · {selectedTrip.days} days
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 max-w-2xl mx-auto w-full space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] ${m.role === "user" ? "order-1" : "order-2"}`}>
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-2xl flex items-center justify-center text-sm mb-1 flex-shrink-0" style={{ background: G }}>🤖</div>
              )}
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "text-white font-medium rounded-tr-sm"
                    : "bg-white border border-orange-100 text-gray-800 rounded-tl-sm shadow-sm"
                }`}
                style={m.role === "user" ? { background: G } : {}}
              >
                {m.content || <span className="inline-flex gap-1 items-center"><span className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} /><span className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} /><span className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} /></span>}
              </div>
              {/* Save button for assistant messages with saveable content */}
              {m.role === "assistant" && m.content?.includes("[SAVEABLE SUGGESTION]") && selectedTripId && (
                <button
                  onClick={() => handleSave(m.content)}
                  className="mt-1.5 text-xs font-black px-3 py-1.5 rounded-xl text-white shadow-sm"
                  style={{ background: G }}
                >
                  💾 Save to Trip
                </button>
              )}
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

      {/* Quick prompts */}
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
            placeholder="Ask anything about your trip..."
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

      {/* Save modal */}
      {saveModal && selectedTrip && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6">
            <h3 className="font-black text-gray-900 mb-1">Save to Trip</h3>
            <p className="text-sm text-gray-400 mb-4">Choose which day to add this suggestion to <strong>{selectedTrip.destination}</strong></p>
            <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
              {Array.from({ length: selectedTrip.days || 3 }, (_, i) => (
                <button key={i}
                  onClick={() => confirmSave(selectedTripId, i, saveModal.content.slice(0, 120))}
                  className="w-full text-left px-4 py-3 rounded-xl border-2 border-orange-100 hover:border-orange-300 hover:bg-orange-50 transition-all text-sm font-bold text-gray-700">
                  Day {i + 1} {selectedTrip.itinerary?.[i]?.title ? `— ${selectedTrip.itinerary[i].title}` : ""}
                </button>
              ))}
            </div>
            <button onClick={() => setSaveModal(null)}
              className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-400 text-sm font-bold hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
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
