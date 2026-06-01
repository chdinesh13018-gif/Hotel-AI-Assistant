import type { VercelRequest, VercelResponse } from "@vercel/node";
import { rooms } from "../_rooms.js";
import { handleOptions, json } from "../_cors.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  const id = parseInt(req.query.id as string);
  const room = rooms.find((r) => r.id === id);
  if (!room) return json(res, 404, { error: "Room not found" });
  json(res, 200, room);
}
