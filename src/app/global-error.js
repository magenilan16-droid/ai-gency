"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body style={{ margin: 0, background: "#FFF8F0", fontFamily: "sans-serif" }}>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#111", marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ color: "#6b7280", marginBottom: 24, fontSize: 14 }}>
            {error?.message || "Please refresh the page to continue."}
          </p>
          <button
            onClick={reset}
            style={{
              background: "linear-gradient(135deg,#f97316,#ec4899)",
              color: "white", border: "none", borderRadius: 12,
              padding: "12px 24px", fontWeight: 900, fontSize: 14, cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
