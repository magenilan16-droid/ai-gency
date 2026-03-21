import Anthropic from "@anthropic-ai/sdk";
export const maxDuration = 20;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    const { destination, nationality, language } = await req.json();
    if (!destination) return Response.json({ error: "Missing destination" }, { status: 400 });

    const langInstruction = language === "he" ? "Respond in Hebrew only." : "Respond in English.";
    const nat = nationality || "Israeli";

    const prompt = `Visa requirements for a ${nat} passport holder traveling to ${destination}.
${langInstruction}

Return ONLY a JSON object (no markdown, no code blocks) with this exact shape:
{
  "visa_required": true/false,
  "visa_type": "e-visa" | "on-arrival" | "embassy" | "visa-free",
  "duration_days": number or null,
  "cost_usd": number or null,
  "processing_days": number or null,
  "notes": "short practical note",
  "requirements": ["list", "of", "documents"],
  "apply_url": "official gov URL or null",
  "passport_validity_months": number or null
}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0]?.text?.trim() || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    return Response.json({ ok: true, data });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
