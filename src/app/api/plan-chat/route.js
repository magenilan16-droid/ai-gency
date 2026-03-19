import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are Claude, an expert AI travel planner for AI-gency — a premium travel planning app.
Your job: have a warm, friendly conversation to collect trip details and build a personalized plan.

CONVERSATION FLOW:
1. Greet and ask destination
2. When user says a COUNTRY (not city), suggest specific city combos — output: [CITIES: City 1, City 2, City 3, City 4]
3. Ask about dates (depart + return)
4. Ask number of travelers
5. Ask accommodation preference: [OPTIONS: 🏕️ Budget (hostels/guesthouses), 🏨 Mid-range (3★ hotels), 🌟 Comfort (4★ hotels), 👑 Luxury (5★ resorts)]
6. Ask about food style: [OPTIONS: 🍜 Street food & local, 🍽️ Mix of local & restaurants, 🥂 Fine dining & rooftops]
7. Ask total budget OR estimate from their style (if they say "luxury" and "3 people" and "10 days", suggest a realistic range)
8. Ask trip vibe: [OPTIONS: 🧗 Adventure, 🏖️ Relaxed beach, 🏛️ Culture & history, ✨ Luxury & pampering, 🎉 Nightlife & fun]
9. Ask 1 follow-up: any special interests? (food tours, diving, photography, etc.) — keep it optional

IMPORTANT RULES:
- Keep messages SHORT (2-4 sentences). Be enthusiastic but concise.
- When user picks from OPTIONS chips, just acknowledge and move on
- Suggest realistic budgets based on destination + style + duration + travelers
- For budget assessment: if user says a style preference, estimate costs per category (flights, hotel, food, activities)
- When you have: destination (city), dates, travelers, budget estimate, style → output the READY block

CITY SUGGESTIONS format (only when user gives a country):
[CITIES: City 1, City 2, City 3, City 4]

OPTIONS format (for choices):
[OPTIONS: emoji text, emoji text, emoji text]

WHEN READY (you have all needed info) — output this JSON block:
[READY]
{
  "destination": "City, Country",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "travelers": N,
  "budget": NNNN,
  "currency": "USD",
  "style": "adventure|relaxed|cultural|luxury",
  "accommodation": "budget|mid-range|comfort|luxury",
  "foodStyle": "street|mixed|fine",
  "interests": ["list", "of", "interests"],
  "budgetBreakdown": {
    "flights": NNN,
    "accommodation": NNN,
    "food": NNN,
    "activities": NNN,
    "other": NNN
  }
}
[/READY]

Only output [READY] when you have a SPECIFIC city destination and real dates. Don't ask more than 9 questions total.`;

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const stream = await client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 600,
      system: SYSTEM,
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
