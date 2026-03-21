"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const G = "linear-gradient(135deg,#f97316,#ec4899)";

export default function ForAgentsPage() {
  const [form, setForm] = useState({ name: "", agency: "", whatsapp: "", email: "" });
  const [submitted, setSubmitted] = useState(false);
  const [agentCode, setAgentCode] = useState("");
  const [agentLink, setAgentLink] = useState("");
  const [copied, setCopied] = useState(false);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const code = `AGT-${form.name.slice(0, 3).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const link = `https://${window.location.host}/plan?agent=${code}`;
    const profile = { ...form, code, link, createdAt: new Date().toISOString() };
    try { localStorage.setItem("aigency_agent_profile", JSON.stringify(profile)); } catch {}
    setAgentCode(code);
    setAgentLink(link);
    setSubmitted(true);
  }

  function copyLink() {
    navigator.clipboard.writeText(agentLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(`Plan your trip with AI! ${agentLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  const steps = [
    { num: "1", icon: "🔗", title: "Sign up free", desc: "Get your unique agent link in 30 seconds" },
    { num: "2", icon: "📲", title: "Share with clients", desc: "Send the link via WhatsApp, email, or SMS" },
    { num: "3", icon: "💰", title: "Earn on bookings", desc: "Earn commission when clients book hotels, activities, flights" },
  ];

  const features = [
    { icon: "🗺️", title: "AI day-by-day itinerary", desc: "Personalized plan for every destination" },
    { icon: "🏨", title: "Hotel recommendations", desc: "With direct booking links" },
    { icon: "🎒", title: "Packing list & local tips", desc: "Local phrases and weather info" },
    { icon: "💵", title: "Budget tracker", desc: "Track every expense on the go" },
    { icon: "🛂", title: "Visa requirements", desc: "Up-to-date entry info per destination" },
    { icon: "🔗", title: "Shareable trip link", desc: "Clients can share their plan instantly" },
  ];

  return (
    <div style={{ background: "var(--bg-page, #fafafa)", minHeight: "100vh", fontFamily: "sans-serif" }}>

      {/* ── Hero ── */}
      <section style={{ background: G, color: "white", padding: "64px 24px 80px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="dot-live" />
            <span className="label-micro" style={{ color: "rgba(255,255,255,0.85)" }}>FOR TRAVEL PROFESSIONALS</span>
          </div>
          <h1 className="tracking-tighter font-black" style={{ fontSize: "clamp(32px, 6vw, 56px)", lineHeight: 1.1, marginBottom: 20 }}>
            Give Your Clients a 5-Star Planning Experience — For Free
          </h1>
          <p style={{ fontSize: "clamp(15px, 2.5vw, 20px)", opacity: 0.9, lineHeight: 1.6, marginBottom: 36, maxWidth: 520, margin: "0 auto 36px" }}>
            Your clients get an AI travel planner. You get commission on every booking.
          </p>
          <a
            href="#signup"
            style={{
              display: "inline-block",
              background: "white",
              color: "#f97316",
              fontWeight: 900,
              fontSize: 16,
              padding: "16px 36px",
              borderRadius: 999,
              textDecoration: "none",
              boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            }}
          >
            Get Your Agent Link →
          </a>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto px-4 mb-8" style={{ marginTop: "-2rem", position: "relative", zIndex: 10 }}>
        {[
          { value: "8%", label: "Commission on activities" },
          { value: "Free", label: "Forever for agents" },
          { value: "30s", label: "Setup time" },
        ].map((s, i) => (
          <div key={i} className="rounded-[1.5rem] p-4 text-center shadow-sm" style={{ background: "white", border: "1px solid #ffedd5" }}>
            <div className="text-2xl font-black tracking-tighter text-orange-500">{s.value}</div>
            <div className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── How it works ── */}
      <section style={{ padding: "48px 24px 64px", maxWidth: 720, margin: "0 auto" }}>
        <h2 className="tracking-tighter font-black" style={{ textAlign: "center", fontSize: 28, color: "#111", marginBottom: 12 }}>How it works</h2>
        <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 40, fontSize: 15 }}>Three simple steps to start earning</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 24 }}>
          {steps.map(s => (
            <div key={s.num} className="card-hover rounded-[1.75rem]" style={{
              background: "white",
              border: "1px solid #ffedd5",
              padding: "32px 24px",
              textAlign: "center",
              boxShadow: "0 2px 12px rgba(249,115,22,0.07)",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%", background: G, color: "white",
                fontWeight: 900, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px"
              }}>{s.num}</div>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <h3 className="tracking-tighter font-black" style={{ fontSize: 16, color: "#111", marginBottom: 6 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What clients get ── */}
      <section style={{ background: "#fff7ed", padding: "64px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 className="tracking-tighter font-black" style={{ textAlign: "center", fontSize: 28, color: "#111", marginBottom: 12 }}>What your clients get</h2>
          <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 40, fontSize: 15 }}>Everything they need for a perfect trip</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
            {features.map(f => (
              <motion.div key={f.title} whileHover={{ y: -4 }} className="rounded-[1.5rem]" style={{
                background: "white",
                border: "1px solid #ffedd5",
                padding: "24px 20px",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                cursor: "default",
              }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <div className="tracking-tighter font-black" style={{ fontSize: 14, color: "#111", marginBottom: 4 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Signup form ── */}
      <section id="signup" style={{ padding: "64px 24px", maxWidth: 520, margin: "0 auto" }}>
        <h2 className="tracking-tighter font-black" style={{ textAlign: "center", fontSize: 28, color: "#111", marginBottom: 8 }}>
          {submitted ? "You're in! 🎉" : "Get your free agent link"}
        </h2>
        <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 32, fontSize: 15 }}>
          {submitted ? "Share this link with your clients to start earning commissions." : "Takes 30 seconds. No credit card needed."}
        </p>

        {submitted ? (
          <div className="rounded-[2rem]" style={{
            background: "white", border: "2px solid #f97316",
            padding: 32, boxShadow: "0 8px 32px rgba(249,115,22,0.12)"
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f97316", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Your Agent Code</div>
              <div style={{
                background: "#fff7ed", border: "1px solid #ffedd5", borderRadius: 12,
                padding: "12px 16px", fontWeight: 900, fontSize: 18, color: "#ea580c", letterSpacing: 2
              }}>{agentCode}</div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Your Unique Link</div>
              <div style={{
                background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12,
                padding: "12px 16px", fontSize: 13, color: "#374151", wordBreak: "break-all", lineHeight: 1.5
              }}>{agentLink}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={copyLink} style={{
                background: copied ? "#22c55e" : G,
                color: "white", border: "none", borderRadius: 14, padding: "14px 20px",
                fontWeight: 900, fontSize: 15, cursor: "pointer", transition: "all 0.2s"
              }}>
                {copied ? "✓ Copied!" : "Copy Link"}
              </button>
              <button onClick={shareWhatsApp} style={{
                background: "#25d366", color: "white", border: "none", borderRadius: 14,
                padding: "14px 20px", fontWeight: 900, fontSize: 15, cursor: "pointer"
              }}>
                📲 Share on WhatsApp
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-[2rem]" style={{
            background: "white", border: "1px solid #ffedd5",
            padding: 32, boxShadow: "0 8px 32px rgba(249,115,22,0.12)"
          }}>
            {[
              { name: "name", label: "Your Name", type: "text", placeholder: "John Smith" },
              { name: "agency", label: "Agency Name", type: "text", placeholder: "Smith Travel Agency" },
              { name: "whatsapp", label: "WhatsApp Number", type: "tel", placeholder: "+1 555 000 0000" },
              { name: "email", label: "Email Address", type: "email", placeholder: "john@agency.com" },
            ].map(field => (
              <div key={field.name} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                  {field.label}
                </label>
                <input
                  required
                  name={field.name}
                  type={field.type}
                  value={form[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 12,
                    border: "2px solid #ffedd5", fontSize: 14, fontWeight: 600,
                    outline: "none", boxSizing: "border-box", color: "#111",
                  }}
                  onFocus={e => e.target.style.borderColor = "#f97316"}
                  onBlur={e => e.target.style.borderColor = "#ffedd5"}
                />
              </div>
            ))}
            <button type="submit" style={{
              width: "100%", padding: "16px", borderRadius: 14, border: "none",
              background: G, color: "white", fontWeight: 900, fontSize: 16, cursor: "pointer",
              marginTop: 8, boxShadow: "0 4px 16px rgba(249,115,22,0.3)"
            }}>
              Get My Agent Link →
            </button>
          </form>
        )}
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid #ffedd5", padding: "28px 24px",
        textAlign: "center", color: "#9ca3af", fontSize: 13
      }}>
        <p style={{ marginBottom: 8 }}>
          Questions?{" "}
          <a href="https://wa.me/" target="_blank" rel="noopener noreferrer"
            style={{ color: "#f97316", fontWeight: 700, textDecoration: "none" }}>
            Contact us on WhatsApp
          </a>
        </p>
        <Link href="/" style={{ color: "#f97316", fontWeight: 700, textDecoration: "none" }}>
          ← Back to AI-gency
        </Link>
      </footer>
    </div>
  );
}
