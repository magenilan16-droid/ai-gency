"use client";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/app/LanguageProvider";

const G = "linear-gradient(135deg,#f97316,#ec4899)";

const SUGGESTED_QUESTIONS = [
  "What are the best restaurants?",
  "Is it safe to travel there?",
  "What should I pack?",
  "What's the local currency?",
  "Any hidden gems?",
];

function buildContext(trip) {
  return `Trip: ${trip.days} days in ${trip.destination}, style: ${trip.style}, budget: ${trip.currency}${trip.total_estimated_cost}, travelers: ${trip.form?.travelers || 1}`;
}

function buildWelcomeMessage(trip) {
  return `Hi! I'm your AI travel assistant for your ${trip.days}-day trip to ${trip.destination}. Ask me anything — activities, food, weather, local tips, what to pack, safety, budget advice...`;
}

function LoadingDots() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "4px 0",
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#f97316",
            display: "inline-block",
            animation: "chatdot 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
            opacity: 0.7,
          }}
        />
      ))}
      <style>{`
        @keyframes chatdot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </span>
  );
}

export default function ChatTab({ trip }) {
  const { t, lang } = useLanguage();
  const storageKey = `aigency_tripchat_${trip?.id}`;

  const welcomeMessage = {
    role: "assistant",
    content: buildWelcomeMessage(trip),
    id: "welcome",
  };

  const [messages, setMessages] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // ignore
      }
    }
    return [welcomeMessage];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const hasUserMessage = messages.some((m) => m.role === "user");

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch {
        // ignore
      }
    }
  }, [messages, storageKey]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  async function sendMessage(text) {
    const userText = text.trim();
    if (!userText || loading) return;

    const userMsg = { role: "user", content: userText, id: Date.now() + "_u" };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setError(null);

    const history = updatedMessages
      .filter((m) => m.id !== "welcome")
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          currentTripId: trip.id,
          language: lang,
          history,
          context: buildContext(trip),
        }),
      });

      if (!res.ok) throw new Error("Network error");

      const data = await res.json();
      const aiContent =
        data.reply || data.message || data.content || "No response received.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiContent, id: Date.now() + "_a" },
      ]);
    } catch {
      setError("Sorry, couldn't connect. Try again.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, couldn't connect. Try again.",
          id: Date.now() + "_err",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleSend() {
    sendMessage(input);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClear() {
    setMessages([welcomeMessage]);
    setError(null);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }
  }

  function handleSuggestion(q) {
    sendMessage(q);
  }

  return (
    <div
      style={{
        background: "var(--bg-card, #fff)",
        borderRadius: 16,
        border: "1px solid var(--border, #e5e7eb)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        maxWidth: 700,
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px 10px",
          borderBottom: "1px solid var(--border, #f3f4f6)",
          background: "var(--bg-page, #f9fafb)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: G,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            🤖
          </span>
          <span
            style={{
              fontWeight: 600,
              fontSize: 15,
              color: "var(--text-main, #111827)",
            }}
          >
            Trip Assistant
          </span>
        </div>
        <button
          onClick={handleClear}
          style={{
            background: "none",
            border: "1px solid var(--border, #e5e7eb)",
            borderRadius: 8,
            padding: "4px 12px",
            fontSize: 13,
            color: "var(--text-sub, #6b7280)",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.background = "var(--bg-page, #f3f4f6)")
          }
          onMouseOut={(e) => (e.currentTarget.style.background = "none")}
        >
          {t("chat_clear") || "Clear"}
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          maxHeight: 400,
          overflowY: "auto",
          padding: "16px 14px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          background: "var(--bg-page, #f9fafb)",
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "10px 14px",
                borderRadius:
                  msg.role === "user"
                    ? "16px 16px 4px 16px"
                    : "16px 16px 16px 4px",
                background:
                  msg.role === "user"
                    ? G
                    : "var(--bg-card, #fff)",
                color:
                  msg.role === "user"
                    ? "#fff"
                    : msg.isError
                    ? "#ef4444"
                    : "var(--text-main, #111827)",
                border:
                  msg.role === "user"
                    ? "none"
                    : "1px solid #fff7ed",
                fontSize: 14,
                lineHeight: 1.6,
                boxShadow:
                  msg.role === "user"
                    ? "0 2px 8px rgba(249,115,22,0.15)"
                    : "0 1px 4px rgba(0,0,0,0.06)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                background: "var(--bg-card, #fff)",
                border: "1px solid #fff7ed",
                borderRadius: "16px 16px 16px 4px",
                padding: "10px 16px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <LoadingDots />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested questions — shown only before first user message */}
      {!hasUserMessage && (
        <div
          style={{
            padding: "8px 14px 4px",
            background: "var(--bg-page, #f9fafb)",
            borderTop: "1px solid var(--border, #f3f4f6)",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: "var(--text-sub, #9ca3af)",
              margin: "0 0 6px",
              fontWeight: 500,
            }}
          >
            {t("chat_suggestions") || "Quick questions:"}
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSuggestion(q)}
                disabled={loading}
                style={{
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                  borderRadius: 20,
                  padding: "5px 12px",
                  fontSize: 12,
                  color: "#c2410c",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                  opacity: loading ? 0.6 : 1,
                  whiteSpace: "nowrap",
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = "#ffedd5";
                    e.currentTarget.style.borderColor = "#fb923c";
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#fff7ed";
                  e.currentTarget.style.borderColor = "#fed7aa";
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "10px 14px 14px",
          borderTop: "1px solid var(--border, #f3f4f6)",
          background: "var(--bg-card, #fff)",
          alignItems: "center",
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("chat_placeholder") || "Ask anything about your trip..."}
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid var(--border, #e5e7eb)",
            fontSize: 14,
            background: "var(--bg-page, #f9fafb)",
            color: "var(--text-main, #111827)",
            outline: "none",
            transition: "border-color 0.15s",
            minWidth: 0,
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#f97316")}
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "var(--border, #e5e7eb)")
          }
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim() ? "#e5e7eb" : G,
            border: "none",
            borderRadius: 10,
            padding: "10px 18px",
            color: loading || !input.trim() ? "#9ca3af" : "#fff",
            fontWeight: 600,
            fontSize: 14,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            transition: "opacity 0.15s, background 0.15s",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          {t("chat_send") || "Send"}
        </button>
      </div>
    </div>
  );
}
