import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb, bookings } from "../_db.js";
import { eq } from "drizzle-orm";
import { handleOptions, json } from "../_cors.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  const id = parseInt(req.query.id as string);
  try {
    const db = getDb();
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id));
    if (!booking) return json(res, 404, { error: "Booking not found" });
    json(res, 200, { ...booking, totalPrice: Number(booking.totalPrice) });
  } catch (err) {
    console.error("Failed to get booking", err);
    json(res, 500, { error: "Internal server error" });
  }
}
