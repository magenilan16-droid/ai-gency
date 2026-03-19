import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { destination, startDate, endDate, travelers, budget, currency, style } = body;

    if (!destination || !startDate || !endDate || !budget) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const days = Math.max(
      1,
      Math.ceil(
        (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
      )
    );

    const styleDescriptions = {
      adventure: "adventure-focused with outdoor activities, hiking, and exciting experiences",
      relaxed: "relaxed and leisurely with beach time, spas, and slow-paced exploration",
      cultural: "culturally rich with museums, historical sites, local experiences and food",
      luxury: "luxury-oriented with fine dining, 5-star accommodations, and premium experiences",
    };

    const prompt = `You are an expert travel planner. Create a detailed, realistic travel itinerary based on these inputs:

Destination: ${destination}
Travel dates: ${startDate} to ${endDate} (${days} days)
Number of travelers: ${travelers}
Total budget: ${budget} ${currency}
Trip style: ${styleDescriptions[style] || style}

Return ONLY valid JSON (no markdown, no explanation) in exactly this format:
{
  "summary": "A 2-3 sentence overview of this trip",
  "destination": "${destination}",
  "days": ${days},
  "travelers": ${travelers},
  "total_estimated_cost": <number in ${currency}>,
  "currency": "${currency}",
  "style": "${style}",
  "daily_itinerary": [
    {
      "day": 1,
      "date": "<date string>",
      "title": "<theme of the day>",
      "activities": [
        {
          "time": "<morning/afternoon/evening>",
          "name": "<activity name>",
          "description": "<2 sentence description>",
          "estimated_cost": <number per person in ${currency}>
        }
      ],
      "daily_cost": <total for all travelers for this day in ${currency}>,
      "accommodation": "<hotel/hostel recommendation for this night>"
    }
  ],
  "budget_breakdown": {
    "accommodation": <number>,
    "food": <number>,
    "activities": <number>,
    "transportation": <number>,
    "other": <number>
  },
  "tips": [
    "<practical tip 1>",
    "<practical tip 2>",
    "<practical tip 3>",
    "<practical tip 4>",
    "<practical tip 5>"
  ]
}

Rules:
- Make costs realistic for ${destination}
- Total costs should stay within ${budget} ${currency}
- Include 3-4 activities per day
- budget_breakdown numbers should add up to approximately total_estimated_cost
- All costs are for ALL ${travelers} travelers combined`;

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0].text;

    // Parse JSON from response
    let tripData;
    try {
      // Clean up in case there's any extra text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      tripData = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("Failed to parse AI response:", content);
      return Response.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    return Response.json(tripData);
  } catch (err) {
    console.error("API error:", err);
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
