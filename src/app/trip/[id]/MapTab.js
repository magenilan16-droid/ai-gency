"use client";

import { useMemo } from "react";
import { useLanguage } from "@/app/LanguageProvider";

const G = "linear-gradient(135deg,#f97316,#ec4899)";

function encodeDestination(dest) {
  return encodeURIComponent(dest || "");
}

export default function MapTab({ trip }) {
  const { t } = useLanguage();
  const destination = trip?.destination || "";

  const mapSrc = useMemo(() => {
    if (!destination) return null;
    return `https://maps.google.com/maps?q=${encodeDestination(destination)}&output=embed`;
  }, [destination]);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeDestination(destination)}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${encodeDestination(destination)}`;
  const wazeUrl = `https://waze.com/ul?q=${encodeDestination(destination)}&navigate=yes`;

  // Collect all activities from daily itinerary
  const attractions = useMemo(() => {
    const days = trip?.daily_itinerary;
    if (!Array.isArray(days)) return [];
    const result = [];
    days.forEach((day, dayIdx) => {
      if (Array.isArray(day?.activities)) {
        day.activities.forEach((activity) => {
          result.push({ text: activity, day: day.day || dayIdx + 1 });
        });
      }
    });
    return result;
  }, [trip]);

  return (
    <div style={{ padding: "16px 0 40px", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div
        style={{
          background: G,
          borderRadius: 20,
          padding: "20px 20px 16px",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.85, marginBottom: 4 }}>
          {t("map_title") || "Map & Navigation"}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>
          📍 {destination || "Destination"}
        </div>
      </div>

      {/* Map Embed */}
      <div
        style={{
          background: "var(--bg-card, #fff)",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
      >
        {mapSrc ? (
          <iframe
            title={`Map of ${destination}`}
            src={mapSrc}
            width="100%"
            height="320"
            style={{ border: "none", display: "block" }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div
            style={{
              height: 320,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-sub, #9ca3af)",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            No destination set
          </div>
        )}
      </div>

      {/* Navigation Links */}
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
          Open in Navigation App
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>

          {/* Google Maps */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 16px",
              borderRadius: 12,
              background: G,
              color: "#fff",
              fontWeight: 800,
              fontSize: 13,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            🗺️ {t("map_open_google") || "Google Maps"}
          </a>

          {/* Apple Maps */}
          <a
            href={appleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 16px",
              borderRadius: 12,
              background: "var(--bg-page, #f9fafb)",
              border: "2px solid #f3f4f6",
              color: "var(--text-main, #374151)",
              fontWeight: 800,
              fontSize: 13,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            🍎 {t("map_open_apple") || "Apple Maps"}
          </a>

          {/* Waze */}
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 16px",
              borderRadius: 12,
              background: "var(--bg-page, #f9fafb)",
              border: "2px solid #f3f4f6",
              color: "var(--text-main, #374151)",
              fontWeight: 800,
              fontSize: 13,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            🚗 {t("map_open_waze") || "Waze"}
          </a>
        </div>
      </div>

      {/* Attractions from Itinerary */}
      {attractions.length > 0 && (
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
              📌
            </span>
            {t("map_attractions") || "Attractions in Itinerary"}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {attractions.map((item, idx) => {
              const searchQuery = `${encodeDestination(item.text)} ${encodeDestination(destination)}`;
              const searchUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "12px 14px",
                    background: "var(--bg-page, #f9fafb)",
                    borderRadius: 12,
                    border: "2px solid transparent",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#f97316",
                        marginBottom: 2,
                      }}
                    >
                      Day {item.day}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-main, #111827)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.text}
                    </div>
                  </div>
                  <a
                    href={searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flexShrink: 0,
                      padding: "6px 12px",
                      borderRadius: 10,
                      background: "#fff7ed",
                      border: "2px solid #fed7aa",
                      color: "#f97316",
                      fontWeight: 800,
                      fontSize: 11,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    🗺️ Maps
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
