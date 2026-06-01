import { Router } from "express";
import { db } from "@workspace/db";
import { bookings, insertBookingSchema } from "@workspace/db";
import { eq, desc, count, sum, sql } from "drizzle-orm";
import { rooms } from "./hotel";

const router = Router();

function generateConfirmationCode(): string {
  return "GVH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function calculateTotalPrice(
  checkIn: string,
  checkOut: string,
  pricePerNight: number,
): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(1, nights) * pricePerNight;
}

router.get("/bookings", async (req, res) => {
  try {
    const all = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
    res.json(
      all.map((b) => ({
        ...b,
        totalPrice: Number(b.totalPrice),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list bookings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/bookings", async (req, res) => {
  const parsed = insertBookingSchema
    .omit({ status: true, totalPrice: true, confirmationCode: true })
    .safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid booking data" });
    return;
  }

  const data = parsed.data;
  const room = rooms.find((r) => r.id === data.roomId);
  if (!room) {
    res.status(400).json({ error: "Room not found" });
    return;
  }

  const totalPrice = calculateTotalPrice(
    data.checkInDate,
    data.checkOutDate,
    room.pricePerNight,
  );

  try {
    const [booking] = await db
      .insert(bookings)
      .values({
        ...data,
        status: "confirmed",
        totalPrice: totalPrice.toString(),
        confirmationCode: generateConfirmationCode(),
      })
      .returning();

    res.status(201).json({ ...booking, totalPrice: Number(booking.totalPrice) });
  } catch (err) {
    req.log.error({ err }, "Failed to create booking");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/bookings/stats", async (req, res) => {
  try {
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
      .select({
        roomType: bookings.roomType,
        cnt: count(),
      })
      .from(bookings)
      .groupBy(bookings.roomType)
      .orderBy(desc(count()));

    const popularRoomType =
      roomTypeCounts.length > 0 ? roomTypeCounts[0].roomType : "standard";

    res.json({
      totalBookings: Number(stats.totalBookings),
      confirmedBookings: Number(stats.confirmedBookings),
      totalRevenue: Number(stats.totalRevenue ?? 0),
      popularRoomType,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get booking stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/bookings/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id));
    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }
    res.json({ ...booking, totalPrice: Number(booking.totalPrice) });
  } catch (err) {
    req.log.error({ err }, "Failed to get booking");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
