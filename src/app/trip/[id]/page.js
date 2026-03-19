"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getTrip, updateTrip, generateId } from "@/lib/trips";
import { useLanguage } from "@/app/LanguageProvider";

// ─── Themes ───────────────────────────────────────────────────────────────────
const DEST_THEMES = {
  japan:      { g: ["#FF6B6B","#FF8E53"], e: "🗾", hi: "Konnichiwa!" },
  tokyo:      { g: ["#FF6B6B","#FF8E53"], e: "🗼", hi: "Konnichiwa!" },
  paris:      { g: ["#667eea","#764ba2"], e: "🗼", hi: "Bonjour!" },
  france:     { g: ["#667eea","#764ba2"], e: "🇫🇷", hi: "Bonjour!" },
  italy:      { g: ["#11998e","#38ef7d"], e: "🇮🇹", hi: "Benvenuto!" },
  rome:       { g: ["#f7971e","#ffd200"], e: "🏛️", hi: "When in Rome!" },
  greece:     { g: ["#2980B9","#6DD5FA"], e: "🏛️", hi: "Kalimera!" },
  spain:      { g: ["#ee0979","#ff6a00"], e: "🇪🇸", hi: "¡Hola!" },
  thailand:   { g: ["#f7971e","#ffd200"], e: "🐘", hi: "Sawasdee!" },
  bali:       { g: ["#11998e","#38ef7d"], e: "🌺", hi: "Om Swastiastu!" },
  "new york": { g: ["#4776E6","#8E54E9"], e: "🗽", hi: "Welcome to NYC!" },
  london:     { g: ["#4776E6","#8E54E9"], e: "🎡", hi: "Cheerio!" },
  dubai:      { g: ["#f7971e","#ffd200"], e: "🏙️", hi: "Welcome!" },
  australia:  { g: ["#f46b45","#eea849"], e: "🦘", hi: "G'day!" },
  israel:     { g: ["#2980B9","#6DD5FA"], e: "🕍", hi: "Shalom!" },
  "tel aviv": { g: ["#11998e","#38ef7d"], e: "🏖️", hi: "Shalom!" },
  albania:    { g: ["#E31937","#000000"], e: "🦅", hi: "Mirë se vini!" },
  tirana:     { g: ["#E31937","#000000"], e: "🦅", hi: "Mirë se vini!" },
  portugal:   { g: ["#009246","#CF2B37"], e: "🇵🇹", hi: "Olá!" },
  lisbon:     { g: ["#f97316","#eab308"], e: "🎵", hi: "Olá!" },
  morocco:    { g: ["#c1272d","#006233"], e: "🕌", hi: "Marhaba!" },
  iceland:    { g: ["#2980B9","#6DD5FA"], e: "🌋", hi: "Halló!" },
  vietnam:    { g: ["#da020e","#f7971e"], e: "🍜", hi: "Xin chào!" },
  mexico:     { g: ["#006847","#CE1126"], e: "🌮", hi: "¡Hola!" },
  peru:       { g: ["#D91023","#f7971e"], e: "🏔️", hi: "¡Hola!" },
  argentina:  { g: ["#74acdf","#ffffff"], e: "🥩", hi: "¡Hola!" },
  brazil:     { g: ["#009c3b","#ffdf00"], e: "🌴", hi: "Olá!" },
  egypt:      { g: ["#f7971e","#ffd200"], e: "🏺", hi: "Ahlan!" },
  turkey:     { g: ["#E30A17","#ffffff"], e: "🕌", hi: "Merhaba!" },
  istanbul:   { g: ["#E30A17","#f7971e"], e: "🕌", hi: "Merhaba!" },
  singapore:  { g: ["#EF3340","#ffffff"], e: "🦁", hi: "Selamat datang!" },
  default:    { g: ["#f97316","#ec4899"], e: "🌍", hi: "Adventure awaits!" },
};

const STYLE_THEMES = {
  adventure: { g: ["#f97316","#ef4444"] },
  relaxed:   { g: ["#0d9488","#0ea5e9"] },
  cultural:  { g: ["#7c3aed","#6366f1"] },
  luxury:    { g: ["#d97706","#f59e0b"] },
  nightlife: { g: ["#a21caf","#ec4899"] },
  culinary:  { g: ["#16a34a","#0d9488"] },
};

function getTheme(dest, style) {
  if (dest) {
    const k = dest.toLowerCase();
    for (const [key, val] of Object.entries(DEST_THEMES)) {
      if (key !== "default" && k.includes(key)) return val;
    }
  }
  if (style && STYLE_THEMES[style]) return { ...DEST_THEMES.default, ...STYLE_THEMES[style] };
  return DEST_THEMES.default;
}

const STYLE_ICONS = { adventure:"🧗", relaxed:"🏖️", cultural:"🏛️", luxury:"✨", nightlife:"🎉", culinary:"🍽️" };
const TIME_STYLE  = {
  morning:   { bg:"#fff7ed", text:"#ea580c" },
  afternoon: { bg:"#fdf4ff", text:"#9333ea" },
  evening:   { bg:"#eff6ff", text:"#2563eb" },
};

// ─── Editable ─────────────────────────────────────────────────────────────────
function Editable({ value, onChange, className = "", multiline = false, placeholder = "Click to edit..." }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);
  function done() { setEditing(false); if (local !== value) onChange(local); }
  if (editing) {
    const cls = "w-full bg-orange-50 border-2 border-orange-300 rounded-xl px-3 py-2 outline-none text-sm text-gray-900 font-medium " + className;
    return multiline
      ? <textarea autoFocus rows={2} value={local} onChange={e => setLocal(e.target.value)} onBlur={done} className={cls} />
      : <input autoFocus type="text" value={local} onChange={e => setLocal(e.target.value)} onBlur={done} onKeyDown={e => e.key === "Enter" && done()} className={cls} />;
  }
  return (
    <span onClick={() => setEditing(true)} className={"cursor-text hover:bg-orange-50 rounded-lg px-1 -mx-1 transition-colors border border-dashed border-transparent hover:border-orange-200 " + className} title="Click to edit">
      {value || <span className="text-gray-300 italic">{placeholder}</span>}
    </span>
  );
}
function EditableNumber({ value, onChange, prefix = "", className = "" }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);
  function done() { setEditing(false); const n = Number(local); if (!isNaN(n)) onChange(n); }
  if (editing) return <input autoFocus type="number" min="0" value={local} onChange={e => setLocal(e.target.value)} onBlur={done} onKeyDown={e => e.key === "Enter" && done()} className={"w-24 bg-orange-50 border-2 border-orange-300 rounded-lg px-2 py-1 outline-none text-sm font-bold " + className} />;
  return <span onClick={() => setEditing(true)} className={"cursor-text hover:bg-orange-50 rounded-lg px-1 -mx-1 transition-colors border border-dashed border-transparent hover:border-orange-200 font-bold " + className} title="Click to edit">{prefix}{value?.toLocaleString()}</span>;
}

