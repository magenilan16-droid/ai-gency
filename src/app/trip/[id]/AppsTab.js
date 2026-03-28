"use client";

import { useMemo } from "react";
import { useLanguage } from "@/app/LanguageProvider";

// Universal apps always shown
const UNIVERSAL_APPS = [
  { name: "Google Maps", icon: "🗺️", category: "Navigation", desc: "Download offline maps before you go", platforms: "iOS & Android" },
  { name: "Google Translate", icon: "🔤", category: "Translation", desc: "Works offline with downloaded language packs", platforms: "iOS & Android" },
  { name: "WhatsApp", icon: "💬", category: "Communication", desc: "Free international messaging & calls", platforms: "iOS & Android" },
  { name: "XE Currency", icon: "💱", category: "Finance", desc: "Real-time exchange rates offline", platforms: "iOS & Android" },
  { name: "Airalo", icon: "📡", category: "Connectivity", desc: "eSIM data plans for 200+ countries", platforms: "iOS & Android" },
];

// Country-specific apps
const COUNTRY_APPS = {
  japan: {
    label: "Japan 🇯🇵",
    apps: [
      { name: "Suica", icon: "🚇", category: "Transport", desc: "IC card for trains, subway & convenience stores" },
      { name: "Japan Official Travel App", icon: "✈️", category: "Tourism", desc: "Official tourism info, transport routes, offline maps" },
      { name: "Hyperdia", icon: "🗓️", category: "Transport", desc: "Train & bus route planner" },
      { name: "LINE", icon: "💬", category: "Communication", desc: "Dominant messaging app in Japan" },
      { name: "PayPay", icon: "💳", category: "Payment", desc: "Widely accepted mobile payment" },
      { name: "Tabelog", icon: "🍜", category: "Food", desc: "Restaurant reviews & reservations" },
    ],
  },
  thailand: {
    label: "Thailand 🇹🇭",
    apps: [
      { name: "Grab", icon: "🚗", category: "Transport", desc: "Ride-hailing, food delivery, payments" },
      { name: "LINE", icon: "💬", category: "Communication", desc: "Primary messaging app in Thailand" },
      { name: "Agoda", icon: "🏨", category: "Hotels", desc: "Best hotel deals in Southeast Asia" },
      { name: "Foodpanda", icon: "🍕", category: "Food", desc: "Food delivery across Thailand" },
    ],
  },
  usa: {
    label: "United States 🇺🇸",
    apps: [
      { name: "Uber / Lyft", icon: "🚗", category: "Transport", desc: "Ride-hailing everywhere" },
      { name: "Yelp", icon: "⭐", category: "Food", desc: "Restaurant & business reviews" },
      { name: "TSA App", icon: "✈️", category: "Travel", desc: "Airport security wait times & travel info" },
      { name: "Venmo / Zelle", icon: "💸", category: "Payment", desc: "Split bills with friends" },
    ],
  },
  uk: {
    label: "United Kingdom 🇬🇧",
    apps: [
      { name: "Citymapper", icon: "🚇", category: "Transport", desc: "Best transit app for London & UK cities" },
      { name: "Trainline", icon: "🚆", category: "Transport", desc: "Buy train tickets in advance" },
      { name: "Bolt", icon: "🚗", category: "Transport", desc: "Cheaper Uber alternative" },
      { name: "Deliveroo", icon: "🍕", category: "Food", desc: "Food delivery" },
    ],
  },
  france: {
    label: "France 🇫🇷",
    apps: [
      { name: "SNCF Connect", icon: "🚆", category: "Transport", desc: "French train tickets & schedules" },
      { name: "Citymapper", icon: "🚇", category: "Transport", desc: "Paris transit planner" },
      { name: "Bolt / Free Now", icon: "🚗", category: "Transport", desc: "Taxis & ride-hailing" },
      { name: "TheFork (LaFourchette)", icon: "🍽️", category: "Food", desc: "Restaurant reservations in France" },
    ],
  },
  italy: {
    label: "Italy 🇮🇹",
    apps: [
      { name: "Trenitalia / Italo", icon: "🚆", category: "Transport", desc: "Italian high-speed train tickets" },
      { name: "FREE NOW", icon: "🚗", category: "Transport", desc: "Taxis in Italian cities" },
      { name: "TripAdvisor", icon: "⭐", category: "Tourism", desc: "Restaurant & attraction reviews" },
    ],
  },
  spain: {
    label: "Spain 🇪🇸",
    apps: [
      { name: "Renfe", icon: "🚆", category: "Transport", desc: "Spanish rail tickets" },
      { name: "Cabify", icon: "🚗", category: "Transport", desc: "Ride-hailing in Spain" },
      { name: "Glovo", icon: "🍕", category: "Food", desc: "Food & grocery delivery" },
    ],
  },
  germany: {
    label: "Germany 🇩🇪",
    apps: [
      { name: "DB Navigator", icon: "🚆", category: "Transport", desc: "Deutsche Bahn train tickets & schedules" },
      { name: "MVG Fahrinfo", icon: "🚇", category: "Transport", desc: "Munich public transport" },
      { name: "FREE NOW", icon: "🚗", category: "Transport", desc: "Taxis & ride-hailing" },
    ],
  },
  australia: {
    label: "Australia 🇦🇺",
    apps: [
      { name: "Opal Travel", icon: "🚇", category: "Transport", desc: "Sydney public transport card" },
      { name: "myki", icon: "🚌", category: "Transport", desc: "Melbourne public transport" },
      { name: "13cabs / Uber", icon: "🚗", category: "Transport", desc: "Taxis & ride-hailing" },
      { name: "ServiceNSW", icon: "📋", category: "Services", desc: "NSW government services" },
    ],
  },
  singapore: {
    label: "Singapore 🇸🇬",
    apps: [
      { name: "MyTransport.SG", icon: "🚇", category: "Transport", desc: "Official LTA transit app" },
      { name: "Grab", icon: "🚗", category: "Transport", desc: "Dominant ride-hailing & payments" },
      { name: "ez-link", icon: "💳", category: "Payment", desc: "Contactless transit payment" },
    ],
  },
  southkorea: {
    label: "South Korea 🇰🇷",
    apps: [
      { name: "Kakao T", icon: "🚗", category: "Transport", desc: "Dominant ride-hailing & taxi app" },
      { name: "Naver Maps", icon: "🗺️", category: "Navigation", desc: "Better than Google Maps in Korea" },
      { name: "KakaoTalk", icon: "💬", category: "Communication", desc: "Primary messaging app in Korea" },
      { name: "T-money", icon: "💳", category: "Payment", desc: "Transit card for Seoul metro & buses" },
    ],
  },
  india: {
    label: "India 🇮🇳",
    apps: [
      { name: "Ola / Uber", icon: "🚗", category: "Transport", desc: "Ride-hailing across India" },
      { name: "IRCTC Rail Connect", icon: "🚆", category: "Transport", desc: "Indian Railways ticket booking" },
      { name: "PhonePe / Google Pay", icon: "💳", category: "Payment", desc: "UPI payments everywhere" },
      { name: "Zomato / Swiggy", icon: "🍕", category: "Food", desc: "Food delivery" },
    ],
  },
  uae: {
    label: "UAE / Dubai 🇦🇪",
    apps: [
      { name: "Careem / Uber", icon: "🚗", category: "Transport", desc: "Ride-hailing in UAE" },
      { name: "RTA Dubai", icon: "🚇", category: "Transport", desc: "Dubai metro & bus schedules" },
      { name: "Noon / Amazon", icon: "🛒", category: "Shopping", desc: "Online shopping & delivery" },
    ],
  },
  mexico: {
    label: "Mexico 🇲🇽",
    apps: [
      { name: "DiDi", icon: "🚗", category: "Transport", desc: "Safer than Uber in many areas" },
      { name: "Rappi", icon: "🍕", category: "Food", desc: "Food & grocery delivery" },
      { name: "CityBus MX", icon: "🚌", category: "Transport", desc: "Bus routes in Mexican cities" },
    ],
  },
  brazil: {
    label: "Brazil 🇧🇷",
    apps: [
      { name: "99 / Uber", icon: "🚗", category: "Transport", desc: "Ride-hailing" },
      { name: "NuBank", icon: "💳", category: "Finance", desc: "Easy international card & payments" },
      { name: "iFood", icon: "🍕", category: "Food", desc: "Food delivery" },
    ],
  },
  vietnam: {
    label: "Vietnam 🇻🇳",
    apps: [
      { name: "Grab", icon: "🚗", category: "Transport", desc: "Ride-hailing, bikes, & food" },
      { name: "Zalo", icon: "💬", category: "Communication", desc: "Popular local messaging app" },
      { name: "VinBus", icon: "🚌", category: "Transport", desc: "Smart bus in Hanoi" },
    ],
  },
  indonesia: {
    label: "Indonesia / Bali 🇮🇩",
    apps: [
      { name: "Gojek", icon: "🚗", category: "Transport", desc: "Ride-hailing, food, payments" },
      { name: "Grab", icon: "🚗", category: "Transport", desc: "Alternative to Gojek" },
      { name: "Dana / OVO", icon: "💳", category: "Payment", desc: "Popular e-wallets" },
    ],
  },
  china: {
    label: "China 🇨🇳",
    apps: [
      { name: "WeChat", icon: "💬", category: "Communication", desc: "Essential for everything in China" },
      { name: "Alipay", icon: "💳", category: "Payment", desc: "Primary payment method - set up before you go" },
      { name: "DiDi", icon: "🚗", category: "Transport", desc: "Dominant ride-hailing app" },
      { name: "Baidu Maps", icon: "🗺️", category: "Navigation", desc: "Google Maps is blocked in China" },
    ],
  },
  turkey: {
    label: "Turkey 🇹🇷",
    apps: [
      { name: "BiTaksi", icon: "🚗", category: "Transport", desc: "Licensed taxis in Turkey" },
      { name: "İstanbulkart", icon: "💳", category: "Transport", desc: "Istanbul transit card & top-up" },
      { name: "Yemeksepeti", icon: "🍕", category: "Food", desc: "Food delivery in Turkey" },
    ],
  },
  israel: {
    label: "Israel 🇮🇱",
    apps: [
      { name: "Waze", icon: "🚗", category: "Navigation", desc: "Born in Israel - best for driving" },
      { name: "Gett", icon: "🚕", category: "Transport", desc: "Licensed taxi app" },
      { name: "Moovit", icon: "🚌", category: "Transport", desc: "Public transit planner" },
      { name: "10bis", icon: "🍕", category: "Food", desc: "Food delivery with work budget cards" },
    ],
  },
};

