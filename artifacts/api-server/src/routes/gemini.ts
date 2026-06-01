import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { eq, asc, desc } from "drizzle-orm";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

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

router.get("/gemini/conversations", async (req, res) => {
  try {
    const all = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.createdAt));
    res.json(all);
  } catch (err) {
    req.log.error({ err }, "Failed to list conversations");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/gemini/conversations", async (req, res) => {
  const { title } = req.body;
  if (!title) {
    res.status(400).json({ error: "Title is required" });
    return;
  }
  try {
    const [conv] = await db.insert(conversations).values({ title }).returning();
    res.status(201).json(conv);
  } catch (err) {
    req.log.error({ err }, "Failed to create conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/gemini/conversations/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));
    res.json({ ...conv, messages: msgs });
  } catch (err) {
    req.log.error({ err }, "Failed to get conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/gemini/conversations/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    await db.delete(conversations).where(eq(conversations.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/gemini/conversations/:id/messages", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));
    res.json(msgs);
  } catch (err) {
    req.log.error({ err }, "Failed to list messages");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/gemini/conversations/:id/messages", async (req, res) => {
  const id = parseInt(req.params.id);
  const { content } = req.body;

  if (!content) {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    // Save user message
    await db.insert(messages).values({
      conversationId: id,
      role: "user",
      content,
    });

    // Load conversation history
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));

    const chatMessages = [
      { role: "user" as const, parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model" as const, parts: [{ text: "Understood! I am ready to assist guests of Grand Vista Hotel. How can I help you today?" }] },
      ...history.map((m) => ({
        role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
        parts: [{ text: m.content }],
      })),
    ];

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

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

    // Save assistant message
    await db.insert(messages).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Failed to send message");
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  }
});

export default router;
