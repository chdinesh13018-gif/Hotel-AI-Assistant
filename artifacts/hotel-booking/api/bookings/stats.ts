import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb, bookings } from "../_db.js";
import { count, sum, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { handleOptions, json } from "../_cors.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  try {
    const db = getDb();
    const [stats] = await db
      .select({
        totalBookings: count(),
        confirmedBookings: count(
          sql`CASE WHEN ${bookings.status} = 'confirmed' THEN 1 END`,
        ),
        totalRevenue: sum(bookings.totalPrice),
      })
      .from(bookings);

    const roomTypeCounts = await db
      .select({ roomType: bookings.roomType, cnt: count() })
      .from(bookings)
      .groupBy(bookings.roomType)
      .orderBy(desc(count()));

    json(res, 200, {
      totalBookings: Number(stats.totalBookings),
      confirmedBookings: Number(stats.confirmedBookings),
      totalRevenue: Number(stats.totalRevenue ?? 0),
      popularRoomType:
        roomTypeCounts.length > 0 ? roomTypeCounts[0].roomType : "standard",
    });
  } catch (err) {
    console.error("Failed to get booking stats", err);
    json(res, 500, { error: "Internal server error" });
  }
}
