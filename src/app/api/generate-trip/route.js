import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60; // Fix Vercel timeout

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const body = await request.json();
    const { destination, startDate, endDate, travelers, budget, currency, style } = body;

    if (!destination || !startDate || !endDate || !budget) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
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
Style: ${styleMap[style] || style}

Return ONLY valid JSON, no markdown, no explanation:
{
  "summary": "2-3 sentence overview",
  "destination": "${destination}",
  "days": ${days},
  "travelers": ${travelers},
  "total_estimated_cost": <number>,
  "currency": "${currency}",
  "style": "${style}",
  "daily_itinerary": [
    {
      "day": 1,
      "date": "<date>",
      "title": "<day theme>",
      "activities": [
        {
          "time": "morning",
          "name": "<name>",
          "description": "<2 sentences>",
          "estimated_cost": <number per person>
        }
      ],
      "daily_cost": <total for all travelers>,
      "accommodation": "<hotel recommendation>"
    }
  ],
  "budget_breakdown": {
    "accommodation": <number>,
    "food": <number>,
    "activities": <number>,
    "transportation": <number>,
    "other": <number>
  },
  "tips": ["tip1","tip2","tip3","tip4","tip5"]
}

Rules: realistic costs for ${destination}, stay within ${budget} ${currency}, 3-4 activities/day, all costs for ALL ${travelers} travelers combined.`;

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI returned invalid response. Please try again.");

    const tripData = JSON.parse(jsonMatch[0]);
    return Response.json(tripData);
  } catch (err) {
    console.error("API error:", err);
    return Response.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
