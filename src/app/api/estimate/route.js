import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    const { destination, days, travelers, style, language } = await req.json();
    if (!destination || !days) return Response.json({ error: "Missing fields" }, { status: 400 });

    const langInstruction = language === "he" ? "CRITICAL: Write ALL text values in Hebrew. JSON keys stay in English." : "";

    const prompt = `Estimate realistic travel costs for: ${destination}, ${days} days, ${travelers || 1} traveler(s), ${style || "mid-range"} style. ${langInstruction}
Return ONLY valid JSON:
{
  "total_min": 1500,
  "total_max": 2500,
  "currency": "USD",
  "per_day_min": 200,
  "per_day_max": 350,
  "breakdown": {
    "flights": { "min": 400, "max": 700, "note": "round trip estimate" },
    "accommodation": { "min": 50, "max": 120, "note": "per night" },
    "food": { "min": 30, "max": 60, "note": "per day" },
    "activities": { "min": 20, "max": 50, "note": "per day" },
    "transport": { "min": 10, "max": 25, "note": "per day local" }
  },
  "tips": ["money saving tip 1", "money saving tip 2", "money saving tip 3"],
  "best_months": "best months to visit for value",
  "verdict": "one sentence: is this destination budget-friendly or expensive?"
}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0]?.text || "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    return Response.json({ ok: true, data: JSON.parse(match[0]) });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