// Detect country from destination string
function detectCountry(destination) {
  const d = (destination || "").toLowerCase();
  if (/japan|tokyo|osaka|kyoto|hiroshima|nara|sapporo|fukuoka/.test(d)) return "japan";
  if (/thailand|bangkok|chiang mai|phuket|pattaya|koh samui/.test(d)) return "thailand";
  if (/usa|united states|new york|los angeles|chicago|miami|las vegas|san francisco|hawaii/.test(d)) return "usa";
  if (/uk|united kingdom|london|manchester|edinburgh|birmingham/.test(d)) return "uk";
  if (/france|paris|nice|lyon|marseille|bordeaux/.test(d)) return "france";
  if (/italy|rome|milan|florence|venice|naples|sicily/.test(d)) return "italy";
  if (/spain|madrid|barcelona|seville|valencia|malaga/.test(d)) return "spain";
  if (/germany|berlin|munich|hamburg|frankfurt|cologne/.test(d)) return "germany";
  if (/australia|sydney|melbourne|brisbane|perth|cairns/.test(d)) return "australia";
  if (/singapore/.test(d)) return "singapore";
  if (/south korea|korea|seoul|busan|jeju/.test(d)) return "southkorea";
  if (/india|delhi|mumbai|bangalore|goa|rajasthan|jaipur/.test(d)) return "india";
  if (/uae|dubai|abu dhabi|emirates/.test(d)) return "uae";
  if (/mexico|cancun|mexico city|tulum|playa del carmen/.test(d)) return "mexico";
  if (/brazil|rio|sao paulo|salvador|florianopolis/.test(d)) return "brazil";
  if (/vietnam|hanoi|ho chi minh|saigon|hoi an|da nang/.test(d)) return "vietnam";
  if (/indonesia|bali|jakarta|lombok|yogyakarta/.test(d)) return "indonesia";
  if (/china|beijing|shanghai|hong kong|guangzhou|shenzhen/.test(d)) return "china";
  if (/turkey|istanbul|ankara|antalya|cappadocia/.test(d)) return "turkey";
  if (/israel|tel aviv|jerusalem|eilat|haifa/.test(d)) return "israel";
  return null;
}

