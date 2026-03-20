"use client";
import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/LanguageProvider";

const G = "linear-gradient(135deg,#f97316,#ec4899)";

export default function ComparePage() {
  const { lang } = useLanguage();
  const [dest1, setDest1] = useState("");
  const [dest2, setDest2] = useState("");
  const [days, setDays] = useState(7);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function compare() {
    if (!dest1.trim() || !dest2.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dest1, dest2, days, language: lang }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setResult(data.data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const DestCard = ({ dest, isWinner }) => (
    <div className="flex-1 rounded-2xl border-2 p-4 transition-all"
      style={{ borderColor: isWinner ? "#f97316" : "var(--border)", background: isWinner ? "#fff7ed" : "var(--bg-card)" }}>
      {isWinner && <div className="text-xs font-black text-orange-500 mb-2 flex items-center gap-1">🏆 AI Pick</div>}
      <div className="text-3xl mb-1">{dest.emoji}</div>
      <h3 className="font-black text-sm mb-3" style={{ color: "var(--text-main)" }}>{dest.name}</h3>
      <div className="space-y-2">
        {[
          { icon: "💰", label: "Cost", value: dest.cost_estimate },
          { icon: "🛂", label: "Visa (IL)", value: dest.visa_israelis },
          { icon: "🛡️", label: "Safety", value: dest.safety },
          { icon: "🌤️", label: "Weather", value: dest.weather },
          { icon: "❤️", label: "Best for", value: dest.best_for },
          { icon: "⚠️", label: "Downside", value: dest.downside },
        ].map((row, i) => (
          <div key={i} className="text-xs">
            <span className="font-bold text-gray-400">{row.icon} {row.label}: </span>
            <span style={{ color: "var(--text-main)" }}>{row.value}</span>
          </div>
        ))}
        {dest.highlights?.length > 0 && (
          <div className="mt-2">
            <div className="text-xs font-bold text-gray-400 mb-1">✨ Highlights</div>
            {dest.highlights.map((h, i) => (
              <div key={i} className="text-xs text-orange-500 font-bold">• {h}</div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-gray-400">AI Score</span>
          <span className="text-lg font-black" style={{ color: isWinner ? "#f97316" : "var(--text-main)" }}>{dest.score}/10</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg-page)" }}>
      <div className="px-4 pt-8 pb-4 max-w-lg mx-auto">
        <Link href="/" className="text-sm text-gray-400 font-bold mb-4 inline-block">← Back</Link>
        <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-1">✦ Smart Tool</p>
        <h1 className="text-3xl font-black" style={{ color: "var(--text-main)" }}>⚖️ Compare Destinations</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-sub)" }}>AI picks the winner for your trip</p>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-4">
        <div className="rounded-2xl p-4 shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-black text-orange-400 mb-1 block">📍 Destination 1</label>
              <input value={dest1} onChange={e => setDest1(e.target.value)}
                placeholder="Tokyo, Japan"
                className="w-full text-sm font-bold rounded-xl px-3 py-2.5 border-2 border-orange-100 focus:border-orange-300 focus:outline-none"
                style={{ background: "var(--bg-page)", color: "var(--text-main)" }}
              />
            </div>
            <div>
              <label className="text-xs font-black text-orange-400 mb-1 block">📍 Destination 2</label>
              <input value={dest2} onChange={e => setDest2(e.target.value)}
                placeholder="Bali, Indonesia"
                className="w-full text-sm font-bold rounded-xl px-3 py-2.5 border-2 border-orange-100 focus:border-orange-300 focus:outline-none"
                style={{ background: "var(--bg-page)", color: "var(--text-main)" }}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-black text-gray-400 mb-1 block">📅 Trip Length: {days} days</label>
            <input type="range" min="3" max="30" value={days} onChange={e => setDays(Number(e.target.value))}
              className="w-full accent-orange-500" />
          </div>
          <button onClick={compare} disabled={loading || !dest1.trim() || !dest2.trim()}
            className="w-full py-3.5 rounded-2xl text-white font-black text-sm shadow-md disabled:opacity-50"
            style={{ background: G }}>
            {loading ? "Comparing..." : "⚖️ Compare Now →"}
          </button>
          {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
        </div>

        {result && (
          <>
            <div className="flex gap-3">
              <DestCard dest={result.dest1} isWinner={result.winner === "dest1"} />
              <DestCard dest={result.dest2} isWinner={result.winner === "dest2"} />
            </div>

            {result.verdict && (
              <div className="rounded-2xl p-4" style={{ background: G }}>
                <p className="text-white font-bold text-sm">🤖 {result.verdict}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Link href={`/plan?dest=${encodeURIComponent(dest1)}`}
                className="flex items-center justify-center py-3 rounded-2xl font-black text-sm border-2 border-orange-200 text-orange-500">
                Plan {result.dest1?.emoji} {dest1.split(",")[0]}
              </Link>
              <Link href={`/plan?dest=${encodeURIComponent(dest2)}`}
                className="flex items-center justify-center py-3 rounded-2xl font-black text-sm border-2 border-orange-200 text-orange-500">
                Plan {result.dest2?.emoji} {dest2.split(",")[0]}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
