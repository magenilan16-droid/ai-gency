"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [advisors, setAdvisors] = useState([]);
  const [allClicks, setAllClicks] = useState([]);
  const [allUsers, setAllUsers] = useState({ total: 0, clients: 0, advisors: 0 });

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) {
      router.push("/");
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (!user || profile?.role !== "admin") return;

    // Load advisors
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "advisor")
      .order("created_at", { ascending: false })
      .then(({ data }) => setAdvisors(data || []));

    // Load recent clicks
    supabase
      .from("commission_clicks")
      .select("*, profiles!advisor_id(full_name, referral_code)")
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setAllClicks(data || []));

    // Count users
    supabase
      .from("profiles")
      .select("role")
      .then(({ data }) => {
        if (!data) return;
        setAllUsers({
          total: data.length,
          clients: data.filter(u => u.role === "client").length,
          advisors: data.filter(u => u.role === "advisor").length,
        });
      });
  }, [user, profile]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!profile || profile.role !== "admin") return null;

  return (
    <div className="min-h-screen pb-32" style={{ background: "#ffffff" }}>
      <div className="px-4 pt-12 pb-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center text-white font-bold">⚡</div>
          <div>
            <h1 className="font-bold text-xl text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-500">AI-gency Commission Tracker</p>
          </div>
        </div>

        {/* User stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total Users", value: allUsers.total },
            { label: "Clients", value: allUsers.clients },
            { label: "Advisors", value: allUsers.advisors },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Advisors list */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Travel Advisors</p>
          {advisors.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No advisors yet</p>
          ) : (
            <div className="space-y-3">
              {advisors.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{a.full_name || a.email}</p>
                    <p className="text-xs text-gray-400">Code: <span className="font-mono font-semibold">{a.referral_code || "—"}</span> · Joined {new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-orange-500">${(a.total_earned || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">earned</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent affiliate clicks */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Affiliate Clicks</p>
          {allClicks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No clicks yet</p>
          ) : (
            <div className="space-y-2">
              {allClicks.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800 capitalize">{c.affiliate_type}</p>
                    <p className="text-xs text-gray-400">
                      {c.destination || "—"} · by {c.profiles?.full_name || "direct"} · {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">click</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Set yourself as admin instruction */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs text-gray-500">
          <p className="font-semibold mb-1">To become admin:</p>
          <p>Run this in Supabase SQL editor:</p>
          <code className="block bg-white rounded-lg p-2 mt-2 font-mono text-xs text-gray-700">
            UPDATE profiles SET role = &apos;admin&apos; WHERE email = &apos;your@email.com&apos;;
          </code>
        </div>

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
