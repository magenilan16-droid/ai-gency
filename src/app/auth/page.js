"use client";
import { useState, useEffect } from "react";
import { supabase, createProfile } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // login | signup
  const [role, setRole] = useState("client"); // client | advisor
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check if coming from advisor referral
  const [refCode, setRefCode] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setRefCode(localStorage.getItem("aigency_ref") || "");
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (mode === "login") {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }
      router.push("/");
    } else {
      // Signup
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }

      if (data.user) {
        // Find advisor by referral code if exists
        let referredBy = null;
        if (refCode) {
          const { data: advisor } = await supabase
            .from("profiles")
            .select("id")
            .eq("referral_code", refCode.toUpperCase())
            .single();
          if (advisor) referredBy = advisor.id;
        }

        await createProfile({
          id: data.user.id,
          email,
          fullName,
          role,
          referredBy,
        });
      }

      setSuccess("Check your email to confirm your account!");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#ffffff" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-lg">A</div>
            <span className="font-bold text-xl text-gray-900">AI-gency</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === "login" ? "Sign in to your account" : "Start planning your trips"}
          </p>
        </div>

        {/* Role selector (signup only) */}
        {mode === "signup" && (
          <div className="flex gap-2 mb-5 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setRole("client")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                role === "client" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              Traveler
            </button>
            <button
              type="button"
              onClick={() => setRole("advisor")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                role === "advisor" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"
              }`}
            >
              Travel Advisor
            </button>
          </div>
        )}

        {role === "advisor" && mode === "signup" && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-100 rounded-xl text-xs text-orange-700">
            As a Travel Advisor you earn <strong>35%</strong> of every affiliate commission from clients you refer. You get a personal referral link to share.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
            />
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {success && <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
          >
            {loading ? "Loading..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            className="text-orange-500 font-semibold"
          >
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>

        <p className="text-center mt-4">
          <button onClick={() => router.push("/")} className="text-xs text-gray-400 hover:text-gray-600">
            Continue without account →
          </button>
        </p>
      </div>
    </div>
  );
}
