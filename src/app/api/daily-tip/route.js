import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 20;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    const body = await req.json();
    const { destination, style, language } = body;
    const daysUntil = body.days_until ?? body.daysUntil ?? null;
    if (!destination) return Response.json({ error: "Missing destination" }, { status: 400 });

    const langInstruction = language === "he" ? "Respond in Hebrew only." : "Respond in English.";
    const context = daysUntil === null ? "The trip is coming up soon."
      : daysUntil <= 0 ? "The trip is happening now or just ended."
      : daysUntil === 1 ? "The trip is tomorrow!"
      : daysUntil <= 7 ? `The trip is in ${daysUntil} days — very soon!`
      : `The trip is in ${daysUntil} days.`;

    const prompt = `Give ONE practical travel tip for ${destination}. ${context} ${langInstruction}
Make it specific, actionable, and relevant to the timing. Keep it under 2 sentences. No fluff.
Just return the tip text directly, no JSON, no title.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });

    const tip = message.content[0]?.text?.trim() || "";
    return Response.json({ ok: true, tip });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
