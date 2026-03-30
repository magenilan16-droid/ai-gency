import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Lazy singleton — avoids crash during SSR/build when env vars are missing
let _client = null;
function getClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!_client) _client = createClient(supabaseUrl, supabaseAnonKey);
  return _client;
}

export const supabase = new Proxy({}, {
  get(_, prop) {
    const client = getClient();
    if (!client) return () => Promise.resolve({ data: null, error: new Error("Supabase not configured") });
    return client[prop].bind(client);
  }
});

// Get current user profile (includes role)
export async function getProfile(userId) {
  const client = getClient();
  if (!client) return null;
  const { data, error } = await client.from("profiles").select("*").eq("id", userId).single();
  if (error) return null;
  return data;
}

// Create profile after signup
export async function createProfile({ id, email, fullName, role, referredBy }) {
  const client = getClient();
  if (!client) return { data: null, error: new Error("Supabase not configured") };
  const { data, error } = await client.from("profiles").insert({
    id,
    email,
    full_name: fullName,
    role: role || "client",
    referred_by: referredBy || null,
  });
  return { data, error };
}

// Log affiliate click (for commission tracking)
export async function logCommissionClick({ advisorId, clientId, tripId, affiliateType, destination }) {
  const client = getClient();
  if (!client || !advisorId) return;
  await client.from("commission_clicks").insert({
    advisor_id: advisorId,
    client_id: clientId || null,
    trip_id: tripId || null,
    affiliate_type: affiliateType,
    destination: destination || null,
  });
}

// Save trip to Supabase (for logged-in users)
export async function saveTripToCloud(userId, tripId, tripData) {
  const client = getClient();
  if (!client) return false;
  const { error } = await client.from("trips").upsert({
    id: tripId,
    user_id: userId,
    destination: tripData.destination || "",
    data: tripData,
  });
  return !error;
}

// Get all trips for a user
export async function getTripsFromCloud(userId) {
  const client = getClient();
  if (!client) return [];
  const { data, error } = await client
    .from("trips")
    .select("id, destination, created_at, data")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data;
}
