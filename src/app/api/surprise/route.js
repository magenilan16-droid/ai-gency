import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    const { startDate, endDate, travelers, budget, currency, style, accommodation } = await req.json();

    if (!startDate || !endDate || !budget) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000));

    const styleDesc = {
      adventure: "adventure-focused: outdoor activities, hiking, extreme sports",
      relaxed: "relaxed & slow-paced: beaches, spas, lazy exploration",
      cultural: "culturally rich: museums, history, local food & markets",
      luxury: "luxury: fine dining, 5-star hotels, premium experiences",
      nightlife: "nightlife & social: bars, clubs, local social scene",
      culinary: "food & culinary focused: street food, markets, cooking classes",
    };

    const prompt = `You are a surprise travel planner. Pick the PERFECT surprise destination for this traveler, then generate a complete itinerary.

TRAVELER PROFILE:
- Budget: ${currency} ${budget} total for ${travelers} traveler(s)
- Dates: ${startDate} to ${endDate} (${days} days)
- Style: ${styleDesc[style] || style || "balanced"}
- Accommodation: ${accommodation || "mid-range"}

RULES for picking the destination:
- Pick somewhere EXCITING and UNEXPECTED that matches their style
- Must be realistic within their budget (include flights estimate)
- Avoid the most obvious tourist clichés
- Consider: safety, current travel trends, value for money, uniqueness

Return ONLY valid JSON (no markdown, no text outside JSON):
{
  "surprise_reveal": "One teasing sentence that hints at the destination without naming it (e.g. 'Get ready for ancient temples, street food paradise and epic sunsets...')",
  "destination": "City, Country",
  "summary": "3-sentence personalized overview of why this destination is perfect for them",
  "days": ${days},
  "travelers": ${Number(travelers) || 1},
  "total_estimated_cost": 0,
  "currency": "${currency}",
  "style": "${style || "cultural"}",
  "accommodation": "${accommodation || "mid-range"}",
  "daily_itinerary": [
    {
      "day": 1,
      "date": "${startDate}",
      "title": "Descriptive day theme",
      "activities": [
        { "time": "morning", "name": "Activity", "description": "2-sentence description with local details.", "estimated_cost": 0 },
        { "time": "afternoon", "name": "Activity", "description": "Description.", "estimated_cost": 0 },
        { "time": "evening", "name": "Activity", "description": "Description.", "estimated_cost": 0 }
      ],
      "daily_cost": 0,
      "accommodation": "Hotel/area recommendation"
    }
  ],
  "budget_breakdown": { "accommodation": 0, "food": 0, "activities": 0, "transportation": 0, "other": 0 },
  "tips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5"],
  "recommended_hotels": [
    { "name": "Hotel Name", "stars": 3, "area": "Neighborhood", "why": "Why stay here", "price_per_night": 0 }
  ],
  "recommended_restaurants": [
    { "name": "Restaurant", "type": "Cuisine", "price_range": "$$", "must_try": "Dish" }
  ]
}

Replace ALL 0s with realistic numbers. Stay within ${budget} ${currency} total. Make it amazing.`;

    let message;
    try {
      message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });
    } catch (apiErr) {
      return Response.json({ error: `AI error: ${apiErr.message}` }, { status: 502 });
    }

    const raw = message.content[0]?.text || "";
    let tripData;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      tripData = JSON.parse(jsonMatch[0]);
    } catch {
      return Response.json({ error: "AI returned unexpected format. Please try again." }, { status: 500 });
    }

    if (!tripData.daily_itinerary || !tripData.destination) {
      return Response.json({ error: "Incomplete response. Please try again." }, { status: 500 });
    }

    return Response.json({ ...tripData, form: { startDate, endDate, travelers, budget, currency, style, accommodation } });
  } catch (err) {
    return Response.json({ error: `Error: ${err.message}` }, { status: 500 });
  }
}
