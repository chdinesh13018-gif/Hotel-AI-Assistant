import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb, conversations } from "../../_db.js";
import { desc } from "drizzle-orm";
import { handleOptions, json } from "../../_cors.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  const db = getDb();

  if (req.method === "GET") {
    try {
      const all = await db
        .select()
        .from(conversations)
        .orderBy(desc(conversations.createdAt));
      json(res, 200, all);
    } catch (err) {
      console.error("Failed to list conversations", err);
      json(res, 500, { error: "Internal server error" });
    }
    return;
  }

  if (req.method === "POST") {
    const { title } = req.body as Record<string, unknown>;
    if (!title) return json(res, 400, { error: "Title is required" });
    try {
      const [conv] = await db
        .insert(conversations)
        .values({ title: String(title) })
        .returning();
      json(res, 201, conv);
    } catch (err) {
      console.error("Failed to create conversation", err);
      json(res, 500, { error: "Internal server error" });
    }
    return;
  }

  json(res, 405, { error: "Method not allowed" });
}
