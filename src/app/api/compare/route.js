import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    const { dest1, dest2, days, style, language } = await req.json();
    if (!dest1 || !dest2) return Response.json({ error: "Missing destinations" }, { status: 400 });

    const langInstruction = language === "he" ? "CRITICAL: Write ALL text values in Hebrew. JSON keys stay in English." : "";

    const prompt = `Compare these two travel destinations for a ${days || 7}-day ${style || "mid-range"} trip: "${dest1}" vs "${dest2}". ${langInstruction}
Return ONLY valid JSON:
{
  "dest1": {
    "name": "${dest1}",
    "emoji": "flag emoji",
    "cost_estimate": "$1500-2500",
    "weather": "brief weather note for travel",
    "visa_israelis": "visa free / on arrival / required",
    "highlights": ["highlight 1", "highlight 2", "highlight 3"],
    "best_for": "type of traveler this suits best",
    "downside": "main downside",
    "safety": "Safe / Mostly safe / Use caution",
    "score": 8
  },
  "dest2": {
    "name": "${dest2}",
    "emoji": "flag emoji",
    "cost_estimate": "$1200-2000",
    "weather": "brief weather note for travel",
    "visa_israelis": "visa free / on arrival / required",
    "highlights": ["highlight 1", "highlight 2", "highlight 3"],
    "best_for": "type of traveler this suits best",
    "downside": "main downside",
    "safety": "Safe / Mostly safe / Use caution",
    "score": 7
  },
  "verdict": "one clear recommendation sentence saying which is better and why",
  "winner": "dest1 or dest2"
}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
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
