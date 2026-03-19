"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/LanguageProvider";

const G = "linear-gradient(135deg,#f97316,#ec4899)";

const COUNTRY_COLORS = {
  japan:"#FF6B6B", france:"#667eea", italy:"#11998e", spain:"#ee0979",
  greece:"#2980B9", thailand:"#f7971e", bali:"#11998e", indonesia:"#11998e",
  "united states":"#4776E6", usa:"#4776E6", "united kingdom":"#4776E6", uk:"#4776E6",
  dubai:"#f7971e", uae:"#f7971e", israel:"#2980B9", portugal:"#e74c3c",
  turkey:"#e74c3c", morocco:"#f39c12", india:"#e67e22", vietnam:"#27ae60",
  "south korea":"#e74c3c", brazil:"#27ae60", argentina:"#3498db",
  australia:"#f39c12", germany:"#2c3e50", netherlands:"#f39c12",
  switzerland:"#e74c3c", croatia:"#3498db", jordan:"#e67e22",
  "south africa":"#27ae60", peru:"#e67e22", nepal:"#e74c3c",
  mexico:"#27ae60", "czech republic":"#3498db",
};

function countryColor(name) {
  if (!name) return "#f97316";
  const k = name.toLowerCase();
  for (const [key, val] of Object.entries(COUNTRY_COLORS)) {
    if (k.includes(key)) return val;
  }
  return "#f97316";
}

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
  return out;
}

function extractCountry(destination) {
  if (!destination) return null;
  const parts = destination.split(",");
  return parts[parts.length - 1]?.trim() || destination.trim();
}

// --- Wishlist helpers ---
function getWishlist() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("aigency_wishlist") || "[]"); } catch { return []; }
}
function saveWishlist(list) {
  localStorage.setItem("aigency_wishlist", JSON.stringify(list));
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-black text-gray-400 uppercase tracking-wide w-24 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-700 font-medium flex-1">{value}</span>
    </div>
  );
}

