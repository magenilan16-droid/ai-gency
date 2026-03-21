import Anthropic from "@anthropic-ai/sdk";
export const maxDuration = 25;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    const { destination, attractions, language } = await req.json();
    if (!destination) return Response.json({ error: "Missing destination" }, { status: 400 });

    const langInstruction = language === "he" ? "Respond in Hebrew only." : "Respond in English.";
    const attrList = (attractions || []).slice(0, 8).join(", ");

    const prompt = `Generate realistic traveler reviews for ${destination}.
${attrList ? `Key attractions: ${attrList}.` : ""}
${langInstruction}

Return ONLY a JSON object (no markdown) with this shape:
{
  "destination_rating": 4.5,
  "destination_summary": "2-3 sentence overall summary",
  "highlights": ["top thing 1", "top thing 2", "top thing 3"],
  "watch_out": ["warning 1", "warning 2"],
  "reviews": [
    {
      "author": "Name",
      "country": "Country",
      "rating": 5,
      "title": "Review title",
      "text": "2-3 sentences review text",
      "date": "Month Year",
      "tags": ["tag1", "tag2"]
    }
  ]
}
Generate exactly 4 reviews with ratings 3-5. Make them realistic and varied (different travel styles). Include practical details.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
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
