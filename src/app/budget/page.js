"use client";
import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/LanguageProvider";

const G = "linear-gradient(135deg,#f97316,#ec4899)";
const STYLES = [
  { key: "budget", label: "🎒 Budget", sub: "hostels, street food" },
  { key: "mid-range", label: "✈️ Mid-range", sub: "3★ hotels, local restaurants" },
  { key: "comfort", label: "🌟 Comfort", sub: "4★ hotels, nice dining" },
  { key: "luxury", label: "👑 Luxury", sub: "5★, fine dining" },
];

export default function BudgetPage() {
  const { lang } = useLanguage();
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(7);
  const [travelers, setTravelers] = useState(1);
  const [style, setStyle] = useState("mid-range");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function estimate() {
    if (!destination.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, days, travelers, style, language: lang }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setResult(data.data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg-page)" }}>
      <div className="px-4 pt-8 pb-4 max-w-lg mx-auto">
        <Link href="/" className="text-sm text-gray-400 font-bold mb-4 inline-block">← Back</Link>
        <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-1">✦ Smart Tool</p>
        <h1 className="text-3xl font-black" style={{ color: "var(--text-main)" }}>💰 Budget Estimator</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-sub)" }}>How much will your trip actually cost?</p>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-4">
        {/* Input */}
        <div className="rounded-2xl p-4 shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <label className="text-xs font-black text-orange-400 uppercase tracking-widest mb-2 block">🌍 Destination</label>
          <input value={destination} onChange={e => setDestination(e.target.value)}
            onKeyDown={e => e.key === "Enter" && estimate()}
            placeholder="Tokyo, Japan"
            className="w-full text-sm font-bold rounded-xl px-3 py-2.5 border-2 border-orange-100 focus:border-orange-300 focus:outline-none mb-3"
            style={{ background: "var(--bg-page)", color: "var(--text-main)" }}
          />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-black text-gray-400 mb-1 block">📅 Days</label>
              <input type="number" min="1" max="90" value={days} onChange={e => setDays(Number(e.target.value))}
                className="w-full text-sm font-bold rounded-xl px-3 py-2.5 border-2 border-orange-100 focus:border-orange-300 focus:outline-none"
                style={{ background: "var(--bg-page)", color: "var(--text-main)" }}
              />
            </div>
            <div>
              <label className="text-xs font-black text-gray-400 mb-1 block">👥 Travelers</label>
              <input type="number" min="1" max="20" value={travelers} onChange={e => setTravelers(Number(e.target.value))}
                className="w-full text-sm font-bold rounded-xl px-3 py-2.5 border-2 border-orange-100 focus:border-orange-300 focus:outline-none"
                style={{ background: "var(--bg-page)", color: "var(--text-main)" }}
              />
            </div>
          </div>
          <label className="text-xs font-black text-gray-400 mb-2 block">🎯 Style</label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {STYLES.map(s => (
              <button key={s.key} onClick={() => setStyle(s.key)}
                className="py-2 px-3 rounded-xl text-xs font-black text-left transition-all"
                style={style === s.key ? { background: G, color: "white" } : { background: "var(--bg-page)", color: "var(--text-sub)", border: "2px solid var(--border)" }}>
                <div>{s.label}</div>
                <div className="font-medium opacity-70 text-xs">{s.sub}</div>
              </button>
            ))}
          </div>
          <button onClick={estimate} disabled={loading || !destination.trim()}
            className="w-full py-3.5 rounded-2xl text-white font-black text-sm shadow-md disabled:opacity-50 transition-all"
            style={{ background: G }}>
            {loading ? "Estimating..." : "💰 Estimate My Budget →"}
          </button>
          {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
        </div>

        {/* Result */}
        {result && (
          <>
            <div className="rounded-2xl p-5 text-white shadow-lg" style={{ background: G }}>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Total Trip Estimate</p>
              <p className="text-4xl font-black">${result.total_min?.toLocaleString()} – ${result.total_max?.toLocaleString()}</p>
              <p className="text-white/70 text-sm mt-1">${result.per_day_min}–${result.per_day_max}/day · {travelers} traveler{travelers > 1 ? "s" : ""}</p>
              {travelers > 1 && (
                <p className="text-white/60 text-xs mt-1">~${Math.round(result.total_min / travelers).toLocaleString()}–${Math.round(result.total_max / travelers).toLocaleString()} per person</p>
              )}
            </div>

            <div className="rounded-2xl p-4 shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <h3 className="font-black text-sm mb-3" style={{ color: "var(--text-main)" }}>📊 Cost Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(result.breakdown || {}).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-start py-1.5 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <div>
                      <span className="text-sm font-bold capitalize" style={{ color: "var(--text-main)" }}>{key}</span>
                      {val.note && <span className="text-xs text-gray-400 ml-1">({val.note})</span>}
                    </div>
                    <span className="text-sm font-black text-orange-500">${val.min}–${val.max}</span>
                  </div>
                ))}
              </div>
            </div>

            {result.tips?.length > 0 && (
              <div className="rounded-2xl p-4 shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <h3 className="font-black text-sm mb-2" style={{ color: "var(--text-main)" }}>💡 Money-Saving Tips</h3>
                <div className="space-y-1.5">
                  {result.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-sub)" }}>
                      <span className="text-orange-400 mt-0.5">✓</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.verdict && (
              <div className="rounded-2xl p-4 bg-orange-50 border border-orange-100">
                <p className="text-sm font-bold text-orange-700">🤖 AI Verdict: {result.verdict}</p>
              </div>
            )}

            <Link href={`/plan`}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white font-black text-sm shadow-md"
              style={{ background: G }}>
              ✈️ Plan This Trip Now →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
