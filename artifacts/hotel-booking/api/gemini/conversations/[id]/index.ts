import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb, conversations, messages } from "../../../_db.js";
import { eq, asc } from "drizzle-orm";
import { handleOptions, json } from "../../../_cors.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  const id = parseInt(req.query.id as string);
  const db = getDb();

  if (req.method === "GET") {
    try {
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, id));
      if (!conv) return json(res, 404, { error: "Conversation not found" });
      const msgs = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, id))
        .orderBy(asc(messages.createdAt));
      json(res, 200, { ...conv, messages: msgs });
    } catch (err) {
      console.error("Failed to get conversation", err);
      json(res, 500, { error: "Internal server error" });
    }
    return;
  }

  if (req.method === "DELETE") {
    try {
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, id));
      if (!conv) return json(res, 404, { error: "Conversation not found" });
      await db.delete(conversations).where(eq(conversations.id, id));
      res.statusCode = 204;
      res.end();
    } catch (err) {
      console.error("Failed to delete conversation", err);
      json(res, 500, { error: "Internal server error" });
    }
    return;
  }

  json(res, 405, { error: "Method not allowed" });
}
