"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/app/LanguageProvider";

const G = "linear-gradient(135deg,#f97316,#ec4899)";
const POPULAR = ["USD", "EUR", "GBP", "ILS", "JPY", "AUD", "THB", "SGD"];

const CURRENCY_FLAGS = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", ILS: "🇮🇱",
  JPY: "🇯🇵", AUD: "🇦🇺", THB: "🇹🇭", SGD: "🇸🇬",
  CAD: "🇨🇦", CHF: "🇨🇭", CNY: "🇨🇳", MXN: "🇲🇽",
};

const CURRENCY_NAMES = {
  USD: "US Dollar", EUR: "Euro", GBP: "British Pound", ILS: "Israeli Shekel",
  JPY: "Japanese Yen", AUD: "Australian Dollar", THB: "Thai Baht", SGD: "Singapore Dollar",
  CAD: "Canadian Dollar", CHF: "Swiss Franc", CNY: "Chinese Yuan", MXN: "Mexican Peso",
};

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function CurrencyTab({ trip }) {
  const { t } = useLanguage();
  const base = trip?.currency || "USD";
  const [rates, setRates] = useState(null);
  const [rateDate, setRateDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState("100");
  const [convertTo, setConvertTo] = useState(null);

  const cacheKey = `aigency_currency_${base}_${getTodayStr()}`;

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Check localStorage cache (1 day)
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.rates) {
            setRates(parsed.rates);
            setRateDate(parsed.date || null);
            setLoading(false);
            return;
          }
        }
      } catch {}

      const targets = POPULAR.filter((c) => c !== base).join(",");
      const res = await fetch(`/api/currency?from=${base}&to=${targets}`);
      if (!res.ok) throw new Error(`Currency API error: ${res.status}`);
      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "Failed to fetch rates");

      setRates(data.rates);
      setRateDate(data.date || null);

      try {
        localStorage.setItem(cacheKey, JSON.stringify({ rates: data.rates, date: data.date }));
      } catch {}
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [base, cacheKey]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Pick a default convertTo once rates are loaded
  useEffect(() => {
    if (rates && !convertTo) {
      const candidates = POPULAR.filter((c) => c !== base);
      setConvertTo(candidates[0] || null);
    }
  }, [rates, base, convertTo]);

  const parsedAmount = parseFloat(amount) || 0;
  const convertedAmount = convertTo && rates?.[convertTo]
    ? (parsedAmount * rates[convertTo]).toFixed(2)
    : null;
  const reverseAmount = convertTo && rates?.[convertTo] && parsedAmount > 0
    ? (1 / rates[convertTo]).toFixed(4)
    : null;

  const displayRates = rates
    ? POPULAR.filter((c) => c !== base && rates[c] != null)
    : [];

  return (
    <div style={{ padding: "16px 0 40px", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header Card */}
      <div
        style={{
          background: G,
          borderRadius: 20,
          padding: "20px 20px 16px",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.85, marginBottom: 4 }}>
          {t("currency_tab_title") || "Live Exchange Rates"}
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>
          {CURRENCY_FLAGS[base] || "💱"} {base}
        </div>
        {rateDate && (
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 6 }}>
            {t("currency_last_updated") || "Updated"}: {rateDate}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div
          style={{
            background: "var(--bg-card, #fff)",
            borderRadius: 20,
            padding: "40px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "4px solid #fed7aa",
              borderTopColor: "#f97316",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: 13, color: "var(--text-sub, #9ca3af)", fontWeight: 600 }}>
            Fetching latest rates…
          </p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div
          style={{
            background: "var(--bg-card, #fff)",
            borderRadius: 20,
            padding: "28px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
          <p style={{ fontSize: 13, color: "#ef4444", fontWeight: 700, marginBottom: 4 }}>
            {error}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-sub, #9ca3af)", marginBottom: 16 }}>
            Could not load exchange rates.
          </p>
          <button
            onClick={fetchRates}
            style={{
              background: G,
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "10px 24px",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {t("retry") || "Retry"}
          </button>
        </div>
      )}

      {/* Converter Card */}
      {!loading && !error && rates && (
        <div
          style={{
            background: "var(--bg-card, #fff)",
            borderRadius: 20,
            padding: "20px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "var(--text-main, #111827)",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 8,
                background: G,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                color: "#fff",
              }}
            >
              ⇄
            </span>
            {t("currency_converter") || "Converter"}
          </div>

          {/* Amount input */}
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-sub, #9ca3af)",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {t("currency_amount") || "Amount"} ({base})
            </label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "2px solid #fed7aa",
                fontSize: 18,
                fontWeight: 800,
                color: "var(--text-main, #111827)",
                background: "#fff7ed",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Convert-to selector */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-sub, #9ca3af)",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Convert To
            </label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {POPULAR.filter((c) => c !== base && rates[c] != null).map((c) => (
                <button
                  key={c}
                  onClick={() => setConvertTo(c)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 10,
                    border: "2px solid",
                    borderColor: convertTo === c ? "#f97316" : "#f3f4f6",
                    background: convertTo === c ? "#fff7ed" : "var(--bg-page, #f9fafb)",
                    color: convertTo === c ? "#f97316" : "var(--text-sub, #6b7280)",
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {CURRENCY_FLAGS[c] || ""} {c}
                </button>
              ))}
            </div>
          </div>

          {/* Result */}
          {convertedAmount !== null && convertTo && (
            <div
              style={{
                background: "#fff7ed",
                borderRadius: 14,
                padding: "14px 16px",
                border: "2px solid #fed7aa",
              }}
            >
              <div style={{ fontSize: 12, color: "#f97316", fontWeight: 700, marginBottom: 4 }}>
                {parsedAmount.toLocaleString()} {base} =
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#ea580c", letterSpacing: -0.5 }}>
                {CURRENCY_FLAGS[convertTo] || ""}{" "}
                {parseFloat(convertedAmount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                {convertTo}
              </div>
              {reverseAmount && (
                <div style={{ fontSize: 11, color: "var(--text-sub, #9ca3af)", marginTop: 6 }}>
                  1 {convertTo} = {reverseAmount} {base}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Rates Grid */}
      {!loading && !error && displayRates.length > 0 && (
        <div
          style={{
            background: "var(--bg-card, #fff)",
            borderRadius: 20,
            padding: "20px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "var(--text-main, #111827)",
              marginBottom: 14,
            }}
          >
            1 {base} equals…
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 10,
            }}
          >
            {displayRates.map((cur) => (
              <div
                key={cur}
                style={{
                  background: "var(--bg-page, #f9fafb)",
                  borderRadius: 14,
                  padding: "12px 14px",
                  border: "2px solid",
                  borderColor: convertTo === cur ? "#f97316" : "transparent",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                onClick={() => setConvertTo(cur)}
              >
                <div style={{ fontSize: 18, marginBottom: 2 }}>{CURRENCY_FLAGS[cur] || "💱"}</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: "var(--text-main, #111827)" }}>
                  {rates[cur]?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: cur === "JPY" ? 0 : 4,
                  })}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-sub, #9ca3af)", fontWeight: 700 }}>
                  {cur}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-sub, #9ca3af)" }}>
                  {CURRENCY_NAMES[cur] || cur}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