const CATEGORY_COLORS = {
  Transport: { bg: "#eff6ff", color: "#2563eb" },
  Navigation: { bg: "#f0fdf4", color: "#16a34a" },
  Communication: { bg: "#fdf4ff", color: "#9333ea" },
  Finance: { bg: "#fff7ed", color: "#ea580c" },
  Connectivity: { bg: "#f0fdf4", color: "#0891b2" },
  Payment: { bg: "#fefce8", color: "#ca8a04" },
  Food: { bg: "#fff1f2", color: "#e11d48" },
  Hotels: { bg: "#fff7ed", color: "#f97316" },
  Tourism: { bg: "#f0f9ff", color: "#0369a1" },
  Shopping: { bg: "#fdf4ff", color: "#7c3aed" },
  Services: { bg: "#f8fafc", color: "#475569" },
  Travel: { bg: "#fff7ed", color: "#f97316" },
};

export default function AppsTab({ trip }) {
  const { t } = useLanguage();
  const destination = trip?.destination || "";
  const countryKey = detectCountry(destination);
  const countryData = countryKey ? COUNTRY_APPS[countryKey] : null;

  return (
    <div style={{ paddingBottom: 48, display: "flex", flexDirection: "column", gap: 16, paddingTop: 8 }}>

      {/* Header */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
          📱 Recommended Apps for {destination || "your trip"}
        </p>
        <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
          Download these before you travel — some work offline
        </p>
      </div>

      {/* Country-specific apps */}
      {countryData && (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f3f4f6", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #f9fafb" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
              Essential for {countryData.label}
            </span>
          </div>
          {countryData.apps.map((app, i) => (
            <AppRow key={i} app={app} isLast={i === countryData.apps.length - 1} />
          ))}
        </div>
      )}

      {/* Universal travel apps */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f3f4f6", overflow: "hidden" }}>
        <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #f9fafb" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
            🌍 Universal Travel Apps
          </span>
        </div>
        {UNIVERSAL_APPS.map((app, i) => (
          <AppRow key={i} app={app} isLast={i === UNIVERSAL_APPS.length - 1} />
        ))}
      </div>

      {/* Tip card */}
      <div style={{
        background: "#fff7ed",
        borderRadius: 12,
        padding: "12px 14px",
        border: "1px solid #fed7aa",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 2 }}>
            Pro tip
          </div>
          <div style={{ fontSize: 12, color: "#b45309", lineHeight: 1.5 }}>
            Download offline maps and translation packs while on WiFi before your trip. Mobile data abroad can be expensive!
          </div>
        </div>
      </div>
    </div>
  );
}

function AppRow({ app, isLast }) {
  const style = CATEGORY_COLORS[app.category] || { bg: "#f9fafb", color: "#6b7280" };
  return (
    <div style={{
      padding: "12px 16px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      borderBottom: isLast ? "none" : "1px solid #f9fafb",
    }}>
      <div style={{ fontSize: 22, flexShrink: 0, width: 36, textAlign: "center" }}>
        {app.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{app.name}</span>
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 7px",
            borderRadius: 6,
            background: style.bg,
            color: style.color,
            flexShrink: 0,
          }}>
            {app.category}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>{app.desc}</div>
        {app.platforms && (
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{app.platforms}</div>
        )}
      </div>
    </div>
  );
}
