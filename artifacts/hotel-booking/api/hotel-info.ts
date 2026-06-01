import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hotelInfo } from "./_rooms.js";
import { handleOptions, json } from "./_cors.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  json(res, 200, hotelInfo);
}
