// Frankfurter API - completely free, no API key needed
// https://www.frankfurter.app/

export const maxDuration = 10;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || "USD";
  const to = searchParams.get("to") || "EUR,GBP,ILS,JPY,AUD,CAD,THB,BRL,MXN,SGD";

  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`, {
      next: { revalidate: 3600 }, // cache for 1 hour
    });
    const data = await res.json();
    return Response.json({ ok: true, base: data.base, rates: data.rates, date: data.date });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
