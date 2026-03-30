import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    const { startDate, endDate, travelers, budget, currency, style, accommodation, language } = await req.json();
    const langInstruction = language === "he" ? "CRITICAL: Write ALL text values in Hebrew (עברית) — surprise_reveal, summary, titles, descriptions, tips, etc. JSON keys stay in English." : "";

    if (!startDate || !endDate || !budget) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000));
    const isLong = days > 8;

    const styleDesc = {
      adventure: "adventure-focused: outdoor activities, hiking, extreme sports",
      relaxed: "relaxed & slow-paced: beaches, spas, lazy exploration",
      cultural: "culturally rich: museums, history, local food & markets",
      luxury: "luxury: fine dining, 5-star hotels, premium experiences",
      nightlife: "nightlife & social: bars, clubs, local social scene",
      culinary: "food & culinary focused: street food, markets, cooking classes",
    };

    const prompt = `You are a surprise travel planner. Pick the PERFECT surprise destination for this traveler, then generate a complete itinerary. ${langInstruction}

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
        { "time": "morning", "name": "Activity", "description": "${isLong ? "One short sentence." : "2-sentence description with local details."}", "estimated_cost": 0 },
        { "time": "afternoon", "name": "Activity", "description": "Description.", "estimated_cost": 0 }${isLong ? "" : `,\n        { "time": "evening", "name": "Activity", "description": "Description.", "estimated_cost": 0 }`}
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

CRITICAL RULES:
- Generate ALL ${days} days — do NOT stop early
- Replace ALL 0s with realistic numbers
- Stay within ${budget} ${currency} total
- budget_breakdown must sum to total_estimated_cost
- recommended_hotels: 3 options | recommended_restaurants: ${isLong ? 3 : 5} options
- Keep descriptions SHORT${isLong ? " (ONE sentence max) to save space" : ""}`;


    // Use streaming to avoid Vercel timeout
    const encoder = new TextEncoder();
    const form = { startDate, endDate, travelers, budget, currency, style, accommodation };
    const readable = new ReadableStream({
      async start(controller) {
        let fullText = "";
        try {
          const stream = await client.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: isLong ? 6000 : 4096,
            messages: [{ role: "user", content: prompt }],
          });
          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta?.type === "text_delta") {
              fullText += chunk.delta.text;
              if (fullText.length % 500 < 20) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ progress: true })}\n\n`));
              }
            }
          }
          const jsonMatch = fullText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("No JSON in response");
          const tripData = JSON.parse(jsonMatch[0]);
          if (!tripData.daily_itinerary || !tripData.destination) throw new Error("Incomplete response");
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, trip: { ...tripData, form } })}\n\n`));
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
