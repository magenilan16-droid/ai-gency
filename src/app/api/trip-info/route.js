import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    const { destination, style, days, travelers, language } = await req.json();
    if (!destination) return Response.json({ error: "Missing destination" }, { status: 400 });

    const langInstruction = language === "he" ? "CRITICAL: Write ALL text values in Hebrew (עברית). JSON keys stay in English." : "";

    const prompt = `Give comprehensive practical travel info for ${destination}. Assume Israeli passport holder. ${langInstruction}
Return ONLY valid JSON, no markdown:
{
  "visa": {
    "requirement": "Visa free / Visa on arrival / eVisa / Visa required",
    "duration": "how many days allowed",
    "details": "1-2 sentence explanation",
    "passport_validity": "required passport validity"
  },
  "emergency": {
    "police": "number",
    "ambulance": "number",
    "fire": "number",
    "tourist_police": "number or N/A",
    "nearest_hospital": "hospital name and area",
    "israeli_embassy": "phone number or address"
  },
  "health": {
    "water": "tap water safe? short answer",
    "vaccines": ["vaccine1", "vaccine2"],
    "tips": ["tip1", "tip2", "tip3"]
  },
  "transport": {
    "airport_to_city": "how to get from airport to city center with cost estimate",
    "local_options": ["option1", "option2", "option3"],
    "best_app": "main ride/transport app to download",
    "driving": "is renting a car recommended? short note"
  },
  "practical": {
    "power_socket": "socket type and voltage",
    "tipping": "tipping culture in 1 sentence",
    "currency_tips": "ATM/cash tips in 1 sentence",
    "best_apps": ["app1", "app2", "app3"],
    "sim_card": "how to get local SIM"
  },
  "checklist": {
    "documents": ["Passport (6+ months validity)", "Travel insurance", "Printed hotel bookings"],
    "health": ["Relevant vaccines", "Prescription medications", "Travel first aid kit"],
    "money": ["Notify bank of travel", "Get local currency", "Backup credit card"],
    "tech": ["Download offline maps", "Power adapter", "Portable charger"],
    "extras": ["Visa documents", "Emergency contacts saved offline"]
  }
}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0]?.text || "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    return Response.json({ ok: true, data: JSON.parse(match[0]) });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
