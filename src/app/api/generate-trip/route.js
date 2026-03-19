import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  // Always return JSON — never plain text
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { destination, startDate, endDate, travelers, budget, currency, style } = body;

    if (!destination || !startDate || !endDate || !budget) {
      return Response.json({ error: "Please fill in all fields: destination, dates, and budget." }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: "API key not configured. Please add ANTHROPIC_API_KEY in Vercel settings." }, { status: 500 });
    }

    const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000));

    const styleMap = {
      adventure: "adventure-focused with outdoor activities, hiking, and exciting experiences",
      relaxed: "relaxed and leisurely with beach time, spas, and slow-paced exploration",
      cultural: "culturally rich with museums, historical sites, local experiences and food",
      luxury: "luxury-oriented with fine dining, 5-star accommodations, and premium experiences",
    };

    const prompt = `You are an expert travel planner. Create a detailed, realistic travel itinerary.

Destination: ${destination}
Dates: ${startDate} to ${endDate} (${days} days)
Travelers: ${travelers}
Budget: ${budget} ${currency} total
Style: ${styleMap[style] || style || "balanced"}

IMPORTANT: Return ONLY a valid JSON object. No markdown. No explanation. No text before or after. Just the JSON.

{
  "summary": "2-3 sentence overview of this trip",
  "destination": "${destination}",
  "days": ${days},
  "travelers": ${Number(travelers) || 1},
  "total_estimated_cost": 0,
  "currency": "${currency || "USD"}",
  "style": "${style || "cultural"}",
  "daily_itinerary": [
    {
      "day": 1,
      "date": "${startDate}",
      "title": "Day theme title",
      "activities": [
        {
          "time": "morning",
          "name": "Activity name",
          "description": "2 sentence description of this activity.",
          "estimated_cost": 0
        }
      ],
      "daily_cost": 0,
      "accommodation": "Hotel or accommodation recommendation"
    }
  ],
  "budget_breakdown": {
    "accommodation": 0,
    "food": 0,
    "activities": 0,
    "transportation": 0,
    "other": 0
  },
  "tips": ["tip1", "tip2", "tip3", "tip4", "tip5"]
}

Rules:
- Replace all 0 values with realistic numbers for ${destination}
- Stay within ${budget} ${currency} total budget
- Include 3-4 activities per day
- All costs are for ALL ${travelers} travelers combined
- budget_breakdown values must add up to approximately total_estimated_cost`;

    let message;
    try {
      message = await client.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });
    } catch (apiErr) {
      console.error("Claude API error:", apiErr);
      return Response.json(
        { error: `AI service error: ${apiErr.message || "Please try again."}` },
        { status: 502 }
      );
    }

    const raw = message.content[0]?.text || "";

    // Extract JSON robustly
    let tripData;
    try {
      // Try direct parse first
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON object found in AI response");
      tripData = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("JSON parse error. Raw response:", raw.slice(0, 500));
      return Response.json(
        { error: "AI returned an unexpected format. Please try again." },
        { status: 500 }
      );
    }

    // Validate required fields
    if (!tripData.daily_itinerary || !Array.isArray(tripData.daily_itinerary)) {
      return Response.json(
        { error: "AI response was incomplete. Please try again." },
        { status: 500 }
      );
    }

    return Response.json(tripData);

  } catch (err) {
    console.error("Unexpected error:", err);
    return Response.json(
      { error: `Unexpected error: ${err.message || "Please try again."}` },
      { status: 500 }
    );
  }
}
