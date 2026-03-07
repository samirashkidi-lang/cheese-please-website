/**
 * Netlify Function: AI Chatbot powered by Claude
 * Endpoint: /.netlify/functions/chat
 */

const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the friendly AI assistant for Bar Ten & Cheese Please, Tampa Bay's only gourmet cheese bar, located at 4205 S MacDill Ave Suite H, Tampa FL 33611.

BUSINESS FACTS:
- Hours: Mon–Thu 4 PM–11 PM | Fri–Sat 4 PM–12 AM | Sunday Closed
- Tampa Bay's ONLY gourmet cheese bar
- Largest selection of international cheeses: France, Spain, Italy, Holland, and more
- Friday Wine & Cheese Tasting Night: 8-course guided pairing, 7:00–8:30 PM, reservations required
- Saturday Cheese Happy Hour: discounted flights & wine, walk-ins welcome
- Wine Down Wednesday: 50% off select wine
- Ladies Night Thursday: 20% off wine bottles, $4 beers, $4 High Noon & Nütrl, $6 vodka
- Hospitality Night Tue–Wed: 20% off for industry workers
- Wings special: 5 full wings + fries for $10, all day every day
- Cheese & charcuterie flights from $16
- Private events, catering, and group bookings available
- Instagram: @bartentampa
- Reservations: cheesepleasetampa.com
- Rated 4.8 stars across 182+ reviews

TONE: Warm, friendly, conversational. Short answers (2-4 sentences max). Use 1-2 emojis naturally. Always end with an invitation to visit or book.
If you don't know something specific, say so warmly and suggest calling or stopping by.`;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { message } = JSON.parse(event.body);

    if (!message || message.length > 500) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid message" }),
      };
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: message }],
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: response.content[0].text }),
    };
  } catch (err) {
    console.error("Chat error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Something went wrong" }),
    };
  }
};