function CountryCard({ country, trips, wishlisted, onWishlistToggle }) {
  const [open, setOpen]       = useState(false);
  const [info, setInfo]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const { t } = useLanguage();
  const color = countryColor(country);
  const totalCost = trips.reduce((s, tr) => s + (tr.total_estimated_cost || 0), 0);
  const currency = trips[0]?.currency || "USD";

  async function loadInfo() {
    if (info) { setOpen(o => !o); return; }
    setOpen(true);
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/country-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInfo(data);
    } catch (e) {
      setError(t("retry_country"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden">
      {/* Card header */}
      <button onClick={loadInfo} className="w-full text-left">
        <div className="p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
            style={{ background: `${color}18` }}>
            {info?.flag || "🌍"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-gray-900 text-lg leading-tight">{country}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {trips.length} {trips.length === 1 ? "trip" : "trips"} · {currency} {totalCost.toLocaleString()} {t("planned_budget")}
            </p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {trips.map(tr => (
                <Link key={tr.id} href={`/trip/${tr.id}`}
                  onClick={e => e.stopPropagation()}
                  className="text-xs px-2 py-0.5 rounded-full font-bold text-white"
                  style={{ background: color }}>
                  {tr.destination?.split(",")[0]}
                </Link>
              ))}
            </div>
          </div>

          {/* Wishlist heart button */}
          <button
            onClick={e => { e.stopPropagation(); onWishlistToggle(country); }}
            className="flex-shrink-0 text-xl leading-none px-1 py-1 rounded-full hover:bg-orange-50 transition-colors"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            style={{ color: wishlisted ? "#f97316" : "#d1d5db" }}
          >
            {wishlisted ? "♥" : "♡"}
          </button>

          <div className="flex-shrink-0 text-gray-300 text-lg font-black transition-transform"
            style={{ transform: open ? "rotate(90deg)" : "none" }}>
            ›
          </div>
        </div>
      </button>

      {/* Expandable info */}
      {open && (
        <div className="px-5 pb-5 border-t border-orange-50">
          {loading && (
            <div className="flex items-center gap-3 py-6 justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-orange-300 border-t-orange-500 animate-spin" />
              <span className="text-sm text-gray-400 font-medium">{t("loading_country")}</span>
            </div>
          )}
          {error && (
            <button onClick={loadInfo} className="w-full py-4 text-sm text-red-400 font-medium">{error}</button>
          )}
          {info && (
            <div className="mt-4 space-y-1">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-orange-50 rounded-2xl p-3 text-center">
                  <div className="text-xs text-orange-400 font-black uppercase tracking-wide mb-1">{t("capital")}</div>
                  <div className="font-black text-gray-900 text-sm">{info.capital}</div>
                </div>
                <div className="bg-orange-50 rounded-2xl p-3 text-center">
                  <div className="text-xs text-orange-400 font-black uppercase tracking-wide mb-1">{t("currency_info")}</div>
                  <div className="font-black text-gray-900 text-sm">{info.currency}</div>
                </div>
                <div className="bg-orange-50 rounded-2xl p-3 text-center">
                  <div className="text-xs text-orange-400 font-black uppercase tracking-wide mb-1">{t("language_label")}</div>
                  <div className="font-black text-gray-900 text-sm">{info.language}</div>
                </div>
                <div className="bg-orange-50 rounded-2xl p-3 text-center">
                  <div className="text-xs text-orange-400 font-black uppercase tracking-wide mb-1">{t("timezone_label")}</div>
                  <div className="font-black text-gray-900 text-sm">{info.timezone}</div>
                </div>
              </div>

              <InfoRow label={t("best_time")} value={info.best_season} />
              <InfoRow label={t("visa_label")} value={info.visa} />
              <InfoRow label={t("safety_label")} value={info.safety} />

              {info.must_see?.length > 0 && (
                <div className="py-2 border-b border-gray-50">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-wide block mb-2">{t("must_see")}</span>
                  <div className="flex flex-wrap gap-2">
                    {info.must_see.map((s, i) => (
                      <span key={i} className="text-xs px-3 py-1.5 rounded-full font-bold text-white" style={{ background: color }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {info.local_tip && (
                <div className="mt-3 rounded-2xl p-4" style={{ background: `${color}12` }}>
                  <div className="text-xs font-black uppercase tracking-wide mb-1" style={{ color }}>{t("local_tip")}</div>
                  <p className="text-sm text-gray-700 font-medium leading-relaxed">{info.local_tip}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CountriesPage() {
  const [trips, setTrips]           = useState([]);
  const [mounted, setMounted]       = useState(false);
  const [wishlist, setWishlist]     = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [wishInput, setWishInput]   = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    setTrips(getAllTrips());
    setWishlist(getWishlist());
  }, []);

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-orange-300 border-t-transparent animate-spin" />
    </div>
  );

  // Group trips by country
  const byCountry = {};
  for (const trip of trips) {
    const c = extractCountry(trip.destination);
    if (!c) continue;
    if (!byCountry[c]) byCountry[c] = [];
    byCountry[c].push(trip);
  }
  const countryList = Object.entries(byCountry).sort((a, b) => b[1].length - a[1].length);

  // Filtered list based on search
  const filteredList = searchQuery.trim()
    ? countryList.filter(([country]) =>
        country.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : countryList;

  // Wishlist helpers
  const wishlistNames = wishlist.map(w => w.name);

  function handleWishlistToggle(countryName) {
    let updated;
    if (wishlistNames.includes(countryName)) {
      updated = wishlist.filter(w => w.name !== countryName);
    } else {
      updated = [...wishlist, { name: countryName, addedAt: Date.now() }];
    }
    setWishlist(updated);
    saveWishlist(updated);
  }

  function removeFromWishlist(countryName) {
    const updated = wishlist.filter(w => w.name !== countryName);
    setWishlist(updated);
    saveWishlist(updated);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <nav className="px-4 py-4 sticky top-0 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-between bg-white rounded-2xl px-5 py-3 shadow-sm border border-orange-100">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm font-medium">← {t("nav_home")}</Link>
          <span className="font-black text-gray-900">🌍 {t("your_world_map")}</span>
          <div className="w-16" />
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 pb-10">
        {/* Header */}
        <div className="py-6">
          <h1 className="text-3xl font-black text-gray-900">{t("your_world_map")}</h1>
          <p className="text-gray-400 mt-1 font-medium">
            {countryList.length > 0
              ? `${countryList.length} ${countryList.length === 1 ? t("countries_explored_single") : t("countries_explored_plural")} · ${t("tap_for_details")}`
              : t("no_countries_yet")}
          </p>
        </div>

        {/* ── Wishlist section — always visible ── */}
        <div className="mb-5 rounded-2xl border-2 p-4" style={{ borderColor: "#ffedd5", background: "var(--bg-card)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black text-orange-500">{t("dream_destinations_title")}</p>
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: "#fff7ed", color: "#f97316" }}>
              {t("items_saved", { n: wishlist.length })}
            </span>
          </div>

          {/* Add input */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={wishInput}
              onChange={e => setWishInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && wishInput.trim()) {
                  const name = wishInput.trim();
                  if (!wishlist.find(w => w.name.toLowerCase() === name.toLowerCase())) {
                    const updated = [...wishlist, { name, addedAt: Date.now() }];
                    setWishlist(updated);
                    saveWishlist(updated);
                  }
                  setWishInput("");
                }
              }}
              placeholder={t("add_destination_placeholder")}
              className="flex-1 text-sm px-3 py-2 rounded-xl border-2 outline-none transition-colors"
              style={{ borderColor: "#ffedd5", background: "var(--bg-page)" }}
            />
            <button
              onClick={() => {
                const name = wishInput.trim();
                if (!name) return;
                if (!wishlist.find(w => w.name.toLowerCase() === name.toLowerCase())) {
                  const updated = [...wishlist, { name, addedAt: Date.now() }];
                  setWishlist(updated);
                  saveWishlist(updated);
                }
                setWishInput("");
              }}
              className="px-4 py-2 rounded-xl text-white font-black text-sm flex-shrink-0"
              style={{ background: G }}
            >
              {t("add_btn")}
            </button>
          </div>

          {/* Wishlist items */}
          {wishlist.length === 0 ? (
            <p className="text-xs text-center py-3" style={{ color: "var(--text-muted)" }}>
              {t("no_wishlist_msg")}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {wishlist.map(w => (
                <div
                  key={w.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                  style={{ borderColor: "#fed7aa", background: "#fff7ed" }}
                >
                  <span className="text-xs font-bold" style={{ color: "#374151" }}>{w.name}</span>
                  <button
                    onClick={() => removeFromWishlist(w.name)}
                    className="font-black leading-none text-sm"
                    style={{ color: "#f97316" }}
                    aria-label={t("remove_wishlist_aria") + " " + w.name}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Plan from wishlist */}
          {wishlist.length > 0 && (
            <Link href="/plan"
              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white text-xs font-black"
              style={{ background: G }}>
              {t("plan_wishlist_trips")}
            </Link>
          )}
        </div>

        {countryList.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-gray-400 font-medium mb-6" style={{ whiteSpace: "pre-line" }}>{t("no_countries_desc")}</p>
            <Link href="/plan"
              className="inline-flex items-center gap-2 text-white font-black px-6 py-3 rounded-2xl shadow-lg"
              style={{ background: G }}>
              {t("plan_a_trip")}
            </Link>
          </div>
        ) : (
          <>
            {/* Search bar — shown only when there are countries */}
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t("countries_search")}
                className="w-full bg-white border border-orange-100 rounded-2xl pl-10 pr-10 py-3 text-sm font-medium text-gray-800 placeholder-gray-300 shadow-sm outline-none focus:border-orange-400 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg font-black leading-none"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            {/* No results message */}
            {filteredList.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 font-medium">{t("no_search_results", { q: searchQuery })}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredList.map(([country, cTrips]) => (
                  <CountryCard
                    key={country}
                    country={country}
                    trips={cTrips}
                    wishlisted={wishlistNames.includes(country)}
                    onWishlistToggle={handleWishlistToggle}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
