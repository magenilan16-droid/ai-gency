import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    const { destination, style, days } = await req.json();

    const prompt = `Generate 20 essential travel phrases for visiting ${destination}.
Style: ${style || "general"} trip, ${days || 5} days.

Return ONLY valid JSON:
{
  "language": "Language name in English",
  "flag": "🏳️ single flag emoji",
  "phrases": [
    {
      "english": "Hello",
      "local": "local word/phrase",
      "pronunciation": "how to say it phonetically",
      "usage": "When and how to use this phrase",
      "category": "essentials"
    }
  ]
}

Categories (3-4 phrases each): essentials, food, transport, shopping, emergency, social
Make pronunciation very easy to read for English speakers.
Be specific and practical. ONLY return valid JSON, no extra text.`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0]?.text || "";
    try {
      const match = text.match(/(\{[\s\S]*\})/);
      const parsed = JSON.parse(match ? match[0] : text);
      return Response.json({ ok: true, data: parsed });
    } catch {
      return Response.json({ ok: false, error: "Failed to parse phrases" }, { status: 500 });
    }
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