// ─── AI Chat Panel (overlay) ──────────────────────────────────────────────────
function AIChatPanel({ trip, onClose }) {
  const G = "linear-gradient(135deg,#f97316,#ec4899)";
  const [msgs, setMsgs] = useState([{ role: "assistant", content: `Hey! 👋 I know all about your **${trip.destination}** trip. Ask me anything!` }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const QUICK = ["Best restaurants nearby?", "What to pack?", "Hidden gems?", "Is it safe?", "Best photo spots?"];

  async function send(text) {
    if (!text.trim() || loading) return;
    const newMsgs = [...msgs, { role: "user", content: text }];
    setMsgs(newMsgs); setInput(""); setLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs, trips: [{ ...trip, id: "current" }], currentTripId: "current" }) });
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let txt = "";
      setMsgs(prev => [...prev, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try { const p = JSON.parse(line.slice(6)); if (p.text) { txt += p.text; setMsgs(prev => { const u=[...prev]; u[u.length-1]={role:"assistant",content:txt}; return u; }); } } catch {}
          }
        }
      }
    } catch { setMsgs(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--bg-page)" }}>
      <div className="flex items-center gap-3 px-4 pt-8 pb-4 bg-white border-b border-orange-100">
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-400 font-black text-lg">←</button>
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg" style={{ background: G }}>🤖</div>
        <div><div className="font-black text-gray-900 text-sm">AI Assistant</div><div className="text-xs text-gray-400">{trip.destination}</div></div>
        <Link href={`/chat?tripId=${trip.id || ""}`} className="ml-auto text-xs font-bold text-orange-500 border-2 border-orange-100 px-3 py-1.5 rounded-xl hover:bg-orange-50">Full Chat →</Link>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role==="user" ? "text-white rounded-tr-sm" : "bg-white border border-orange-100 text-gray-800 rounded-tl-sm shadow-sm"}`} style={m.role==="user"?{background:G}:{}}>
              {m.content || <span className="inline-flex gap-1"><span className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-bounce"/><span className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-bounce" style={{animationDelay:"150ms"}}/><span className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-bounce" style={{animationDelay:"300ms"}}/></span>}
            </div>
          </div>
        ))}
      </div>
      {msgs.length <= 1 && <div className="px-4 pb-2"><div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{QUICK.map(q=><button key={q} onClick={()=>send(q)} className="flex-shrink-0 text-xs font-bold px-3 py-2 rounded-xl bg-white border-2 border-orange-100 text-orange-500 whitespace-nowrap">{q}</button>)}</div></div>}
      <div className="px-4 pb-6 pt-2">
        <div className="flex gap-2 bg-white rounded-2xl border-2 border-orange-100 p-2 shadow-sm">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();send(input);}}} placeholder="Ask anything..." disabled={loading} className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-300 outline-none px-2 font-medium"/>
          <button onClick={()=>send(input)} disabled={loading||!input.trim()} className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black disabled:opacity-40" style={{background:G}}>↑</button>
        </div>
      </div>
    </div>
  );
}

// ─── Day Suggestions ──────────────────────────────────────────────────────────
function DaySuggestions({ trip, dayIndex, onApply, onClose }) {
  const G = "linear-gradient(135deg,#f97316,#ec4899)";
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const day = trip.daily_itinerary?.[dayIndex];

  useEffect(() => {
    fetch("/api/suggest", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ type:"regenerate_day", trip, dayIndex }) })
      .then(r=>r.json()).then(r=>{ if(r.ok) setSuggestions(Array.isArray(r.data)?r.data:[]); }).finally(()=>setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg mx-auto p-6 max-h-[80vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div><div className="font-black text-gray-900">✨ AI Suggestions</div><div className="text-xs text-gray-400">Day {day?.day} — {day?.title}</div></div>
          <button onClick={onClose} className="text-gray-400 font-black text-xl w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">×</button>
        </div>
        {loading ? <div className="flex flex-col items-center py-10 gap-3"><div className="w-10 h-10 rounded-full border-4 border-orange-300 border-t-transparent animate-spin"/><p className="text-sm text-gray-400">Getting alternatives...</p></div>
          : !suggestions?.length ? <p className="text-center py-8 text-gray-400 text-sm">No suggestions available.</p>
          : <div className="space-y-3">{suggestions.map((s,i)=>{const ts=TIME_STYLE[s.time]||TIME_STYLE.morning; return (
            <div key={i} className="border-2 border-orange-100 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-1 rounded-full" style={{background:ts.bg,color:ts.text}}>{s.time?.charAt(0).toUpperCase()+s.time?.slice(1)}</span>
                <span className="text-xs font-bold text-gray-400">{trip.currency} {s.estimated_cost}</span>
              </div>
              <div className="font-black text-gray-900 text-sm mb-1">{s.name}</div>
              <p className="text-xs text-gray-400 mb-3">{s.description}</p>
              <button onClick={()=>{onApply(s);onClose();}} className="w-full py-2 rounded-xl text-white text-xs font-black" style={{background:G}}>+ Add to Day {day?.day}</button>
            </div>);})}</div>}
      </div>
    </div>
  );
}

// ─── Currency Widget ──────────────────────────────────────────────────────────
function CurrencyWidget({ baseCurrency, amount }) {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  async function fetchRates() {
    if (rates) { setOpen(o=>!o); return; }
    setLoading(true);
    try { const res=await fetch(`/api/currency?from=${baseCurrency||"USD"}`); const data=await res.json(); if(data.ok) setRates(data.rates); } catch {}
    finally { setLoading(false); setOpen(true); }
  }
  const SHOW = ["EUR","GBP","ILS","JPY","AUD","CAD","THB","SGD"];
  const filtered = rates ? Object.entries(rates).filter(([k])=>SHOW.includes(k)) : [];
  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
      <button onClick={fetchRates} className="w-full flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2"><span className="text-lg">💱</span><span className="font-black text-gray-900 text-sm">Currency Converter</span></div>
        {loading ? <div className="w-4 h-4 rounded-full border-2 border-orange-300 border-t-transparent animate-spin"/> : <span className="text-gray-400 text-sm">{open?"▲":"▼"}</span>}
      </button>
      {open && <div className="px-4 pb-4 border-t border-orange-50">
        {loading ? <div className="py-3 text-sm text-gray-400">Fetching live rates...</div>
          : filtered.length > 0 ? <>
            <p className="text-xs text-gray-400 py-2">{baseCurrency} {amount?.toLocaleString()} equals:</p>
            <div className="grid grid-cols-2 gap-2">{filtered.map(([c,rate])=>(
              <div key={c} className="flex justify-between items-center px-3 py-2 bg-orange-50 rounded-xl">
                <span className="text-xs font-bold text-gray-500">{c}</span>
                <span className="text-sm font-black text-gray-900">{(amount*rate).toLocaleString(undefined,{maximumFractionDigits:0})}</span>
              </div>
            ))}</div>
            <p className="text-xs text-gray-300 mt-2 text-center">Live rates · Not financial advice</p>
          </> : <p className="text-sm text-red-400 py-2">Could not load rates.</p>}
      </div>}
    </div>
  );
}

// ─── Booking Section ──────────────────────────────────────────────────────────
function BookingSection({ trip }) {
  const city = encodeURIComponent(trip.destination?.split(",")[0] || "");
  const checkin = trip.form?.startDate || "";
  const checkout = trip.form?.endDate || "";
  const adults = trip.travelers || 2;
  const MARKER = "712006";
  const links = [
    { icon:"✈️", label:"Flights", sub:"Aviasales", color:"linear-gradient(135deg,#4776E6,#8E54E9)",
      href:`https://www.aviasales.com/?marker=${MARKER}&origin=TLV&destination=${trip.destination?.slice(0,3).toUpperCase()}&depart_date=${checkin}&return_date=${checkout}&adults=${adults}` },
    { icon:"🏨", label:"Hotels", sub:"Booking.com", color:"linear-gradient(135deg,#003580,#0ea5e9)",
      href:`https://www.booking.com/search.html?ss=${city}&checkin=${checkin}&checkout=${checkout}&group_adults=${adults}&aid=1269762&label=tp-${MARKER}` },
    { icon:"🎭", label:"Activities", sub:"GetYourGuide", color:"linear-gradient(135deg,#FF6B35,#F7931A)",
      href:`https://www.getyourguide.com/s/?q=${city}&date_from=${checkin}&date_to=${checkout}&utm_source=partner&partner_id=TY2AC55` },
    { icon:"🚗", label:"Car Rental", sub:"RentalCars", color:"linear-gradient(135deg,#10b981,#0ea5e9)",
      href:`https://www.rentalcars.com/?affiliateCode=travelpay&puLocation=${city}&puDay=${checkin}&doDay=${checkout}&marker=${MARKER}` },
  ];
  return (
    <section>
      <h2 className="text-lg font-black text-gray-900 mb-3">✈️ Book Your Trip</h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {links.map(b=>(
          <a key={b.label} href={b.href} target="_blank" rel="noopener noreferrer"
            className="rounded-2xl p-4 text-white shadow-md hover:-translate-y-0.5 transition-all" style={{background:b.color}}>
            <div className="text-2xl mb-2">{b.icon}</div>
            <div className="font-black text-sm">{b.label}</div>
            <div className="text-white/70 text-xs mt-0.5">{b.sub}</div>
          </a>
        ))}
      </div>
      <CurrencyWidget baseCurrency={trip.currency} amount={trip.total_estimated_cost} />
    </section>
  );
}

