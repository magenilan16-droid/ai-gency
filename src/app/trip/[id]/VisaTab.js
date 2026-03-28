"use client";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/app/LanguageProvider";

export default function VisaTab({ trip }) {
  const { t, lang } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nationality, setNationality] = useState("Israeli");
  const fetchedRef = useRef(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("aigency_prefs");
      if (stored) {
        const prefs = JSON.parse(stored);
        if (prefs.nationality) setNationality(prefs.nationality);
      }
    } catch {}
  }, []);

  const cacheKey = `aigency_visa_${trip?.destination}_${nationality}`;

  const fetchVisa = async (nat = nationality) => {
    setLoading(true);
    setError(null);

    try {
      const cached = localStorage.getItem(`aigency_visa_${trip?.destination}_${nat}`);
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
        return;
      }
    } catch {}

    try {
      const res = await fetch("/api/visa-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: trip?.destination,
          nationality: nat,
          language: lang,
        }),
      });
      const json = await res.json();
      if (json.ok && json.data) {
        setData(json.data);
        try {
          localStorage.setItem(
            `aigency_visa_${trip?.destination}_${nat}`,
            JSON.stringify(json.data)
          );
        } catch {}
      } else {
        setError(json.error || "Failed to load visa info");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!fetchedRef.current && trip?.destination && nationality) {
      fetchedRef.current = true;
      fetchVisa(nationality);
    }
  }, [trip?.destination, nationality]);

  const handleNationalityChange = (e) => {
    setNationality(e.target.value);
  };

  const handleNationalitySubmit = (e) => {
    e.preventDefault();
    fetchedRef.current = false;
    fetchVisa(nationality);
    fetchedRef.current = true;
  };

  const gradientStyle = {
    background: "linear-gradient(135deg,#f97316,#ec4899)",
  };

  return (
    <div style={{ color: "var(--text-main)" }}>
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "1rem",
          padding: "1.5rem",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div
            style={{
              ...gradientStyle,
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem",
            }}
          >
            🛂
          </div>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
            {t("visa_title") || "Visa Requirements"}
          </h2>
        </div>

        <form onSubmit={handleNationalitySubmit} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-sub)",
                marginBottom: "0.25rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {t("visa_your_nationality") || "Your passport"}
            </label>
            <input
              type="text"
              value={nationality}
              onChange={handleNationalityChange}
              placeholder="e.g. Israeli, American, British"
              style={{
                width: "100%",
                padding: "0.625rem 0.875rem",
                background: "var(--bg-page)",
                border: "1px solid var(--border)",
                borderRadius: "0.625rem",
                color: "var(--text-main)",
                fontSize: "0.9375rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              ...gradientStyle,
              alignSelf: "flex-end",
              padding: "0.625rem 1.25rem",
              border: "none",
              borderRadius: "0.625rem",
              color: "#fff",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontSize: "0.875rem",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "..." : t("retry") || "Retry"}
          </button>
        </form>
      </div>

      {loading && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "1rem",
            padding: "2rem",
            textAlign: "center",
            color: "var(--text-sub)",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔍</div>
          <p style={{ margin: 0 }}>Checking visa requirements...</p>
        </div>
      )}

      {error && !loading && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid #fca5a5",
            borderRadius: "1rem",
            padding: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div style={{ color: "#ef4444", fontSize: "0.9375rem" }}>
            ⚠️ {error}
          </div>
          <button
            onClick={() => fetchVisa(nationality)}
            style={{
              ...gradientStyle,
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "0.5rem",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.875rem",
              flexShrink: 0,
            }}
          >
            {t("retry") || "Retry"}
          </button>
        </div>
      )}

      {data && !loading && (
        <>
          <div
            style={{
              background: "var(--bg-card)",
              border: `2px solid ${data.visa_required ? "#f97316" : "#22c55e"}`,
              borderRadius: "1rem",
              padding: "1.5rem",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.75rem",
                borderRadius: "9999px",
                background: data.visa_required
                  ? "linear-gradient(135deg,#f97316,#ec4899)"
                  : "linear-gradient(135deg,#22c55e,#16a34a)",
                color: "#fff",
                fontWeight: 800,
                fontSize: "1.25rem",
                letterSpacing: "0.05em",
                marginBottom: "0.75rem",
              }}
            >
              {data.visa_required
                ? `✗ ${t("visa_required") || "Visa Required"}`
                : `✓ ${t("visa_free") || "Visa Free"}`}
            </div>

            {data.visa_type && (
              <div style={{ color: "var(--text-sub)", fontSize: "0.9375rem", textTransform: "capitalize" }}>
                {data.visa_type.replace(/-/g, " ")}
              </div>
            )}

            {data.notes && (
              <p style={{ margin: "0.75rem 0 0", color: "var(--text-sub)", fontSize: "0.9375rem", lineHeight: 1.5 }}>
                {data.notes}
              </p>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            {data.duration_days != null && (
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.875rem",
                  padding: "1rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>📅</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-sub)", marginBottom: "0.25rem" }}>
                  {t("visa_duration") || "Stay allowed"}
                </div>
                <div style={{ fontWeight: 700, fontSize: "1.125rem" }}>
                  {data.duration_days} days
                </div>
              </div>
            )}

            {data.cost_usd != null && (
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.875rem",
                  padding: "1rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>💵</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-sub)", marginBottom: "0.25rem" }}>
                  {t("visa_cost") || "Visa cost"}
                </div>
                <div style={{ fontWeight: 700, fontSize: "1.125rem" }}>
                  {data.cost_usd === 0 ? "Free" : `$${data.cost_usd}`}
                </div>
              </div>
            )}

            {data.processing_days != null && (
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.875rem",
                  padding: "1rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>⏱️</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-sub)", marginBottom: "0.25rem" }}>
                  {t("visa_processing") || "Processing"}
                </div>
                <div style={{ fontWeight: 700, fontSize: "1.125rem" }}>
                  {data.processing_days} days
                </div>
              </div>
            )}

            {data.passport_validity_months != null && (
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.875rem",
                  padding: "1rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>🛂</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-sub)", marginBottom: "0.25rem" }}>
                  Passport validity
                </div>
                <div style={{ fontWeight: 700, fontSize: "1.125rem" }}>
                  {data.passport_validity_months}mo min
                </div>
              </div>
            )}
          </div>

          {data.requirements?.length > 0 && (
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "1rem",
                padding: "1.25rem",
                marginBottom: "1rem",
              }}
            >
              <h3 style={{ margin: "0 0 0.875rem", fontSize: "0.9375rem", fontWeight: 700 }}>
                {t("visa_requirements") || "What you need"}
              </h3>
              <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                {data.requirements.map((req, i) => (
                  <li
                    key={i}
                    style={{
                      color: "var(--text-sub)",
                      fontSize: "0.9375rem",
                      lineHeight: 1.6,
                      marginBottom: i < data.requirements.length - 1 ? "0.25rem" : 0,
                    }}
                  >
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.apply_url && (
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "1rem",
                padding: "1.25rem",
              }}
            >
              <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", fontWeight: 700 }}>
                {t("visa_apply") || "Apply online"}
              </h3>
              <a
                href={/^https?:\/\//.test(data.apply_url) ? data.apply_url : "#"}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  ...gradientStyle,
                  color: "#fff",
                  padding: "0.625rem 1.25rem",
                  borderRadius: "0.625rem",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  textDecoration: "none",
                }}
              >
                Official Application Portal →
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
