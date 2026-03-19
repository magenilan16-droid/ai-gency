import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    const { type, trip, dayIndex, language } = await req.json();
    const langInstruction = language === "he" ? "CRITICAL: Write ALL text values in Hebrew (עברית). JSON keys stay in English." : "";

    let prompt = "";

    if (type === "packing") {
      prompt = `Create a packing list for a ${trip.days}-day ${trip.style || "leisure"} trip to ${trip.destination}.
Travelers: ${trip.travelers}. Dates: ${trip.form?.startDate} to ${trip.form?.endDate}.
${langInstruction}
Format as JSON: { "categories": [ { "name": "Category", "items": ["item1", "item2"] } ] }
Include 5-7 categories (Clothing, Documents, Electronics, Toiletries, Health, etc.) with 4-8 items each.
Make it specific to the destination and travel style. ONLY return valid JSON, no extra text.`;
    }

    if (type === "regenerate_day") {
      const day = trip.daily_itinerary?.[dayIndex];
      prompt = `Suggest 3 alternative activities for Day ${day?.day} of a ${trip.style || "leisure"} trip to ${trip.destination}.
Current day theme: "${day?.title}". Budget for the day: ${trip.currency} ${day?.daily_cost}.
${langInstruction}
Format as JSON array: [{ "time": "morning|afternoon|evening", "name": "Activity Name", "description": "Brief description", "estimated_cost": 50 }]
Make them exciting, authentic, and practical. ONLY return valid JSON array, no extra text.`;
    }

    if (type === "day_tip") {
      const day = trip.daily_itinerary?.[dayIndex];
      prompt = `Give 3 insider tips for Day ${day?.day} in ${trip.destination}: "${day?.title}".
Activities that day: ${day?.activities?.map(a => a.name).join(", ")}.
${langInstruction}
Format as JSON array of strings: ["tip1", "tip2", "tip3"]
Make them practical, specific, and not generic. ONLY return valid JSON array, no extra text.`;
    }

    if (type === "chat") {
      // Streaming chat — handled by /api/chat, but quick non-streaming version here
      const tripContext = `Trip: ${trip.destination}, ${trip.days} days, ${trip.style} style, budget ${trip.currency} ${trip.total_estimated_cost}`;
      prompt = `${tripContext}\nUser: ${req.body?.message || "Give me a tip"}`;
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0]?.text || "";

    // Try to parse JSON
    try {
      const match = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
      const parsed = JSON.parse(match ? match[0] : text);
      return Response.json({ ok: true, data: parsed });
    } catch {
      return Response.json({ ok: true, data: text });
    }
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
