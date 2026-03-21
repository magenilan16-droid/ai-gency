"use client";

import { useState, useEffect } from "react";

function StarRating({ rating, large = false }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  const size = large ? "text-3xl" : "text-base";

  return (
    <span className={`${size} leading-none`} aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(full)}
      {half ? "½" : ""}
      {"☆".repeat(empty)}
    </span>
  );
}

function CountryFlag({ country }) {
  const flags = {
    "United States": "🇺🇸", "USA": "🇺🇸", "UK": "🇬🇧", "United Kingdom": "🇬🇧",
    "Germany": "🇩🇪", "France": "🇫🇷", "Spain": "🇪🇸", "Italy": "🇮🇹",
    "Japan": "🇯🇵", "Australia": "🇦🇺", "Canada": "🇨🇦", "Brazil": "🇧🇷",
    "India": "🇮🇳", "China": "🇨🇳", "Israel": "🇮🇱", "Netherlands": "🇳🇱",
    "Sweden": "🇸🇪", "Norway": "🇳🇴", "Denmark": "🇩🇰", "Switzerland": "🇨🇭",
    "Portugal": "🇵🇹", "Mexico": "🇲🇽", "Argentina": "🇦🇷", "South Korea": "🇰🇷",
    "New Zealand": "🇳🇿", "Singapore": "🇸🇬", "Thailand": "🇹🇭", "Poland": "🇵🇱",
  };
  return <span>{flags[country] || "🌍"}</span>;
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div
        className="w-10 h-10 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin"
        aria-label="Loading"
      />
      <p className="text-sm" style={{ color: "var(--text-sub)" }}>
        Loading reviews…
      </p>
    </div>
  );
}

export default function ReviewsTab({ trip }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const destination = trip?.destination || "";
  const cacheKey = `aigency_reviews_${destination}`;

  const allAttractions = (trip?.daily_itinerary || [])
    .flatMap((d) => (d.activities || []).map((a) => a.name || a))
    .filter(Boolean)
    .slice(0, 8);

  const lang =
    typeof window !== "undefined"
      ? localStorage.getItem("aigency_lang") || "en"
      : "en";

  function t(key) {
    const map = {
      reviews_title: undefined,
      reviews_highlights: undefined,
      reviews_watch_out: undefined,
      reviews_disclaimer: undefined,
      retry: undefined,
    };
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("aigency_translations");
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed[key] ?? map[key];
        }
      }
    } catch (_) {}
    return map[key];
  }

  async function fetchReviews() {
    setLoading(true);
    setError(null);
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
        return;
      }

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, attractions: allAttractions, language: lang }),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to load reviews");

      localStorage.setItem(cacheKey, JSON.stringify(json.data));
      setData(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (destination) fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination]);

  return (
    <div className="flex flex-col gap-6 px-1">
      {/* Header */}
      <h2 className="text-xl font-bold" style={{ color: "var(--text-main)" }}>
        {t("reviews_title") || "Traveler Reviews"}
      </h2>

      {/* Loading */}
      {loading && <LoadingSpinner />}

      {/* Error */}
      {error && !loading && (
        <div
          className="flex flex-col items-center gap-3 py-12 rounded-2xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={fetchReviews}
            className="px-5 py-2 rounded-full text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #f97316, #fb923c)" }}
          >
            {t("retry") || "Retry"}
          </button>
        </div>
      )}

      {/* Content */}
      {data && !loading && (
        <>
          {/* Overall rating card */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-2"
            style={{
              background: "linear-gradient(135deg, #fff7ed, #ffedd5)",
              border: "1px solid #fed7aa",
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-orange-500">
                <StarRating rating={data.destination_rating || 0} large />
              </span>
              <span className="text-3xl font-bold" style={{ color: "var(--text-main)" }}>
                {data.destination_rating?.toFixed(1)}
              </span>
              <span className="text-sm font-medium" style={{ color: "var(--text-sub)" }}>
                / 5
              </span>
            </div>
            {data.destination_summary && (
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-main)" }}>
                {data.destination_summary}
              </p>
            )}
          </div>

          {/* Highlights & Watch out */}
          {(data.highlights?.length > 0 || data.watch_out?.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Highlights */}
              {data.highlights?.length > 0 && (
                <div
                  className="rounded-2xl p-4 flex flex-col gap-2"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <h3 className="text-sm font-semibold text-green-600">
                    {t("reviews_highlights") || "Highlights"}
                  </h3>
                  <ul className="flex flex-col gap-1">
                    {data.highlights.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-main)" }}>
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Watch out */}
              {data.watch_out?.length > 0 && (
                <div
                  className="rounded-2xl p-4 flex flex-col gap-2"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <h3 className="text-sm font-semibold text-orange-500">
                    {t("reviews_watch_out") || "Watch Out"}
                  </h3>
                  <ul className="flex flex-col gap-1">
                    {data.watch_out.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-main)" }}>
                        <span className="text-orange-400 mt-0.5">⚠</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Review cards */}
          {data.reviews?.length > 0 && (
            <div className="flex flex-col gap-4">
              {data.reviews.map((review, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-5 flex flex-col gap-3"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  {/* Author row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
                        style={{ background: "linear-gradient(135deg, #f97316, #fb923c)" }}
                      >
                        {review.author?.[0] || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-tight" style={{ color: "var(--text-main)" }}>
                          {review.author}
                        </p>
                        <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-sub)" }}>
                          <CountryFlag country={review.country} />
                          {review.country}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-orange-400 text-sm leading-none">
                        <StarRating rating={review.rating || 0} />
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-sub)" }}>
                        {review.date}
                      </span>
                    </div>
                  </div>

                  {/* Title + text */}
                  {review.title && (
                    <p className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                      {review.title}
                    </p>
                  )}
                  {review.text && (
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-sub)" }}>
                      {review.text}
                    </p>
                  )}

                  {/* Tags */}
                  {review.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {review.tags.map((tag, j) => (
                        <span
                          key={j}
                          className="px-2.5 py-0.5 rounded-full text-xs font-medium text-orange-600"
                          style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <p
            className="text-xs text-center pb-2"
            style={{ color: "var(--text-sub)" }}
          >
            * {t("reviews_disclaimer") || "AI-generated for planning purposes"}
          </p>
        </>
      )}
    </div>
  );
}
