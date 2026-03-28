// fawazahmed0/currency-api via jsDelivr CDN — completely free, no API key, no rate limit
// https://github.com/fawazahmed0/exchange-api

export const maxDuration = 10;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const from = (searchParams.get("from") || "USD").toUpperCase();
  const toParam = searchParams.get("to") || "";
  const targets = toParam
    ? toParam.toUpperCase().split(",").filter(Boolean)
    : null;

  try {
    const baseLower = from.toLowerCase();
    // Primary CDN URL (jsDelivr)
    const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${baseLower}.json`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Currency CDN error: ${res.status}`);
    const json = await res.json();

    const allRates = json[baseLower] || {};

    // Convert keys to uppercase and filter to requested targets
    const rates = {};
    const wantedKeys = targets || Object.keys(allRates).map(k => k.toUpperCase());
    for (const t of wantedKeys) {
      const lower = t.toLowerCase();
      if (allRates[lower] != null) {
        rates[t] = allRates[lower];
      }
    }

    return Response.json({ ok: true, base: from, rates, date: json.date });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
