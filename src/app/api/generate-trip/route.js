import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }

    const { destination, startDate, endDate, travelers, budget, currency, style, accommodation, foodStyle, interests, budgetBreakdown, language } = body;
    const langInstruction = language === "he" ? "CRITICAL: Write ALL text values in Hebrew (עברית) — summary, titles, descriptions, tips, hotel why, etc. JSON keys stay in English." : "";

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

    const interestStr = interests?.length ? `Special interests: ${interests.join(", ")}.` : "";
    const budgetHint = budgetBreakdown
      ? `Budget hint: flights ${currency} ${budgetBreakdown.flights}, accommodation ${budgetBreakdown.accommodation}, food ${budgetBreakdown.food}, activities ${budgetBreakdown.activities}.`
      : "";

    const isLong = days > 8;
    const activitiesPerDay = isLong ? 2 : 3;
    const descLength = isLong ? "ONE short sentence" : "1-2 sentences";
    const restaurantCount = isLong ? 3 : 5;
    const maxTokens = isLong ? 6000 : 4096;

    const prompt = `You are an expert travel planner. Create a personalized itinerary. Be CONCISE. ${langInstruction}

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
- Generate ALL ${days} days
- Replace ALL 0s with realistic numbers
- Stay within ${budget} ${currency} total
- Keep descriptions SHORT (${descLength})`;

    // Use streaming to avoid Vercel timeout
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let fullText = "";
        try {
          const stream = await client.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: maxTokens,
            messages: [{ role: "user", content: prompt }],
          });

          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta?.type === "text_delta") {
              fullText += chunk.delta.text;
              // Send progress ping every ~500 chars to keep connection alive
              if (fullText.length % 500 < 20) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ progress: true })}\n\n`));
              }
            }
          }

          // Parse and send complete trip
          const jsonMatch = fullText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("No JSON in response");
          const tripData = JSON.parse(jsonMatch[0]);
          if (!tripData.daily_itinerary || !Array.isArray(tripData.daily_itinerary)) {
            throw new Error("Incomplete response");
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, trip: tripData })}\n\n`));
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch (err) {
    return Response.json({ error: `Error: ${err.message}` }, { status: 500 });
  }
}
