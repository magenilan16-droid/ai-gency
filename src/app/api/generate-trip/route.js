import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }

    const { destination, startDate, endDate, travelers, budget, currency, style, accommodation, foodStyle, interests, budgetBreakdown } = body;

    if (!destination || !startDate || !endDate || !budget) {
      return Response.json({ error: "Missing required fields: destination, dates, budget." }, { status: 400 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: "API key not configured." }, { status: 500 });
    }

    const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000));

    const styleDesc = {
      adventure: "adventure-focused: outdoor activities, hiking, extreme sports",
      relaxed: "relaxed & slow-paced: beaches, spas, lazy exploration",
      cultural: "culturally rich: museums, history, local food & markets",
      luxury: "luxury: fine dining, 5-star hotels, premium experiences",
    };
    const accomDesc = {
      budget: "budget accommodation (hostels, guesthouses, 2★ hotels)",
      "mid-range": "mid-range hotels (3★, clean and comfortable)",
      comfort: "comfort hotels (4★, good amenities)",
      luxury: "luxury hotels and resorts (5★)",
    };
    const foodDesc = {
      street: "street food and local cheap eateries",
      mixed: "mix of local restaurants and occasional nice dinners",
      fine: "fine dining and rooftop restaurants",
    };

    const interestStr = interests?.length ? `Special interests: ${interests.join(", ")}.` : "";
    const budgetHint = budgetBreakdown
      ? `Budget breakdown hint: flights ${currency} ${budgetBreakdown.flights}, accommodation ${budgetBreakdown.accommodation}, food ${budgetBreakdown.food}, activities ${budgetBreakdown.activities}, other ${budgetBreakdown.other}.`
      : "";

    // For long trips, use compact format to fit within token limits
    const isLong = days > 8;
    const activitiesPerDay = isLong ? 2 : 3;
    const descLength = isLong ? "ONE short sentence" : "1-2 sentences with local details";
    const restaurantCount = isLong ? 3 : 5;
    const maxTokens = isLong ? 6000 : 4096;

    const prompt = `You are an expert travel planner. Create a personalized itinerary. Be CONCISE — descriptions must be ${descLength} max.

TRIP:
- Destination: ${destination}
- Dates: ${startDate} to ${endDate} (${days} days)
- Travelers: ${travelers} | Budget: ${budget} ${currency}
- Style: ${styleDesc[style] || style || "balanced"}
- Accommodation: ${accomDesc[accommodation] || "mid-range"}
- ${interestStr}
- ${budgetHint}

Return ONLY valid JSON. No markdown. No text outside JSON.

{
  "summary": "2-sentence personalized overview",
  "destination": "${destination}",
  "days": ${days},
  "travelers": ${Number(travelers) || 1},
  "total_estimated_cost": 0,
  "currency": "${currency || "USD"}",
  "style": "${style || "cultural"}",
  "accommodation": "${accommodation || "mid-range"}",
  "daily_itinerary": [
    {
      "day": 1,
      "date": "${startDate}",
      "title": "Day theme (3-4 words)",
      "activities": [
        { "time": "morning", "name": "Activity name", "description": "${descLength}.", "estimated_cost": 0 },
        { "time": "afternoon", "name": "Activity name", "description": "${descLength}.", "estimated_cost": 0 }${activitiesPerDay > 2 ? `,\n        { "time": "evening", "name": "Activity name", "description": "${descLength}.", "estimated_cost": 0 }` : ""}
      ],
      "daily_cost": 0,
      "accommodation": "Hotel name, area"
    }
  ],
  "budget_breakdown": { "accommodation": 0, "food": 0, "activities": 0, "transportation": 0, "other": 0 },
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "recommended_hotels": [
    { "name": "Hotel", "stars": 3, "area": "Area", "why": "Brief reason", "price_per_night": 0 }
  ],
  "recommended_restaurants": [
    { "name": "Restaurant", "type": "Cuisine", "price_range": "$$", "must_try": "Dish" }
  ]
}

CRITICAL RULES:
- Generate ALL ${days} days — do NOT stop early
- Replace ALL 0s with realistic numbers
- Stay within ${budget} ${currency} total
- budget_breakdown must sum to total_estimated_cost
- recommended_hotels: 3 options | recommended_restaurants: ${restaurantCount} options
- Keep descriptions SHORT (${descLength}) to save space`;

    let message;
    try {
      message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: maxTokens,
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

    if (!tripData.daily_itinerary || !Array.isArray(tripData.daily_itinerary)) {
      return Response.json({ error: "Incomplete response. Please try again." }, { status: 500 });
    }

    return Response.json(tripData);
  } catch (err) {
    return Response.json({ error: `Error: ${err.message}` }, { status: 500 });
  }
}
