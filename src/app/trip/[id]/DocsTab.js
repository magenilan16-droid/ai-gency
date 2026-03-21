"use client";
import { useState, useRef } from "react";
import { useLanguage } from "@/app/LanguageProvider";

const CATEGORIES = [
  { key: "passport", emoji: "🛂" },
  { key: "tickets", emoji: "✈️" },
  { key: "hotel", emoji: "🏨" },
  { key: "insurance", emoji: "🛡️" },
  { key: "other", emoji: "📄" },
];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function estimateStorageSize(docs) {
  return docs.reduce((sum, doc) => sum + (doc.data?.length || 0), 0);
}

export default function DocsTab({ trip }) {
  const { t } = useLanguage();
  const [docs, setDocs] = useState(() => {
    try {
      const stored = localStorage.getItem(`aigency_docs_${trip?.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [activeCategory, setActiveCategory] = useState("all");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const saveDocs = (updated) => {
    setDocs(updated);
    try {
      localStorage.setItem(`aigency_docs_${trip?.id}`, JSON.stringify(updated));
    } catch {}
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);

    let processed = 0;
    const newDocs = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        newDocs.push({
          id: `doc_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: file.name,
          category: "other",
          type: file.type,
          data: ev.target.result,
          size: file.size,
          addedAt: new Date().toISOString(),
        });
        processed++;
        if (processed === files.length) {
          saveDocs([...docs, ...newDocs]);
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCategoryChange = (docId, category) => {
    const updated = docs.map((d) => (d.id === docId ? { ...d, category } : d));
    saveDocs(updated);
  };

  const handleDelete = (docId) => {
    saveDocs(docs.filter((d) => d.id !== docId));
  };

  const filteredDocs =
    activeCategory === "all" ? docs : docs.filter((d) => d.category === activeCategory);

  const totalStorageBytes = estimateStorageSize(docs);
  const isStorageHeavy = totalStorageBytes > 5 * 1024 * 1024;

  const gradientStyle = { background: "linear-gradient(135deg,#f97316,#ec4899)" };

  const categoryLabel = (key) => {
    const map = {
      passport: t("docs_passport") || "Passport",
      tickets: t("docs_tickets") || "Tickets",
      hotel: t("docs_hotel") || "Hotel",
      insurance: t("docs_insurance") || "Insurance",
      other: t("docs_other") || "Other",
    };
    return map[key] || key;
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
              📁
            </div>
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
              {t("docs_title") || "Documents Vault"}
            </h2>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              ...gradientStyle,
              padding: "0.625rem 1.25rem",
              border: "none",
              borderRadius: "0.625rem",
              color: "#fff",
              fontWeight: 600,
              cursor: uploading ? "not-allowed" : "pointer",
              opacity: uploading ? 0.7 : 1,
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            {uploading ? "Uploading..." : `+ ${t("docs_add") || "Add Document"}`}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      {isStorageHeavy && (
        <div
          style={{
            background: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: "0.75rem",
            padding: "0.875rem 1.25rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#92400e",
            fontSize: "0.875rem",
          }}
        >
          ⚠️ You have {formatBytes(totalStorageBytes)} of documents stored. Consider removing files you no longer need.
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        <button
          onClick={() => setActiveCategory("all")}
          style={{
            padding: "0.375rem 0.875rem",
            borderRadius: "9999px",
            border: "1px solid var(--border)",
            background: activeCategory === "all" ? "linear-gradient(135deg,#f97316,#ec4899)" : "var(--bg-card)",
            color: activeCategory === "all" ? "#fff" : "var(--text-sub)",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.8125rem",
          }}
        >
          {t("docs_all") || "All"} ({docs.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = docs.filter((d) => d.category === cat.key).length;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              style={{
                padding: "0.375rem 0.875rem",
                borderRadius: "9999px",
                border: "1px solid var(--border)",
                background:
                  activeCategory === cat.key
                    ? "linear-gradient(135deg,#f97316,#ec4899)"
                    : "var(--bg-card)",
                color: activeCategory === cat.key ? "#fff" : "var(--text-sub)",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.8125rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              {cat.emoji} {categoryLabel(cat.key)} ({count})
            </button>
          );
        })}
      </div>

      {filteredDocs.length === 0 ? (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "1rem",
            padding: "3rem 1.5rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📂</div>
          <p style={{ margin: 0, color: "var(--text-sub)", fontSize: "0.9375rem" }}>
            {t("docs_empty") || "No documents yet"}
          </p>
          <p style={{ margin: "0.5rem 0 0", color: "var(--text-sub)", fontSize: "0.8125rem" }}>
            Add your passport, tickets, hotel confirmations and more.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filteredDocs.map((doc) => {
            const cat = CATEGORIES.find((c) => c.key === doc.category) || CATEGORIES[4];
            return (
              <div
                key={doc.id}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "1rem",
                  padding: "1rem 1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    width: "2.75rem",
                    height: "2.75rem",
                    borderRadius: "0.625rem",
                    background: "var(--bg-page)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.375rem",
                    flexShrink: 0,
                  }}
                >
                  {cat.emoji}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.9375rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {doc.name}
                  </div>
                  <div style={{ color: "var(--text-sub)", fontSize: "0.8125rem", marginTop: "0.125rem" }}>
                    {formatBytes(doc.size)} · {new Date(doc.addedAt).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0, flexWrap: "wrap" }}>
                  <select
                    value={doc.category}
                    onChange={(e) => handleCategoryChange(doc.id, e.target.value)}
                    style={{
                      padding: "0.375rem 0.5rem",
                      background: "var(--bg-page)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.5rem",
                      color: "var(--text-main)",
                      fontSize: "0.8125rem",
                      cursor: "pointer",
                    }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.emoji} {categoryLabel(c.key)}
                      </option>
                    ))}
                  </select>

                  <a
                    href={doc.data}
                    download={doc.name}
                    style={{
                      padding: "0.375rem 0.75rem",
                      background: "var(--bg-page)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.5rem",
                      color: "var(--text-main)",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    ⬇️ {t("docs_download") || "Download"}
                  </a>

                  <button
                    onClick={() => handleDelete(doc.id)}
                    style={{
                      padding: "0.375rem 0.75rem",
                      background: "transparent",
                      border: "1px solid #fca5a5",
                      borderRadius: "0.5rem",
                      color: "#ef4444",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    🗑️ {t("docs_delete") || "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
