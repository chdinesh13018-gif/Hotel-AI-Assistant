import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb, conversations, messages } from "../../../_db.js";
import { eq, asc } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { setCors } from "../../../_cors.js";
import { json } from "../../../_cors.js";

export const config = { maxDuration: 60 };

const SYSTEM_PROMPT = `You are a professional hotel booking assistant for Grand Vista Hotel in Hyderabad, India. Answer politely and accurately using only the provided hotel information below. If room availability is requested, recommend suitable rooms based on the user's budget. If information is unavailable, politely ask the guest to contact reception.

HOTEL INFORMATION:
- Name: Grand Vista Hotel
- Location: Hyderabad, India
- Check-in Time: 12:00 PM
- Check-out Time: 11:00 AM

ROOMS & PRICING:
- Standard Room: ₹2500/night - Comfortable room for up to 2 guests. Amenities: Free WiFi, AC, TV, Room Service, Daily Housekeeping
- Deluxe Room: ₹4500/night - Spacious room with city views for up to 3 guests. Amenities: Free WiFi, AC, Smart TV, Mini Bar, Room Service, Work Desk, Premium Toiletries
- Suite Room: ₹7000/night - Luxury suite for up to 4 guests. Amenities: Free WiFi, AC, Smart TV, Full Mini Bar, Butler Service, Jacuzzi, Separate Living Area, Complimentary Breakfast

HOTEL AMENITIES:
Free WiFi, Swimming Pool, Restaurant, Gym, Free Parking, Airport Pickup, Conference Hall, 24/7 Reception

NEARBY ATTRACTIONS:
- Charminar (3 km)
- Golconda Fort (8 km)
- Hussain Sagar Lake (4 km)
- Ramoji Film City (20 km)

HOTEL POLICIES:
- Valid ID required at check-in
- No smoking inside rooms
- Free cancellation within 24 hours of booking
- Pets not allowed

BOOKING PROCESS:
Guests can book online through our website. They need to provide: name, phone, email, check-in/check-out dates, number of guests, and room type. A confirmation code is sent upon successful booking.

Always be warm, professional, and helpful. If asked about anything outside of hotel services, politely redirect the conversation back to how you can help with their stay.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const id = parseInt(req.query.id as string);

  if (req.method === "GET") {
    try {
      const db = getDb();
      const msgs = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, id))
        .orderBy(asc(messages.createdAt));
      json(res, 200, msgs);
    } catch (err) {
      console.error("Failed to list messages", err);
      json(res, 500, { error: "Internal server error" });
    }
    return;
  }

  if (req.method === "POST") {
    const { content } = req.body as Record<string, unknown>;
    if (!content) return json(res, 400, { error: "Content is required" });

    try {
      const db = getDb();

      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, id));
      if (!conv) return json(res, 404, { error: "Conversation not found" });

      await db.insert(messages).values({
        conversationId: id,
        role: "user",
        content: String(content),
      });

      const history = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, id))
        .orderBy(asc(messages.createdAt));

      const chatMessages = [
        { role: "user" as const, parts: [{ text: SYSTEM_PROMPT }] },
        {
          role: "model" as const,
          parts: [
            {
              text: "Understood! I am ready to assist guests of Grand Vista Hotel. How can I help you today?",
            },
          ],
        },
        ...history.map((m) => ({
          role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
          parts: [{ text: m.content }],
        })),
      ];

      if (!process.env.GEMINI_API_KEY) {
        return json(res, 500, { error: "GEMINI_API_KEY is not configured" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.statusCode = 200;

      let fullResponse = "";

      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: chatMessages,
        config: { maxOutputTokens: 8192 },
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }

      await db.insert(messages).values({
        conversationId: id,
        role: "assistant",
        content: fullResponse,
      });

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err) {
      console.error("Failed to send message", err);
      if (!res.headersSent) {
        json(res, 500, { error: "Internal server error" });
      } else {
        res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
        res.end();
      }
    }
    return;
  }

  json(res, 405, { error: "Method not allowed" });
}