// ─── Weather Widget ───────────────────────────────────────────────────────────
function WeatherWidget({ destination, startDate, endDate }) {
  const { t } = useLanguage();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function load() {
    if (weather) { setOpen(o => !o); return; }
    setOpen(true);
    setLoading(true);
    try {
      // Step 1: geocode the destination
      const geo = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination?.split(",")[0] || "")}&count=1`
      ).then(r => r.json());
      const loc = geo.results?.[0];
      if (!loc) throw new Error("Location not found");

      // Step 2: get weather forecast
      const start = startDate || new Date().toISOString().split("T")[0];
      const end = endDate || start;
      const wx = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_mean,weathercode&start_date=${start}&end_date=${end}&timezone=auto`
      ).then(r => r.json());
      setWeather({ loc, daily: wx.daily });
    } catch { setWeather(null); }
    finally { setLoading(false); }
  }

  // WMO weather codes to emoji
  function wxEmoji(code) {
    if (code <= 1) return "☀️";
    if (code <= 3) return "⛅";
    if (code <= 49) return "🌫️";
    if (code <= 59) return "🌧️";
    if (code <= 69) return "❄️";
    if (code <= 79) return "🌨️";
    if (code <= 82) return "🌧️";
    if (code <= 99) return "⛈️";
    return "🌡️";
  }

  const days = weather?.daily?.time || [];

  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
      <button onClick={load} className="w-full flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌤️</span>
          <span className="font-black text-gray-900 text-sm">{t("weather_forecast")}</span>
        </div>
        {loading
          ? <div className="w-4 h-4 rounded-full border-2 border-orange-300 border-t-transparent animate-spin"/>
          : <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>}
      </button>
      {open && !loading && (
        <div className="px-4 pb-4 border-t border-orange-50">
          {!weather ? (
            <p className="text-sm text-gray-400 py-3 text-center">Could not load weather.</p>
          ) : (
            <>
              <p className="text-xs text-gray-400 py-2">{weather.loc.name}, {weather.loc.country}</p>
              <div className="overflow-x-auto no-scrollbar">
                <div className="flex gap-2 pb-1" style={{ minWidth: "max-content" }}>
                  {days.slice(0, 14).map((date, i) => (
                    <div key={date} className="flex flex-col items-center bg-orange-50 rounded-xl px-3 py-2 min-w-[56px]">
                      <span className="text-xs text-gray-400 font-bold">{new Date(date + "T12:00:00").toLocaleDateString("en", { weekday: "short" })}</span>
                      <span className="text-xl my-1">{wxEmoji(weather.daily.weathercode?.[i])}</span>
                      <span className="text-xs font-black text-gray-900">{Math.round(weather.daily.temperature_2m_max?.[i])}°</span>
                      <span className="text-xs text-gray-400">{Math.round(weather.daily.temperature_2m_min?.[i])}°</span>
                      {(weather.daily.precipitation_probability_mean?.[i] || 0) > 30 && (
                        <span className="text-xs text-blue-400 font-bold">{weather.daily.precipitation_probability_mean[i]}%💧</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-300 mt-2 text-center">Open-Meteo · Not a forecast guarantee</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Pack Tab ─────────────────────────────────────────────────────────────────
function PackTab({ trip }) {
  const G = "linear-gradient(135deg,#f97316,#ec4899)";
  const { t } = useLanguage();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState({});
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    setLoading(true);
    fetch("/api/suggest", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ type:"packing", trip }) })
      .then(r=>r.json()).then(r=>{ if(r.ok) setData(r.data); }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const total  = data?.categories?.flatMap(c=>c.items||[]).length || 0;
  const packed = Object.values(checked).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {total > 0 && (
        <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-black text-gray-900">{t("packing_progress")}</span>
            <span className="text-sm font-black text-orange-500">{packed}/{total}</span>
          </div>
          <div className="h-3 bg-orange-50 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: total > 0 ? `${(packed/total)*100}%` : "0%", background: G }} />
          </div>
          {packed === total && total > 0 && <p className="text-xs text-green-600 font-bold mt-2">{t("all_packed")}</p>}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-orange-300 border-t-transparent animate-spin"/>
          <p className="text-sm text-gray-400 font-medium">{t("ai_packing_list")}</p>
        </div>
      ) : !data ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">🧳</div>
          <p className="font-medium">{t("could_not_load_packing")}</p>
        </div>
      ) : (
        (data.categories || []).map((cat, ci) => (
          <div key={ci} className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
            <h3 className="font-black text-gray-900 mb-3 text-sm flex items-center gap-2">
              <span>{cat.name}</span>
              <span className="text-xs font-bold text-gray-300">{(cat.items||[]).filter((_,ii)=>checked[`${ci}-${ii}`]).length}/{(cat.items||[]).length}</span>
            </h3>
            <div className="space-y-2">
              {(cat.items||[]).map((item, ii) => {
                const key = `${ci}-${ii}`;
                return (
                  <label key={ii} className="flex items-center gap-3 cursor-pointer group py-0.5">
                    <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={checked[key] ? {borderColor:"#f97316",background:"#f97316"} : {borderColor:"#fed7aa"}}
                      onClick={()=>setChecked(p=>({...p,[key]:!p[key]}))}>
                      {checked[key] && <span className="text-white text-xs font-black">✓</span>}
                    </div>
                    <span className={`text-sm font-medium transition-all ${checked[key]?"line-through text-gray-300":"text-gray-700"}`}>{item}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Expenses Tab ─────────────────────────────────────────────────────────────
function ExpensesTab({ trip, expenses, onAdd, onDelete }) {
  const G = "linear-gradient(135deg,#f97316,#ec4899)";
  const { t } = useLanguage();

  const BUDGET_CATS = {
    accommodation:  { color: "#f97316", label: t("accommodation_label") },
    food:           { color: "#ec4899", label: t("food_label") },
    activities:     { color: "#8b5cf6", label: t("activities_label") },
    transportation: { color: "#3b82f6", label: t("transportation_label") },
    other:          { color: "#9ca3af", label: t("other_label") },
  };
  const EXPENSE_CATS = [
    { key: "food",           label: t("food_label"),           icon: "🍽️" },
    { key: "accommodation",  label: t("accommodation_label"),  icon: "🏨" },
    { key: "activities",     label: t("activities_label"),     icon: "🎭" },
    { key: "transportation", label: t("transportation_label"), icon: "🚌" },
    { key: "other",          label: t("other_label"),          icon: "💳" },
  ];

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", category: "food", date: new Date().toISOString().split("T")[0] });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const totalSpent    = expenses.reduce((s,e)=>s+(Number(e.amount)||0),0);
  const totalEstimate = trip.total_estimated_cost || 0;
  const remaining     = totalEstimate - totalSpent;
  const pct           = totalEstimate > 0 ? Math.min(100, (totalSpent/totalEstimate)*100) : 0;

  function submit(e) {
    e.preventDefault();
    if (!form.name || !form.amount) return;
    onAdd({ ...form, amount: Number(form.amount) });
    setForm({ name:"", amount:"", category:"food", date: new Date().toISOString().split("T")[0] });
    setShowForm(false);
  }

  const byCategory = EXPENSE_CATS.map(cat => ({
    ...cat,
    spent:     expenses.filter(e=>e.category===cat.key).reduce((s,e)=>s+(Number(e.amount)||0),0),
    estimated: trip.budget_breakdown?.[cat.key] || 0,
    color:     BUDGET_CATS[cat.key]?.color || "#9ca3af",
  }));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 text-white shadow-lg" style={{ background: remaining >= 0 ? G : "linear-gradient(135deg,#ef4444,#dc2626)" }}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-white/70 text-xs font-bold uppercase tracking-wide">{t("total_spent")}</p>
            <p className="text-3xl font-black">{trip.currency} {totalSpent.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs font-bold uppercase tracking-wide">{remaining >= 0 ? t("remaining") : "Over Budget"}</p>
            <p className="text-2xl font-black">{trip.currency} {Math.abs(remaining).toLocaleString()}</p>
          </div>
        </div>
        <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-white/60 text-xs mt-2">{pct.toFixed(0)}% of {trip.currency} {totalEstimate.toLocaleString()} budget used</p>
      </div>

      <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
        <h3 className="font-black text-gray-900 mb-3 text-sm">By Category</h3>
        <div className="space-y-3">
          {byCategory.map(cat => (
            <div key={cat.key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-600">{cat.icon} {cat.label}</span>
                <div className="text-right">
                  <span className="text-xs font-black text-gray-900">{trip.currency} {cat.spent.toLocaleString()}</span>
                  {cat.estimated > 0 && <span className="text-xs text-gray-300 ml-1">/ {cat.estimated.toLocaleString()}</span>}
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: cat.estimated > 0 ? `${Math.min(100,(cat.spent/cat.estimated)*100)}%` : "0%", background: cat.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={()=>setShowForm(true)}
        className="w-full py-4 rounded-2xl text-white font-black text-sm shadow-lg shadow-orange-200/50 hover:-translate-y-0.5 transition-all"
        style={{ background: G }}>
        {t("add_expense")}
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={()=>setShowForm(false)}>
          <form onSubmit={submit} className="bg-white rounded-t-3xl w-full max-w-lg mx-auto p-6 space-y-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black text-gray-900">Add Expense</h3>
              <button type="button" onClick={()=>setShowForm(false)} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-black">×</button>
            </div>
            <input required value={form.name} onChange={e=>set("name",e.target.value)} placeholder="What did you spend on?"
              className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 focus:border-orange-300 outline-none text-sm font-medium"/>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">{t("expense_amount")} ({trip.currency})</label>
                <input required type="number" min="0" value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="0"
                  className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 focus:border-orange-300 outline-none text-sm font-bold"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">{t("expense_date")}</label>
                <input type="date" value={form.date} onChange={e=>set("date",e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border-2 border-orange-100 focus:border-orange-300 outline-none text-sm"/>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">{t("expense_category")}</label>
              <div className="flex flex-wrap gap-2">
                {EXPENSE_CATS.map(c=>(
                  <button key={c.key} type="button" onClick={()=>set("category",c.key)}
                    className="px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all"
                    style={form.category===c.key ? {borderColor:"#f97316",background:"#fff7ed",color:"#ea580c"} : {borderColor:"#ffedd5",color:"#6b7280"}}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="w-full py-4 rounded-xl text-white font-black text-sm" style={{background:G}}>{t("save")}</button>
          </form>
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="text-center py-10 text-gray-300">
          <div className="text-4xl mb-2">💸</div>
          <p className="text-sm font-medium">{t("no_expenses")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="font-black text-gray-900 text-sm">All Expenses</h3>
          {[...expenses].reverse().map(exp => {
            const cat = EXPENSE_CATS.find(c=>c.key===exp.category) || EXPENSE_CATS[4];
            return (
              <div key={exp.id} className="bg-white rounded-2xl border border-orange-100 p-3 flex items-center gap-3 shadow-sm group">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-orange-50">{cat.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-sm truncate">{exp.name}</div>
                  <div className="text-xs text-gray-400">{exp.date} · {cat.label}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-black text-gray-900 text-sm">{trip.currency} {Number(exp.amount).toLocaleString()}</div>
                  <button onClick={()=>{ if(window.confirm("Remove this expense?")) onDelete(exp.id); }} className="text-xs text-red-400 hover:text-red-600 transition-all">remove</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Local Tab ────────────────────────────────────────────────────────────────
function LocalTab({ trip }) {
  const G = "linear-gradient(135deg,#f97316,#ec4899)";
  const { t } = useLanguage();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    setLoading(true);
    fetch("/api/phrases", { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ destination: trip.destination, style: trip.style, days: trip.days }) })
      .then(r=>r.json()).then(r=>{ if(r.ok) setData(r.data); }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  function copy(text, id) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(()=>setCopied(null), 1500);
  }

  const CATEGORY_ICONS = { essentials:"🌟", food:"🍽️", transport:"🚌", shopping:"🛍️", emergency:"🚨", social:"👋" };
  const grouped = data?.phrases ? data.phrases.reduce((acc, p) => {
    const cat = p.category || "essentials";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {}) : {};

  return (
    <div className="space-y-4">
      {data && (
        <div className="rounded-2xl p-4 text-white text-center" style={{ background: G }}>
          <div className="text-3xl mb-1">{data.flag || "🌍"}</div>
          <div className="font-black text-lg">{data.language}</div>
          <div className="text-white/70 text-sm">Speak like a local in {trip.destination}</div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-orange-300 border-t-transparent animate-spin"/>
          <p className="text-sm text-gray-400 font-medium">Learning local phrases...</p>
        </div>
      ) : !data ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">🌐</div>
          <p className="font-medium">Could not load phrases. Please try again.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, phrases]) => (
          <div key={cat} className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-orange-50" style={{ background: "var(--bg-page)" }}>
              <span className="font-black text-gray-900 text-sm">{CATEGORY_ICONS[cat] || "💬"} {cat.charAt(0).toUpperCase()+cat.slice(1)}</span>
            </div>
            <div className="divide-y divide-orange-50">
              {phrases.map((p, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3 hover:bg-orange-50/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 text-sm">{p.english}</div>
                    <div className="font-black text-orange-500 text-base mt-0.5">{p.local}</div>
                    <div className="text-xs text-gray-400 mt-0.5 italic">{p.pronunciation}</div>
                    <div className="text-xs text-gray-300 mt-1">{p.usage}</div>
                  </div>
                  <button onClick={()=>copy(p.local, `${cat}-${i}`)}
                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                    style={copied===`${cat}-${i}` ? {background:"#f97316",color:"white"} : {background:"#fff7ed",color:"#f97316"}}>
                    {copied===`${cat}-${i}` ? "✓" : "📋"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {trip.tips?.length > 0 && (
        <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
          <h3 className="font-black text-gray-900 mb-3 text-sm">{t("local_tip")}</h3>
          <div className="space-y-2">
            {trip.tips.map((tip, i) => (
              <div key={i} className="flex gap-3">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white font-black flex-shrink-0 mt-0.5" style={{ background: G }}>{i+1}</span>
                <p className="text-sm text-gray-600 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Surprise Reveal ─────────────────────────────────────────────────────────
function SurpriseReveal({ destination, onDone }) {
  const [revealed, setRevealed] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(t); setRevealed(true); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-8"
      style={{ background: "linear-gradient(135deg,#f97316,#ec4899)" }}>
      {!revealed ? (
        <div className="space-y-6">
          <div className="text-6xl animate-bounce">🎲</div>
          <h2 className="text-3xl font-black text-white">Your surprise destination reveals in...</h2>
          <div className="text-8xl font-black text-white animate-pulse">{countdown}</div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="text-6xl">🎉</div>
          <div className="text-white/70 text-lg font-bold uppercase tracking-widest">You're going to...</div>
          <h1 className="text-5xl font-black text-white leading-tight">{destination}</h1>
          <button onClick={onDone}
            className="mt-6 px-8 py-4 rounded-2xl font-black text-orange-500 text-lg bg-white shadow-2xl hover:scale-105 transition-transform">
            See My Itinerary →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function TripContent() {
  const { id }      = useParams();
  const router      = useRouter();
  const searchParams = useSearchParams();
  const { t }       = useLanguage();

  const [trip, setTrip]               = useState(null);
  const [activeTab, setActiveTab]     = useState("itinerary");
  const [activeDay, setActiveDay]     = useState(0);
  const [editMode, setEditMode]       = useState(false);
  const [copied, setCopied]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [showAI, setShowAI]           = useState(false);
  const [daySuggestIndex, setDaySuggestIndex] = useState(null);
  const [expenses, setExpenses]       = useState([]);
  const [showSurprise, setShowSurprise] = useState(false);
  const [packingData, setPackingData] = useState(null);
  const [printLoading, setPrintLoading] = useState(false);

  const TABS = [
    { id: "itinerary", labelKey: "tab_itinerary", icon: "🗓️" },
    { id: "pack",      labelKey: "tab_pack",      icon: "🧳" },
    { id: "expenses",  labelKey: "tab_expenses",  icon: "💸" },
    { id: "local",     labelKey: "tab_local",     icon: "🌐" },
  ];

  const BUDGET_CATS = {
    accommodation:  { color: "#f97316", label: t("accommodation_label") },
    food:           { color: "#ec4899", label: t("food_label") },
    activities:     { color: "#8b5cf6", label: t("activities_label") },
    transportation: { color: "#3b82f6", label: t("transportation_label") },
    other:          { color: "#9ca3af", label: t("other_label") },
  };

  useEffect(() => {
    const tr = getTrip(id);
    if (!tr) { router.push("/plan"); return; }
    setTrip(tr);
    setExpenses(tr.expenses || []);
    if (searchParams.get("edit") === "true") setEditMode(true);
    if (searchParams.get("surprise") === "true") setShowSurprise(true);
  }, [id, router, searchParams]);

  const persist = useCallback((updated) => {
    updateTrip(id, updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [id]);

  function setTripAndSave(updater) {
    setTrip(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persist(next);
      return next;
    });
  }

  function updateActivity(di, ai, field, value) {
    setTripAndSave(p => {
      const tr = JSON.parse(JSON.stringify(p));
      tr.daily_itinerary[di].activities[ai][field] = value;
      tr.daily_itinerary[di].daily_cost = tr.daily_itinerary[di].activities.reduce((s,a)=>s+(Number(a.estimated_cost)||0)*(tr.travelers||1),0);
      tr.total_estimated_cost = tr.daily_itinerary.reduce((s,d)=>s+(d.daily_cost||0),0);
      return tr;
    });
  }
  function addActivity(di, activity) {
    setTripAndSave(p => {
      const tr = JSON.parse(JSON.stringify(p));
      tr.daily_itinerary[di].activities.push(activity || { time:"morning", name:"New Activity", description:"Describe this activity.", estimated_cost:0 });
      return tr;
    });
  }
  function deleteActivity(di, ai) {
    setTripAndSave(p => {
      const tr = JSON.parse(JSON.stringify(p));
      tr.daily_itinerary[di].activities.splice(ai,1);
      tr.daily_itinerary[di].daily_cost = tr.daily_itinerary[di].activities.reduce((s,a)=>s+(Number(a.estimated_cost)||0)*(tr.travelers||1),0);
      tr.total_estimated_cost = tr.daily_itinerary.reduce((s,d)=>s+(d.daily_cost||0),0);
      return tr;
    });
  }
  function updateDayNote(di, note) {
    setTripAndSave(p => {
      const tr = JSON.parse(JSON.stringify(p));
      tr.daily_itinerary[di].notes = note;
      return tr;
    });
  }
  function updateDayField(di, field, value) {
    setTripAndSave(p => { const tr=JSON.parse(JSON.stringify(p)); tr.daily_itinerary[di][field]=value; return tr; });
  }
  function updateTip(i, value) {
    setTripAndSave(p => { const tr=JSON.parse(JSON.stringify(p)); tr.tips[i]=value; return tr; });
  }
  function deleteTip(i) {
    setTripAndSave(p => { const tr=JSON.parse(JSON.stringify(p)); tr.tips.splice(i,1); return tr; });
  }
  function addTip() {
    setTripAndSave(p => { const tr=JSON.parse(JSON.stringify(p)); tr.tips.push("Add your tip here"); return tr; });
  }
  function updateBudget(key, value) {
    setTripAndSave(p => { const tr=JSON.parse(JSON.stringify(p)); tr.budget_breakdown[key]=Number(value); tr.total_estimated_cost=Object.values(tr.budget_breakdown).reduce((a,b)=>a+b,0); return tr; });
  }
  function addExpense(exp) {
    const newExp = { ...exp, id: generateId(), createdAt: Date.now() };
    const updated = [...expenses, newExp];
    setExpenses(updated);
    setTripAndSave(p => ({ ...p, expenses: updated }));
  }
  function deleteExpense(expId) {
    const updated = expenses.filter(e => e.id !== expId);
    setExpenses(updated);
    setTripAndSave(p => ({ ...p, expenses: updated }));
  }
  async function handlePrint() {
    if (!packingData && trip) {
      setPrintLoading(true);
      try {
        const r = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "packing", trip }),
        });
        const data = await r.json();
        if (data.ok) setPackingData(data.data);
      } catch {}
      setPrintLoading(false);
    }
    setTimeout(() => window.print(), 300);
  }

  function copyLink() {
    try {
      // Encode trip data into URL hash for real sharing
      const shareData = JSON.stringify({
        destination: trip.destination,
        days: trip.days,
        travelers: trip.travelers,
        currency: trip.currency,
        total_estimated_cost: trip.total_estimated_cost,
        style: trip.style,
        summary: trip.summary,
        daily_itinerary: trip.daily_itinerary,
        budget_breakdown: trip.budget_breakdown,
        tips: trip.tips,
        form: trip.form,
      });
      const encoded = btoa(unescape(encodeURIComponent(shareData)));
      const shareUrl = `${window.location.origin}/trip/shared#${encoded}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } catch {
      // Fallback: just copy current URL
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  }

  function downloadCalendar() {
    if (!trip) return;
    const pad = n => String(n).padStart(2, "0");
    function toICS(dateStr, hour = 9) {
      const d = new Date(dateStr + "T00:00:00");
      return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(hour)}0000`;
    }

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//AI-gency//Travel Planner//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    for (const day of (trip.daily_itinerary || [])) {
      const dateStr = day.date || trip.form?.startDate;
      if (!dateStr) continue;
      lines.push(
        "BEGIN:VEVENT",
        `UID:aigency-day${day.day}-${trip.destination?.replace(/\s/g,"")}@aigency`,
        `DTSTART:${toICS(dateStr, 9)}`,
        `DTEND:${toICS(dateStr, 21)}`,
        `SUMMARY:Day ${day.day} — ${day.title || trip.destination}`,
        `DESCRIPTION:${(day.activities || []).map(a => `${a.time}: ${a.name}`).join("\\n")}`,
        `LOCATION:${trip.destination || ""}`,
        "END:VEVENT"
      );
    }
    lines.push("END:VCALENDAR");

    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${trip.destination?.replace(/[^a-z0-9]/gi, "_")}_itinerary.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!trip) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:"var(--bg-page)" }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-orange-400 border-t-transparent animate-spin mx-auto mb-4"/>
        <p className="text-gray-400 font-medium">{t("loading")}</p>
      </div>
    </div>
  );

  if (showAI) return <AIChatPanel trip={{...trip,id}} onClose={()=>setShowAI(false)}/>;

  const { daily_itinerary=[], budget_breakdown={}, tips=[], form } = trip;
  const totalBudget = Object.values(budget_breakdown).reduce((a,b)=>a+b,0);
  const theme = getTheme(trip.destination||form?.destination, trip.style||form?.style);
  const hero  = `linear-gradient(135deg,${theme.g[0]},${theme.g[1]})`;
  const G     = "linear-gradient(135deg,#f97316,#ec4899)";

  return (
    <main className="min-h-screen" style={{ background:"var(--bg-page)" }}>

      {showSurprise && <SurpriseReveal destination={trip.destination} onDone={()=>setShowSurprise(false)}/>}

      {daySuggestIndex !== null && (
        <DaySuggestions trip={trip} dayIndex={daySuggestIndex}
          onApply={s=>addActivity(daySuggestIndex,s)} onClose={()=>setDaySuggestIndex(null)}/>
      )}

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-40 px-3 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between bg-white/90 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-sm border border-orange-100">
          <Link href="/trips" className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors">← {t("nav_trips")}</Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode(e => !e)}
              className="no-print text-xs font-bold px-3 py-2 rounded-xl border-2 transition-all"
              style={editMode
                ? { background: "linear-gradient(135deg,#f97316,#ec4899)", color: "white", borderColor: "transparent" }
                : { borderColor: "#ffedd5", color: "#9ca3af", background: "transparent" }
              }
            >
              {editMode ? "✓ Editing" : "✏️ Edit"}
            </button>
            <button onClick={handlePrint} disabled={printLoading} className="no-print text-xs font-bold px-3 py-2 rounded-xl border-2 border-orange-100 text-gray-500 hover:bg-orange-50 transition-all disabled:opacity-50">
              {printLoading ? "⏳" : "🖨️"}
            </button>
            <button onClick={downloadCalendar} className="no-print text-xs font-bold px-3 py-2 rounded-xl border-2 border-orange-100 text-gray-500 hover:bg-orange-50 transition-all">
              📅
            </button>
            <button onClick={copyLink} className="text-xs font-bold px-3 py-2 rounded-xl text-white shadow-sm" style={{background:hero}}>
              {copied ? "✓ Copied!" : t("share_trip")}
            </button>
          </div>
        </div>
      </nav>

      {editMode && (
        <div className="mx-3 mb-3 rounded-2xl px-5 py-3 flex items-center gap-3 text-sm" style={{background:"#fff7ed",border:"2px solid #fed7aa"}}>
          <span className="text-orange-500">✏️</span>
          <span className="text-orange-700 font-bold">Edit Mode — tap any text to change it</span>
          {saved && <span className="ml-auto text-green-600 font-bold text-xs">✓ Saved!</span>}
        </div>
      )}

      {/* ── Hero ── */}
      <div className="mx-3 rounded-3xl overflow-hidden mb-0" style={{background:hero}}>
        <div className="max-w-5xl mx-auto px-5 py-8">
          <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-1">✦ {theme.hi}</p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                {[`${STYLE_ICONS[trip.style]||"🌍"} ${trip.style?.charAt(0).toUpperCase()+trip.style?.slice(1)||"Trip"}`,
                  `👥 ${trip.travelers} ${t("travelers_word")}`,
                  `🗓️ ${trip.days} ${t("days")}`].map(tag=>(
                  <span key={tag} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{background:"rgba(255,255,255,0.2)",color:"white"}}>{tag}</span>
                ))}
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-1">
                {theme.e} {editMode
                  ? <Editable value={trip.destination} onChange={v=>setTripAndSave(p=>({...p,destination:v}))} className="text-white"/>
                  : trip.destination}
              </h1>
              <p className="text-white/60 text-sm font-medium">{form?.startDate} → {form?.endDate}</p>
            </div>
            <div className="rounded-2xl p-4 text-center flex-shrink-0" style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)"}}>
              <div className="text-2xl font-black text-white">{trip.currency} {trip.total_estimated_cost?.toLocaleString()}</div>
              <div className="text-white/60 text-xs mt-1">{t("budget_label")}</div>
              {trip.travelers>1 && <div className="text-white/50 text-xs mt-0.5">≈ {trip.currency} {Math.round(trip.total_estimated_cost/trip.travelers).toLocaleString()}/person</div>}
            </div>
          </div>
          {trip.summary && (
            <p className="mt-4 text-white/75 text-sm leading-relaxed max-w-2xl rounded-2xl px-5 py-4" style={{background:"rgba(255,255,255,0.12)"}}>
              {editMode ? <Editable value={trip.summary} onChange={v=>setTripAndSave(p=>({...p,summary:v}))} multiline className="text-white"/> : trip.summary}
            </p>
          )}
          {trip.surprise_reveal && !showSurprise && (
            <div className="mt-3 flex items-start gap-3 max-w-2xl rounded-2xl px-5 py-3" style={{background:"rgba(255,255,255,0.1)"}}>
              <span className="text-yellow-300 flex-shrink-0">🎲</span>
              <p className="text-white/75 text-xs leading-relaxed italic">{trip.surprise_reveal}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="sticky top-16 z-30 mx-3 mb-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-b-2xl border border-orange-100 border-t-0 shadow-sm overflow-hidden">
          <div className="flex">
            {TABS.map(tab => (
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center gap-0.5 py-3 transition-all"
                style={activeTab===tab.id ? {background:hero,color:"white"} : {color:"#9ca3af"}}>
                <span className="text-base leading-none">{tab.icon}</span>
                <span className="text-xs font-black">{t(tab.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="tab-content-area max-w-5xl mx-auto px-3 pb-32 space-y-4">

        {/* ITINERARY TAB */}
        {activeTab === "itinerary" && (
          <>
            {/* AI Quick Actions */}
            <section>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={()=>setShowAI(true)}
                  className="rounded-2xl p-4 text-white text-left shadow-md hover:-translate-y-0.5 transition-all" style={{background:G}}>
                  <div className="text-2xl mb-2">🤖</div>
                  <div className="font-black text-sm">Ask AI</div>
                  <div className="text-white/70 text-xs mt-0.5">Tips, suggestions & more</div>
                </button>
                <button onClick={()=>setActiveTab("pack")}
                  className="rounded-2xl p-4 text-white text-left shadow-md hover:-translate-y-0.5 transition-all" style={{background:"linear-gradient(135deg,#8b5cf6,#6366f1)"}}>
                  <div className="text-2xl mb-2">🧳</div>
                  <div className="font-black text-sm">{t("tab_pack")}</div>
                  <div className="text-white/70 text-xs mt-0.5">{t("ai_packing_list")}</div>
                </button>
                <button onClick={()=>setActiveTab("expenses")}
                  className="rounded-2xl p-4 text-white text-left shadow-md hover:-translate-y-0.5 transition-all" style={{background:"linear-gradient(135deg,#0d9488,#0ea5e9)"}}>
                  <div className="text-2xl mb-2">💸</div>
                  <div className="font-black text-sm">{t("tab_expenses")}</div>
                  <div className="text-white/70 text-xs mt-0.5">{expenses.length} expenses logged</div>
                </button>
                <button onClick={()=>setActiveTab("local")}
                  className="rounded-2xl p-4 text-white text-left shadow-md hover:-translate-y-0.5 transition-all" style={{background:"linear-gradient(135deg,#d97706,#f59e0b)"}}>
                  <div className="text-2xl mb-2">🗣️</div>
                  <div className="font-black text-sm">{t("tab_local")}</div>
                  <div className="text-white/70 text-xs mt-0.5">{t("local_phrases")}</div>
                </button>
              </div>
            </section>

            {/* Budget Breakdown */}
            {totalBudget > 0 && (
              <section>
                <h2 className="text-lg font-black text-gray-900 mb-3">💰 {t("budget_breakdown")}</h2>
                <div className="bg-white rounded-3xl border border-orange-100 p-5 shadow-sm">
                  <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-5">
                    {Object.entries(budget_breakdown).map(([k,v])=>(
                      <div key={k} className="rounded-full" style={{width:`${totalBudget>0?(v/totalBudget)*100:0}%`,background:BUDGET_CATS[k]?.color||"#9ca3af"}}/>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.entries(budget_breakdown).map(([k,v])=>(
                      <div key={k} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background:BUDGET_CATS[k]?.color||"#9ca3af"}}/>
                        <div>
                          <div className="text-xs text-gray-400">{BUDGET_CATS[k]?.label||k}</div>
                          <div className="text-sm font-bold text-gray-900">
                            {trip.currency} {editMode ? <EditableNumber value={v} onChange={val=>updateBudget(k,val)}/> : v?.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Daily Itinerary */}
            {daily_itinerary.length > 0 && (
              <section>
                <h2 className="text-lg font-black text-gray-900 mb-3">🗓️ Day-by-Day</h2>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
                  {daily_itinerary.map((day,i)=>(
                    <button key={i} onClick={()=>setActiveDay(i)}
                      className="flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-bold transition-all"
                      style={activeDay===i ? {background:hero,color:"white",boxShadow:`0 4px 12px ${theme.g[0]}40`} : {background:"white",color:"#6b7280",border:"2px solid #ffedd5"}}>
                      {t("day_label")} {day.day}
                    </button>
                  ))}
                </div>

                {daily_itinerary[activeDay] && (
                  <div className="bg-white rounded-3xl border border-orange-100 overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-orange-50" style={{background:"var(--bg-page)"}}>
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest mb-1" style={{color:theme.g[0]}}>
                            {t("day_label")} {daily_itinerary[activeDay].day} · {daily_itinerary[activeDay].date}
                          </div>
                          <h3 className="text-xl font-black text-gray-900">
                            {editMode ? <Editable value={daily_itinerary[activeDay].title} onChange={v=>updateDayField(activeDay,"title",v)}/> : daily_itinerary[activeDay].title}
                          </h3>
                          <p className="text-sm text-gray-400 mt-1">
                            🏨 {editMode ? <Editable value={daily_itinerary[activeDay].accommodation} onChange={v=>updateDayField(activeDay,"accommodation",v)} placeholder="Add hotel..."/> : daily_itinerary[activeDay].accommodation}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="rounded-2xl px-4 py-2 text-center" style={{background:"var(--bg-card)",border:"2px solid #ffedd5"}}>
                            <div className="text-lg font-black" style={{color:theme.g[0]}}>{trip.currency} {daily_itinerary[activeDay].daily_cost?.toLocaleString()}</div>
                            <div className="text-xs text-gray-400">{t("day_total")}</div>
                          </div>
                          <button onClick={()=>setDaySuggestIndex(activeDay)} className="px-3 py-2 rounded-2xl text-white text-xs font-black shadow-sm hover:-translate-y-0.5 transition-all" style={{background:G}}>✨ AI</button>
                        </div>
                      </div>
                    </div>
                    <div className="divide-y divide-orange-50">
                      {daily_itinerary[activeDay].activities?.map((a,j)=>{
                        const ts = TIME_STYLE[a.time]||TIME_STYLE.morning;
                        const timeLabel = a.time === "morning" ? t("morning") : a.time === "afternoon" ? t("afternoon") : t("evening");
                        return (
                          <div key={j} className="p-4 flex gap-3 hover:bg-orange-50/30 transition-colors group">
                            <div className="flex-shrink-0 pt-0.5">
                              {editMode ? (
                                <select value={a.time} onChange={e=>updateActivity(activeDay,j,"time",e.target.value)}
                                  className="text-xs font-bold px-2 py-1.5 rounded-full border-2 outline-none"
                                  style={{background:ts.bg,color:ts.text,borderColor:ts.bg}}>
                                  {["morning","afternoon","evening"].map(tm=>(
                                    <option key={tm} value={tm}>
                                      {tm === "morning" ? t("morning") : tm === "afternoon" ? t("afternoon") : t("evening")}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{background:ts.bg,color:ts.text}}>{timeLabel}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-bold text-gray-900 text-sm">{editMode ? <Editable value={a.name} onChange={v=>updateActivity(activeDay,j,"name",v)}/> : a.name}</h4>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {a.estimated_cost>0 && <span className="text-xs font-bold text-gray-400">{trip.currency} {editMode ? <EditableNumber value={a.estimated_cost} onChange={v=>updateActivity(activeDay,j,"estimated_cost",v)}/> : a.estimated_cost?.toLocaleString()}</span>}
                                  {editMode && <button onClick={()=>deleteActivity(activeDay,j)} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-red-100 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center text-xs font-black">×</button>}
                                </div>
                              </div>
                              <p className="text-sm text-gray-400 mt-1 leading-relaxed">{editMode ? <Editable value={a.description} onChange={v=>updateActivity(activeDay,j,"description",v)} multiline/> : a.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {editMode && <div className="p-4 border-t border-orange-50"><button onClick={()=>addActivity(activeDay)} className="w-full py-3 rounded-2xl border-2 border-dashed border-orange-200 text-orange-400 hover:border-orange-300 hover:bg-orange-50 transition-all text-sm font-bold">{t("add_activity")}</button></div>}
                    {/* Diary Notes */}
                    <div className="p-4 border-t border-orange-50">
                      <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-base">📝</span>
                          <span className="font-black text-gray-900 text-sm">{t("my_notes")}</span>
                        </div>
                        <textarea
                          value={daily_itinerary[activeDay]?.notes || ""}
                          onChange={e => updateDayNote(activeDay, e.target.value)}
                          onBlur={e => updateDayNote(activeDay, e.target.value)}
                          placeholder={t("notes_placeholder")}
                          rows={3}
                          className="w-full text-sm text-gray-700 placeholder-gray-300 bg-orange-50 rounded-xl px-3 py-2.5 outline-none border-2 border-transparent focus:border-orange-300 resize-none leading-relaxed font-medium transition-all"
                        />
                      </div>
                    </div>
                    <div className="px-5 py-4 flex justify-between" style={{background:"var(--bg-page)"}}>
                      <button onClick={()=>setActiveDay(p=>Math.max(0,p-1))} disabled={activeDay===0} className="text-sm font-bold text-gray-400 hover:text-orange-500 disabled:opacity-30 transition-colors">{t("previous")}</button>
                      <button onClick={()=>setActiveDay(p=>Math.min(daily_itinerary.length-1,p+1))} disabled={activeDay===daily_itinerary.length-1} className="text-sm font-bold text-gray-400 hover:text-orange-500 disabled:opacity-30 transition-colors">{t("next_day")}</button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Hotel & Restaurant Picks */}
            {(trip.recommended_hotels?.length>0 || trip.recommended_restaurants?.length>0) && (
              <section className="space-y-3">
                {trip.recommended_hotels?.length>0 && (
                  <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
                    <div className="font-black text-gray-900 mb-3 text-sm">🏨 {t("hotels")}</div>
                    <div className="space-y-3">
                      {trip.recommended_hotels.map((h,i)=>(
                        <a key={i} href={`https://www.booking.com/search.html?ss=${encodeURIComponent(h.name+" "+trip.destination)}&checkin=${trip.form?.startDate||""}&checkout=${trip.form?.endDate||""}&group_adults=${trip.travelers||2}&aid=1269762&label=tp-712006`}
                          target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:bg-orange-50 rounded-xl p-2 -m-2 transition-colors group">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-orange-50 flex-shrink-0">🏨</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 text-sm">{h.name}</div>
                            <div className="text-xs text-gray-400">{h.area} · {"★".repeat(Math.min(h.stars||3,5))}</div>
                            <div className="text-xs text-orange-500">{h.why}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-black text-sm text-gray-900">{trip.currency} {h.price_per_night?.toLocaleString()}{t("per_night")}</div>
                            <div className="text-xs text-blue-500 group-hover:text-blue-700">Book →</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {trip.recommended_restaurants?.length>0 && (
                  <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
                    <div className="font-black text-gray-900 mb-3 text-sm">🍽️ {t("restaurants")}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {trip.recommended_restaurants.map((r,i)=>(
                        <a key={i} href={`https://www.google.com/search?q=${encodeURIComponent(r.name+" "+trip.destination)}`}
                          target="_blank" rel="noopener noreferrer" className="rounded-xl border border-orange-100 p-3 hover:border-orange-300 hover:bg-orange-50 transition-all">
                          <div className="font-bold text-gray-900 text-xs">{r.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{r.type} · {r.price_range}</div>
                          <div className="text-xs text-orange-500 mt-1">{t("must_try")} {r.must_try}</div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Book Your Trip */}
            <BookingSection trip={trip}/>

            {/* Weather Forecast */}
            <WeatherWidget destination={trip.destination} startDate={form?.startDate} endDate={form?.endDate}/>

            {/* Tips */}
            {(tips.length>0||editMode) && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-black text-gray-900">💡 {t("tips_label")}</h2>
                  {editMode && <button onClick={addTip} className="text-xs font-bold px-4 py-2 rounded-xl border-2 border-orange-200 text-orange-500 bg-orange-50">{t("add_tip")}</button>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tips.map((tip,i)=>(
                    <div key={i} className="flex gap-3 bg-white rounded-2xl border border-orange-100 p-4 shadow-sm group">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-black flex-shrink-0 mt-0.5" style={{background:hero}}>{i+1}</span>
                      <p className="text-gray-500 text-sm leading-relaxed flex-1">{editMode ? <Editable value={tip} onChange={v=>updateTip(i,v)} multiline/> : tip}</p>
                      {editMode && <button onClick={()=>deleteTip(i)} className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-lg bg-red-100 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center text-xs font-black">×</button>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Share CTA */}
            <section>
              <div className="relative rounded-3xl overflow-hidden p-7 text-center text-white" style={{background:hero}}>
                <div className="text-4xl mb-3">{theme.e}</div>
                <h2 className="text-2xl font-black mb-2">{t("share_adventure")} {theme.e}</h2>
                <p className="text-white/70 mb-6 text-sm">{t("share_with_friends")}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={copyLink} className="bg-white font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:-translate-y-0.5 transition-all text-sm" style={{color:theme.g[0]}}>
                    {copied ? "✓ Copied!" : t("copy_link")}
                  </button>
                  <Link href="/plan" className="font-bold px-8 py-3.5 rounded-2xl text-sm text-white border border-white/30" style={{background:"rgba(255,255,255,0.2)"}}>
                    {t("plan_another")}
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}

        {/* PACK TAB */}
        {activeTab === "pack" && <PackTab trip={trip}/>}

        {/* EXPENSES TAB */}
        {activeTab === "expenses" && (
          <ExpensesTab trip={trip} expenses={expenses} onAdd={addExpense} onDelete={deleteExpense}/>
        )}

        {/* LOCAL TAB */}
        {activeTab === "local" && <LocalTab trip={trip}/>}
      </div>

      {/* ── Floating AI Button ── */}
      <button onClick={()=>setShowAI(true)}
        className="fixed bottom-28 right-4 z-30 w-14 h-14 rounded-2xl shadow-xl text-white text-2xl flex items-center justify-center hover:-translate-y-1 transition-all no-print"
        style={{background:G,boxShadow:"0 8px 24px rgba(249,115,22,0.4)"}}>
        🤖
      </button>

      {/* ── PRINT ONLY SECTION ── */}
      <div className="print-only px-6 pb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {/* Header */}
        <div style={{ borderBottom: "3px solid #f97316", paddingBottom: "12px", marginBottom: "20px" }}>
          <h1 style={{ fontSize: "26px", fontWeight: "900", margin: "0 0 4px 0", color: "#111827" }}>
            {trip?.destination} — {trip?.days}-Day Trip
          </h1>
          <p style={{ color: "#6b7280", margin: 0, fontSize: "13px" }}>
            {trip?.travelers} travelers · {trip?.currency} {trip?.total_estimated_cost?.toLocaleString()} estimated · {form?.startDate} → {form?.endDate}
            {trip?.style && ` · ${trip.style} style`}
          </p>
        </div>

        {/* Summary */}
        {trip?.summary && (
          <p style={{ fontSize: "13px", color: "#374151", marginBottom: "20px", lineHeight: "1.6", padding: "10px 14px", background: "#fff7ed", borderRadius: "8px", borderLeft: "3px solid #f97316" }}>
            {trip.summary}
          </p>
        )}

        {/* Budget Breakdown */}
        {totalBudget > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "900", marginBottom: "10px", color: "#111827" }}>💰 Budget Breakdown</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <tbody>
                {Object.entries(budget_breakdown).map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "5px 8px", color: "#374151" }}>{BUDGET_CATS[k]?.label || k}</td>
                    <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: "bold", color: "#111827" }}>{trip.currency} {v?.toLocaleString()}</td>
                  </tr>
                ))}
                <tr style={{ background: "#fff7ed", fontWeight: "bold" }}>
                  <td style={{ padding: "6px 8px", color: "#111827" }}>Total</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: "#f97316" }}>{trip.currency} {totalBudget.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* All Itinerary Days */}
        {daily_itinerary.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "900", marginBottom: "12px", color: "#111827" }}>🗓️ Day-by-Day Itinerary</h2>
            {daily_itinerary.map((day, i) => (
              <div key={i} style={{ marginBottom: "16px", pageBreakInside: "avoid" }}>
                <div style={{ background: "#fff7ed", padding: "8px 12px", borderRadius: "8px", marginBottom: "6px", display: "flex", gap: "12px", alignItems: "baseline" }}>
                  <strong style={{ color: "#111827" }}>Day {day.day} — {day.title}</strong>
                  {day.date && <span style={{ color: "#9ca3af", fontSize: "12px" }}>{day.date}</span>}
                  {day.accommodation && <span style={{ color: "#f97316", fontSize: "12px" }}>🏨 {day.accommodation}</span>}
                  {day.daily_cost > 0 && <span style={{ marginLeft: "auto", color: "#f97316", fontSize: "12px", fontWeight: "bold" }}>{trip.currency} {day.daily_cost?.toLocaleString()}</span>}
                </div>
                {(day.activities || []).map((a, j) => (
                  <div key={j} style={{ padding: "4px 12px", display: "flex", gap: "10px", fontSize: "13px", borderBottom: "1px solid #f9fafb" }}>
                    <span style={{ color: "#9ca3af", width: "72px", flexShrink: 0, textTransform: "capitalize" }}>{a.time}</span>
                    <span style={{ flex: 1, color: "#374151" }}><strong>{a.name}</strong>{a.description ? ` — ${a.description}` : ""}</span>
                    {a.estimated_cost > 0 && <span style={{ color: "#f97316", flexShrink: 0, fontWeight: "bold" }}>{trip.currency} {a.estimated_cost}</span>}
                  </div>
                ))}
                {day.notes && (
                  <div style={{ margin: "6px 12px", padding: "6px 10px", background: "#f9fafb", borderRadius: "6px", fontSize: "12px", color: "#6b7280" }}>
                    📝 {day.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
        {tips.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "900", marginBottom: "10px", color: "#111827" }}>💡 Travel Tips</h2>
            {tips.map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", fontSize: "13px", padding: "4px 0", color: "#374151" }}>
                <strong style={{ color: "#f97316", flexShrink: 0 }}>{i + 1}.</strong>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        )}

        {/* Packing List */}
        {packingData?.categories?.length > 0 && (
          <div className="print-page-break" style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "900", marginBottom: "12px", color: "#111827" }}>🧳 Packing List</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {packingData.categories.map((cat, ci) => (
                <div key={ci} style={{ border: "1px solid #ffedd5", borderRadius: "8px", padding: "10px" }}>
                  <strong style={{ fontSize: "13px", display: "block", marginBottom: "6px", color: "#111827" }}>{cat.name}</strong>
                  {(cat.items || []).map((item, ii) => (
                    <div key={ii} style={{ fontSize: "12px", color: "#374151", padding: "2px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "11px", height: "11px", border: "1px solid #fed7aa", borderRadius: "3px", display: "inline-block", flexShrink: 0 }} />
                      {item}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expenses */}
        {expenses.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "900", marginBottom: "10px", color: "#111827" }}>💸 Expenses Log</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#fff7ed" }}>
                  <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #ffedd5", fontWeight: "bold", color: "#374151" }}>Date</th>
                  <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #ffedd5", fontWeight: "bold", color: "#374151" }}>Description</th>
                  <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #ffedd5", fontWeight: "bold", color: "#374151" }}>Category</th>
                  <th style={{ textAlign: "right", padding: "6px 8px", borderBottom: "1px solid #ffedd5", fontWeight: "bold", color: "#374151" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "5px 8px", color: "#9ca3af" }}>{exp.date}</td>
                    <td style={{ padding: "5px 8px", color: "#374151" }}>{exp.name}</td>
                    <td style={{ padding: "5px 8px", color: "#6b7280" }}>{exp.category}</td>
                    <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: "bold", color: "#111827" }}>{trip.currency} {Number(exp.amount).toLocaleString()}</td>
                  </tr>
                ))}
                <tr style={{ background: "#fff7ed", fontWeight: "bold" }}>
                  <td colSpan={3} style={{ padding: "6px 8px", textAlign: "right", color: "#374151" }}>Total Spent:</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: "#f97316" }}>
                    {trip.currency} {expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <p style={{ fontSize: "11px", color: "#9ca3af", textAlign: "center", marginTop: "24px", borderTop: "1px solid #f3f4f6", paddingTop: "12px" }}>
          Generated by AI-gency · Powered by Claude AI
        </p>
      </div>
    </main>
  );
}

export default function TripPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{background:"var(--bg-page)"}}>
        <div className="w-12 h-12 rounded-full border-4 border-orange-400 border-t-transparent animate-spin"/>
      </div>
    }>
      <TripContent/>
    </Suspense>
  );
}
