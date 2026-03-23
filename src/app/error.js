"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("App Error:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background: "#FFF8F0",
      fontFamily: "sans-serif",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: "#111", marginBottom: 8 }}>
        Something went wrong
      </h2>
      <p style={{
        color: "#6b7280",
        marginBottom: 8,
        maxWidth: 400,
        fontSize: 14,
        lineHeight: 1.6,
      }}>
        {error?.message || "An unexpected error occurred"}
      </p>
      {process.env.NODE_ENV !== "production" && error?.stack && (
        <pre style={{
          background: "#fee2e2",
          border: "1px solid #fca5a5",
          borderRadius: 8,
          padding: 16,
          fontSize: 11,
          textAlign: "left",
          maxWidth: 600,
          overflow: "auto",
          marginBottom: 24,
          color: "#dc2626",
        }}>
          {error.stack}
        </pre>
      )}
      <button
        onClick={reset}
        style={{
          background: "linear-gradient(135deg,#f97316,#ec4899)",
          color: "white",
          border: "none",
          borderRadius: 12,
          padding: "12px 24px",
          fontWeight: 900,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
