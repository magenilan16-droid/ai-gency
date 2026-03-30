"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/app/LanguageProvider";

const G = "linear-gradient(135deg,#f97316,#ec4899)";
const POPULAR = ["USD", "EUR", "GBP", "ILS", "JPY", "AUD", "THB", "SGD"];
const QUICK_AMOUNTS = [50, 100, 500, 1000];

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

const ALL_CURRENCIES = Object.keys(CURRENCY_FLAGS);

function getTodayStr() {
  return new Date().toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

function getISODate() {
  return new Date().toISOString().slice(0, 10);
}

function SkeletonBlock({ width = "100%", height = 20, radius = 8, style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
        ...style,
      }}
    />
  );
}

export default function CurrencyTab({ trip }) {
  const { t } = useLanguage();
  const base = trip?.currency || "USD";
  const [rates, setRates] = useState(null);
  const [rateDate, setRateDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState("100");
  const [fromCurrency, setFromCurrency] = useState(base);
  const [toCurrency, setToCurrency] = useState(null);

  const cacheKey = `aigency_currency_${base}_${getISODate()}`;

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
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

  // Pick default toCurrency once rates are loaded
  useEffect(() => {
    if (rates && !toCurrency) {
      const candidates = POPULAR.filter((c) => c !== base);
      setToCurrency(candidates[0] || null);
    }
  }, [rates, base, toCurrency]);

  const parsedAmount = parseFloat(amount) || 0;
  const convertedAmount = toCurrency && rates?.[toCurrency]
    ? (parsedAmount * rates[toCurrency]).toFixed(2)
    : null;
  const rate = toCurrency && rates?.[toCurrency] ? rates[toCurrency] : null;
  const reverseRate = rate ? (1 / rate).toFixed(4) : null;

  const displayRates = rates
    ? POPULAR.filter((c) => c !== base && rates[c] != null)
    : [];

  return (
    <div style={{ padding: "16px 0 48px", display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#111827", letterSpacing: -0.5, marginBottom: 2 }}>
          💱 Currency Converter
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>
          {getTodayStr()} {rateDate && !loading ? `· Rates: ${rateDate}` : ""}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Big rate skeleton */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "24px 20px", border: "1px solid #f3f4f6" }}>
            <SkeletonBlock width="60%" height={14} radius={6} style={{ marginBottom: 12 }} />
            <SkeletonBlock width="80%" height={44} radius={10} style={{ marginBottom: 8 }} />
            <SkeletonBlock width="50%" height={12} radius={6} />
          </div>
          {/* Input skeleton */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "20px", border: "1px solid #f3f4f6" }}>
            <SkeletonBlock width="40%" height={12} radius={6} style={{ marginBottom: 10 }} />
            <SkeletonBlock height={56} radius={12} style={{ marginBottom: 12 }} />
            <div style={{ display: "flex", gap: 8 }}>
              {[1,2,3,4].map(i => <SkeletonBlock key={i} width={56} height={32} radius={10} />)}
            </div>
          </div>
          {/* Grid skeleton */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "20px", border: "1px solid #f3f4f6" }}>
            <SkeletonBlock width="50%" height={14} radius={6} style={{ marginBottom: 14 }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {[1,2,3,4].map(i => <SkeletonBlock key={i} height={80} radius={12} />)}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, paddingTop: 4 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", border: "3px solid #fed7aa", borderTopColor: "#f97316", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>Fetching latest rates…</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div style={{ background: "#fff", borderRadius: 20, padding: "32px 20px", textAlign: "center", border: "1px solid #f3f4f6" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
          <p style={{ fontSize: 14, color: "#ef4444", fontWeight: 700, marginBottom: 4 }}>{error}</p>
          <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20 }}>Could not load exchange rates.</p>
          <button
            onClick={fetchRates}
            style={{ background: G, color: "#fff", border: "none", borderRadius: 12, padding: "10px 28px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}
          >
            {t("retry") || "Retry"}
          </button>
        </div>
      )}

      {/* Main converter */}
      {!loading && !error && rates && (
        <>
          {/* Big rate display */}
          {toCurrency && rate && (
            <div style={{ background: "#fff", borderRadius: 20, padding: "20px 20px 18px", border: "1px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                Current Rate
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, color: "#111827", letterSpacing: -1, marginBottom: 6 }}>
                1 {CURRENCY_FLAGS[base] || ""} {base} = {CURRENCY_FLAGS[toCurrency] || ""}{" "}
                <span style={{ color: "#f97316" }}>
                  {rate.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: toCurrency === "JPY" ? 0 : 4,
                  })}
                </span>{" "}
                {toCurrency}
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>
                1 {toCurrency} = {reverseRate} {base}
              </div>
            </div>
          )}

          {/* Amount input + quick amounts */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "20px", border: "1px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            {/* From / To selectors */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>From</label>
                <select
                  value={fromCurrency}
                  onChange={e => setFromCurrency(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "2px solid #f3f4f6",
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#111827",
                    background: "#f9fafb",
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                  }}
                >
                  {ALL_CURRENCIES.map(c => (
                    <option key={c} value={c}>{CURRENCY_FLAGS[c] || ""} {c} — {CURRENCY_NAMES[c]}</option>
                  ))}
                </select>
              </div>
              {/* Swap button */}
              <button
                onClick={() => {
                  const prev = fromCurrency;
                  setFromCurrency(toCurrency || base);
                  setToCurrency(prev);
                }}
                style={{ marginTop: 20, flexShrink: 0, width: 36, height: 36, borderRadius: 12, background: "#fff7ed", border: "2px solid #fed7aa", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ⇄
              </button>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>To</label>
                <select
                  value={toCurrency || ""}
                  onChange={e => setToCurrency(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "2px solid #fed7aa",
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#f97316",
                    background: "#fff7ed",
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                  }}
                >
                  {POPULAR.filter(c => c !== fromCurrency && rates[c] != null).map(c => (
                    <option key={c} value={c}>{CURRENCY_FLAGS[c] || ""} {c} — {CURRENCY_NAMES[c]}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Big amount input */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                Amount ({fromCurrency})
              </label>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "2px solid #fed7aa",
                  fontSize: 28,
                  fontWeight: 900,
                  color: "#111827",
                  background: "#fff7ed",
                  outline: "none",
                  boxSizing: "border-box",
                  textAlign: "center",
                  letterSpacing: -0.5,
                }}
              />
            </div>

            {/* Quick amount chips */}
            <div style={{ display: "flex", gap: 8 }}>
              {QUICK_AMOUNTS.map(q => (
                <button
                  key={q}
                  onClick={() => setAmount(String(q))}
                  style={{
                    flex: 1,
                    padding: "7px 4px",
                    borderRadius: 10,
                    border: "2px solid",
                    borderColor: parseFloat(amount) === q ? "#f97316" : "#f3f4f6",
                    background: parseFloat(amount) === q ? "#fff7ed" : "#f9fafb",
                    color: parseFloat(amount) === q ? "#f97316" : "#6b7280",
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Big result display */}
          {convertedAmount !== null && toCurrency && (
            <div style={{ background: "#fff", borderRadius: 20, padding: "22px 20px", border: "2px solid #fed7aa", boxShadow: "0 4px 16px rgba(249,115,22,0.08)" }}>
              <div style={{ fontSize: 12, color: "#f97316", fontWeight: 700, marginBottom: 6 }}>
                {parsedAmount.toLocaleString()} {CURRENCY_FLAGS[fromCurrency] || ""} {fromCurrency} =
              </div>
              <div style={{ fontSize: 40, fontWeight: 900, color: "#ea580c", letterSpacing: -1.5, lineHeight: 1.1 }}>
                {CURRENCY_FLAGS[toCurrency] || ""}{" "}
                {parseFloat(convertedAmount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#f97316", marginTop: 4 }}>{toCurrency}</div>
            </div>
          )}

          {/* Currency selector chips */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "16px 16px 12px", border: "1px solid #f3f4f6" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
              Quick select target
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {POPULAR.filter(c => c !== base && rates[c] != null).map(c => (
                <button
                  key={c}
                  onClick={() => setToCurrency(c)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 10,
                    border: "2px solid",
                    borderColor: toCurrency === c ? "#f97316" : "#f3f4f6",
                    background: toCurrency === c ? "#fff7ed" : "#f9fafb",
                    color: toCurrency === c ? "#f97316" : "#6b7280",
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {CURRENCY_FLAGS[c] || ""} {c}
                </button>
              ))}
            </div>
          </div>

          {/* Rates Grid */}
          {displayRates.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 20, padding: "20px", border: "1px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 14 }}>
                1 {CURRENCY_FLAGS[base] || ""} {base} equals…
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                {displayRates.map(cur => (
                  <div
                    key={cur}
                    onClick={() => setToCurrency(cur)}
                    style={{
                      background: toCurrency === cur ? "#fff7ed" : "#f9fafb",
                      borderRadius: 14,
                      padding: "12px 14px",
                      border: "2px solid",
                      borderColor: toCurrency === cur ? "#f97316" : "transparent",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 3 }}>{CURRENCY_FLAGS[cur] || "💱"}</div>
                    <div style={{ fontSize: 17, fontWeight: 900, color: "#111827", letterSpacing: -0.3 }}>
                      {rates[cur]?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: cur === "JPY" ? 0 : 4,
                      })}
                    </div>
                    <div style={{ fontSize: 11, color: toCurrency === cur ? "#f97316" : "#9ca3af", fontWeight: 700 }}>{cur}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>{CURRENCY_NAMES[cur] || cur}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
