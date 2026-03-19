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
      ? `AI-assessed budget breakdown: flights ${currency} ${budgetBreakdown.flights}, accommodation ${budgetBreakdown.accommodation}, food ${budgetBreakdown.food}, activities ${budgetBreakdown.activities}, other ${budgetBreakdown.other}.`
      : "";

    const prompt = `You are an expert travel planner. Create a highly personalized, realistic itinerary.

TRIP DETAILS:
- Destination: ${destination}
- Dates: ${startDate} to ${endDate} (${days} days)
- Travelers: ${travelers}
- Total Budget: ${budget} ${currency}
- Style: ${styleDesc[style] || style || "balanced"}
- Accommodation: ${accomDesc[accommodation] || "mid-range hotels"}
- Food: ${foodDesc[foodStyle] || "mix of local and restaurants"}
- ${interestStr}
- ${budgetHint}

Return ONLY valid JSON. No markdown. No text outside the JSON.

{
  "summary": "3-sentence personalized overview mentioning their specific preferences",
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
      "title": "Descriptive day theme",
      "activities": [
        { "time": "morning", "name": "Specific activity name", "description": "2-sentence description with local details.", "estimated_cost": 0 },
        { "time": "afternoon", "name": "Activity name", "description": "Description.", "estimated_cost": 0 },
        { "time": "evening", "name": "Activity name", "description": "Description.", "estimated_cost": 0 }
      ],
      "daily_cost": 0,
      "accommodation": "Specific hotel/area recommendation with brief reason"
    }
  ],
  "budget_breakdown": {
    "accommodation": 0,
    "food": 0,
    "activities": 0,
    "transportation": 0,
    "other": 0
  },
  "tips": ["Practical tip 1", "Practical tip 2", "Practical tip 3", "Cultural tip", "Money-saving tip"],
  "recommended_hotels": [
    { "name": "Hotel Name", "stars": 4, "area": "Neighborhood", "why": "One reason to stay here", "price_per_night": 0 }
  ],
  "recommended_restaurants": [
    { "name": "Restaurant name", "type": "Cuisine type", "price_range": "$$", "must_try": "Dish name" }
  ]
}

Rules:
- Replace ALL 0s with realistic numbers for ${destination}
- Stay within ${budget} ${currency} total
- Include 3-4 activities per day matching their style and interests
- Costs are for ALL ${travelers} travelers combined
- budget_breakdown must sum to approximately total_estimated_cost
- Make activity descriptions specific to ${destination} — real places, real neighborhoods
- recommended_hotels: 3 options matching their accommodation preference
- recommended_restaurants: 4-5 options matching their food style`;

    let message;
    try {
      message = await client.messages.create({
        model: "claude-opus-4-6",
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

    if (!tripData.daily_itinerary || !Array.isArray(tripData.daily_itinerary)) {
      return Response.json({ error: "Incomplete response. Please try again." }, { status: 500 });
    }

    return Response.json(tripData);
  } catch (err) {
    return Response.json({ error: `Error: ${err.message}` }, { status: 500 });
  }
}
