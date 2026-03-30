"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdvisorDashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [clicks, setClicks] = useState([]);
  const [stats, setStats] = useState({ total_clicks: 0, total_earned: 0, pending: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "advisor")) {
      router.push("/auth");
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (!user || profile?.role !== "advisor") return;

    supabase
      .from("commission_clicks")
      .select("*")
      .eq("advisor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setClicks(data || []));

    supabase
      .from("profiles")
      .select("total_clicks, total_earned, pending_payout")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setStats({ total_clicks: data.total_clicks, total_earned: data.total_earned, pending: data.pending_payout });
      });
  }, [user, profile]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!profile) return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ai-gency.vercel.app";
  const refLink = `${appUrl}/?ref=${profile.referral_code}`;

  function copyLink() {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen pb-32" style={{ background: "#ffffff" }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-sm">←</Link>
          <div>
            <h1 className="font-bold text-xl text-gray-900">Advisor Dashboard</h1>
            <p className="text-xs text-gray-500">Hi {profile.full_name} 👋</p>
          </div>
        </div>

        {/* Commission info box */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-6">
          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Your Commission Rate</p>
          <p className="text-3xl font-bold text-orange-500">35%</p>
          <p className="text-xs text-orange-700 mt-1">Of every affiliate booking made by your referred clients</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total Clicks", value: stats.total_clicks },
            { label: "Total Earned", value: `$${(stats.total_earned || 0).toFixed(2)}` },
            { label: "Pending Payout", value: `$${(stats.pending || 0).toFixed(2)}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-3 text-center">
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Referral Link */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Referral Link</p>
          <div className="flex items-center gap-2">
            <p className="flex-1 text-xs text-gray-700 bg-gray-50 rounded-xl px-3 py-2 font-mono truncate">{refLink}</p>
            <button
              onClick={copyLink}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${copied ? "bg-green-100 text-green-600" : "bg-orange-500 text-white"}`}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Share this link with clients. Every booking they make earns you 35%.</p>
        </div>

        {/* How it works */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">How It Works</p>
          {[
            { num: "1", text: "Share your referral link with travelers" },
            { num: "2", text: "They sign up & plan trips via your link" },
            { num: "3", text: "They click affiliate links (hotels, tours, flights)" },
            { num: "4", text: "You earn 35% of every commission" },
            { num: "5", text: "Payouts via PayPal monthly" },
          ].map(({ num, text }) => (
            <div key={num} className="flex items-start gap-3 mb-2">
              <div className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{num}</div>
              <p className="text-sm text-gray-700">{text}</p>
            </div>
          ))}
        </div>

        {/* Recent clicks */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Activity</p>
          {clicks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No activity yet. Share your link to get started!</p>
          ) : (
            <div className="space-y-2">
              {clicks.slice(0, 10).map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800 capitalize">{c.affiliate_type || "Click"}</p>
                    <p className="text-xs text-gray-400">{c.destination || "—"} · {new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-lg font-semibold">+click</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={() => supabase.auth.signOut().then(() => router.push("/"))}
          className="w-full mt-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 font-medium"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
