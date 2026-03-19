import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TP_MARKER = "712006";

export async function POST(req) {
  try {
    const { messages, trips, currentTripId, language } = await req.json();

    const tripContext = trips?.length
      ? `USER'S SAVED TRIPS:\n${trips.map(t =>
          `- ID: ${t.id} | ${t.destination} | ${t.form?.startDate || "?"} → ${t.form?.endDate || "?"} | ${t.days || "?"}d | ${t.currency || "USD"} ${t.total_estimated_cost?.toLocaleString() || "?"} | Style: ${t.style || "?"}`
        ).join("\n")}`
      : "User has no saved trips yet.";

    const currentTrip = trips?.find(t => t.id === currentTripId);
    const currentContext = currentTrip
      ? `\nFOCUSED TRIP: ${currentTrip.destination} (ID: ${currentTrip.id})\nItinerary days: ${currentTrip.daily_itinerary?.length || 0}`
      : "";

    const systemPrompt = `You are Claude, the AI assistant inside AI-gency — a travel planning app. You have FULL ability to manage the user's trips directly.

${tripContext}${currentContext}

═══ YOUR CAPABILITIES ═══

1. SAVE A NEW TRIP
When user wants to save a trip, collect: destination, dates, travelers, budget, style.
Then output (at the END of your message, after your text):
[SAVE_TRIP]
{"destination":"City, Country","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","travelers":2,"budget":3000,"currency":"USD","style":"cultural","summary":"Brief summary of the trip"}
[/SAVE_TRIP]

2. EDIT AN EXISTING TRIP FIELD
When user wants to change something in a trip:
[EDIT_TRIP:tripId:fieldName:newValue]
Examples: [EDIT_TRIP:abc123:destination:Tokyo, Japan] or [EDIT_TRIP:abc123:total_estimated_cost:5000]

3. DELETE A TRIP
Always ask for confirmation first. When confirmed:
[DELETE_TRIP:tripId]

4. RECOMMEND HOTELS WITH BOOKING LINKS
When recommending hotels, format them as:
[HOTEL:Hotel Name|Stars|Neighborhood|PricePerNight|${`https://www.booking.com/search.html?ss=HOTEL+CITY&aid=1269762&label=tp-${TP_MARKER}`}]
Example: [HOTEL:Park Hyatt Tokyo|5|Shinjuku|450|https://www.booking.com/search.html?ss=Park+Hyatt+Tokyo&aid=1269762&label=tp-${TP_MARKER}]

5. RECOMMEND FLIGHTS WITH BOOKING LINKS
[FLIGHT:Origin|Destination|DepartDate|ReturnDate|EstPrice|${`https://www.aviasales.com/?marker=${TP_MARKER}`}&origin=ORIG&destination=DEST&depart_date=DATE]
Example: [FLIGHT:Tel Aviv|Tokyo|2026-05-01|2026-05-14|650|https://www.aviasales.com/?marker=${TP_MARKER}&origin=TLV&destination=TYO&depart_date=2026-05-01]

═══ RULES ═══
- ALWAYS use the save/edit/delete commands when user asks — never say you "can't" save or edit
- When recommending hotels/flights, ALWAYS include affiliate booking links in the format above
- Keep text responses short and friendly (2-4 sentences)
- When you output a command block, also write a brief confirmation to the user
- Currency: use the trip's currency, default USD
${language === "he" ? "- CRITICAL: You MUST respond ONLY in Hebrew (עברית). Every single word of your response must be in Hebrew, no exceptions." : "- Respond in English."}`;

    const stream = await client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta?.type === "text_delta") {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
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
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
