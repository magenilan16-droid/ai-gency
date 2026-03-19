import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    const { country, language } = await req.json();
    if (!country) return Response.json({ error: "Missing country" }, { status: 400 });
    const langInstruction = language === "he" ? "CRITICAL: Write ALL text values in Hebrew (עברית). JSON keys stay in English." : "";

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `Give me travel info about ${country}. ${langInstruction} Return ONLY valid JSON, no markdown:
{
  "flag": "flag emoji",
  "capital": "city",
  "language": "main language(s)",
  "currency": "Name (CODE)",
  "timezone": "UTC±X",
  "best_season": "best months to visit and why (1 sentence)",
  "visa": "visa situation for most Western tourists (1 sentence)",
  "must_see": ["top attraction 1", "top attraction 2", "top attraction 3"],
  "local_tip": "one essential cultural tip every visitor should know",
  "safety": "short safety rating note (e.g. Very safe, Safe with precautions)"
}`
      }],
    });

    const raw = message.content[0]?.text || "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    return Response.json(JSON.parse(match[0]));
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
