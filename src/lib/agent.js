// Agent referral tracking

export function getAgentCode() {
  if (typeof window === "undefined") return null;
  // Check URL first
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("agent");
  if (fromUrl) {
    // Save to localStorage for this session
    try { localStorage.setItem("aigency_referral_agent", fromUrl); } catch {}
    return fromUrl;
  }
  // Fallback to saved
  try { return localStorage.getItem("aigency_referral_agent") || null; } catch { return null; }
}

export function buildAffiliateUrl(baseUrl, agentCode) {
  if (!agentCode) return baseUrl;
  const sep = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${sep}ref=${agentCode}`;
}

// Affiliate IDs - to be filled in when available
export const AFFILIATE_IDS = {
  booking: "",      // e.g. "1234567"  → aid=1234567
  getyourguide: "", // e.g. "ABCD1234" → partner_id=ABCD1234
  skyscanner: "",   // token
  rentalcars: "",   // id
};

export function bookingUrl(destination, checkin, checkout, guests) {
  const base = `https://www.booking.com/search.html?ss=${encodeURIComponent(destination)}`;
  const params = [];
  if (checkin) params.push(`checkin=${checkin}`);
  if (checkout) params.push(`checkout=${checkout}`);
  if (guests) params.push(`group_adults=${guests}`);
  if (AFFILIATE_IDS.booking) params.push(`aid=${AFFILIATE_IDS.booking}`);
  return base + (params.length ? "&" + params.join("&") : "");
}

export function skyscannerUrl(origin, destination, date, guests) {
  const dest = destination.split(",")[0].toLowerCase().replace(/\s+/g, "-");
  const orig = (origin || "anywhere").toLowerCase().replace(/\s+/g, "-");
  return `https://www.skyscanner.net/transport/flights/${orig}/${dest}/${date || ""}/?adults=${guests || 1}`;
}

export function getYourGuideUrl(destination) {
  const dest = destination.split(",")[0].toLowerCase().replace(/\s+/g, "-");
  const base = `https://www.getyourguide.com/${dest}-l/`;
  return AFFILIATE_IDS.getyourguide
    ? `${base}?partner_id=${AFFILIATE_IDS.getyourguide}`
    : base;
}

export function rentalcarsUrl(destination, pickup, dropoff) {
  const dest = encodeURIComponent(destination.split(",")[0]);
  return `https://www.rentalcars.com/SearchResults.do?pick-up=${dest}&do=${dropoff || ""}&pu=${pickup || ""}`;
}
