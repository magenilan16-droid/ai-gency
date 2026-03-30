import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get current user profile (includes role)
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data;
}

// Create profile after signup
export async function createProfile({ id, email, fullName, role, referredBy }) {
  const { data, error } = await supabase.from("profiles").insert({
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
  if (!advisorId) return;
  await supabase.from("commission_clicks").insert({
    advisor_id: advisorId,
    client_id: clientId || null,
    trip_id: tripId || null,
    affiliate_type: affiliateType,
    destination: destination || null,
  });
}

// Save trip to Supabase (for logged-in users)
export async function saveTripToCloud(userId, tripId, tripData) {
  const { error } = await supabase.from("trips").upsert({
    id: tripId,
    user_id: userId,
    destination: tripData.destination || "",
    data: tripData,
  });
  return !error;
}

// Get all trips for a user
export async function getTripsFromCloud(userId) {
  const { data, error } = await supabase
    .from("trips")
    .select("id, destination, created_at, data")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data;
}
