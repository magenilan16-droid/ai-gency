"use client";

import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/app/LanguageProvider";

function encodeDestination(dest) {
  return encodeURIComponent(dest || "");
}

export default function MapTab({ trip }) {
  const { t } = useLanguage();
  const destination = trip?.destination || "";
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (!destination) return;
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1&accept-language=en`,
      { headers: { "User-Agent": "AI-gency Travel App" } }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data?.[0]) {
          setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
        }
      })
      .catch(() => {});
  }, [destination]);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeDestination(destination)}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${encodeDestination(destination)}`;
  const wazeUrl = `https://waze.com/ul?q=${encodeDestination(destination)}&navigate=yes`;

  // Build Google Maps embed URL (works without API key for search)
  const embedUrl = coords
    ? `https://maps.google.com/maps?q=${coords.lat},${coords.lon}&t=m&z=13&output=embed`
    : `https://maps.google.com/maps?q=${encodeDestination(destination)}&t=m&z=12&output=embed`;

  // Collect all activities from daily itinerary
  const attractions = useMemo(() => {
    const days = trip?.daily_itinerary;
    if (!Array.isArray(days)) return [];
    const result = [];
    days.forEach((day, dayIdx) => {
      if (Array.isArray(day?.activities)) {
        day.activities.forEach((activity) => {
          const activityName =
            typeof activity === "string" ? activity : activity?.name || "";
          if (activityName) {
            result.push({ text: activityName, day: day.day || dayIdx + 1 });
          }
        });
      }
    });
    return result;
  }, [trip]);

  return (
    <div style={{ paddingBottom: 48, display: "flex", flexDirection: "column", gap: 16, paddingTop: 8 }}>

      {/* Navigation buttons — always visible first */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "18px 16px", border: "1px solid #f3f4f6" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
          📍 {destination || "Destination"}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 12, background: "#f97316", color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none" }}
          >
            🗺️ Google Maps
          </a>
          <a
            href={appleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 12, background: "#fff", border: "1px solid #e5e7eb", color: "#374151", fontWeight: 700, fontSize: 13, textDecoration: "none" }}
          >
            🍎 Apple Maps
          </a>
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 12, background: "#fff", border: "1px solid #e5e7eb", color: "#374151", fontWeight: 700, fontSize: 13, textDecoration: "none" }}
          >
            🚗 Waze
          </a>
        </div>
      </div>

      {/* Google Maps Embed */}
      <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #f3f4f6" }}>
        <iframe
          title={`Map of ${destination}`}
          src={embedUrl}
          width="100%"
          height="280"
          style={{ border: "none", display: "block" }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* Attractions from Itinerary */}
      {attractions.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 16, padding: "18px 16px", border: "1px solid #f3f4f6" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
            📌 {t("map_attractions") || "Attractions in Itinerary"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {attractions.map((item, idx) => {
              const searchQuery = `${encodeDestination(item.text)},${encodeDestination(destination)}`;
              const searchUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
              return (
                <div
                  key={idx}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", background: "#f9fafb", borderRadius: 12 }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, color: "#f97316", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 6, padding: "1px 7px", marginBottom: 3 }}>
                      Day {item.day}
                    </span>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.text}
                    </div>
                  </div>
                  <a
                    href={searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 10, background: "#fff7ed", border: "1px solid #fed7aa", color: "#f97316", fontWeight: 700, fontSize: 11, textDecoration: "none" }}
                  >
                    🗺️ Open
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
