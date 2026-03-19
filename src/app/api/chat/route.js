import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    const { messages, trips, currentTripId } = await req.json();

    const tripContext = trips?.length
      ? `The user has these saved trips:\n${trips.map(t =>
          `- ID: ${t.id} | ${t.destination} | ${t.form?.startDate || "no date"} → ${t.form?.endDate || ""} | ${t.days || "?"} days | Budget: ${t.currency || "USD"} ${t.total_estimated_cost?.toLocaleString() || "unknown"} | Style: ${t.style || "?"}`
        ).join("\n")}`
      : "The user has no saved trips yet.";

    const currentTrip = trips?.find(t => t.id === currentTripId);
    const currentContext = currentTrip
      ? `\nCurrently focused on trip: ${currentTrip.destination} (ID: ${currentTrip.id}).\nItinerary: ${JSON.stringify(currentTrip.itinerary?.slice(0, 5) || [])}`
      : "";

    const systemPrompt = `You are an expert travel assistant for AI-gency, a smart travel planning platform.
You help users plan trips, suggest activities, give travel tips, and improve their itineraries.

${tripContext}${currentContext}

When suggesting activities or day plans that the user might want to save, format them clearly like this:
**[SAVEABLE SUGGESTION]**
Day X: Activity name — Description (cost: $XX)

Keep responses helpful, enthusiastic, and concise. Use emojis sparingly for readability.
If the user asks to add something to a trip, give them the suggestion in the saveable format above.`;

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
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
