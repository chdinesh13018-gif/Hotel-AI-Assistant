import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb, bookings } from "../_db.js";
import { desc } from "drizzle-orm";
import { rooms } from "../_rooms.js";
import { handleOptions, json } from "../_cors.js";

function generateConfirmationCode(): string {
  return "GVH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function calculateTotalPrice(
  checkIn: string,
  checkOut: string,
  pricePerNight: number,
): number {
  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  return Math.max(1, nights) * pricePerNight;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  const db = getDb();

  if (req.method === "GET") {
    try {
      const all = await db
        .select()
        .from(bookings)
        .orderBy(desc(bookings.createdAt));
      json(
        res,
        200,
        all.map((b) => ({ ...b, totalPrice: Number(b.totalPrice) })),
      );
    } catch (err) {
      console.error("Failed to list bookings", err);
      json(res, 500, { error: "Internal server error" });
    }
    return;
  }

  if (req.method === "POST") {
    const {
      guestName,
      phone,
      email,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      roomType,
      roomId,
      specialRequests,
    } = req.body as Record<string, unknown>;

    if (
      !guestName ||
      !phone ||
      !email ||
      !checkInDate ||
      !checkOutDate ||
      !numberOfGuests ||
      !roomType ||
      !roomId
    ) {
      return json(res, 400, { error: "Missing required booking fields" });
    }

    const room = rooms.find((r) => r.id === Number(roomId));
    if (!room) return json(res, 400, { error: "Room not found" });

    const totalPrice = calculateTotalPrice(
      checkInDate as string,
      checkOutDate as string,
      room.pricePerNight,
    );

    try {
      const [booking] = await db
        .insert(bookings)
        .values({
          guestName: String(guestName),
          phone: String(phone),
          email: String(email),
          checkInDate: String(checkInDate),
          checkOutDate: String(checkOutDate),
          numberOfGuests: Number(numberOfGuests),
          roomType: String(roomType),
          roomId: Number(roomId),
          specialRequests: specialRequests ? String(specialRequests) : null,
          status: "confirmed",
          totalPrice: totalPrice.toString(),
          confirmationCode: generateConfirmationCode(),
        })
        .returning();
      json(res, 201, { ...booking, totalPrice: Number(booking.totalPrice) });
    } catch (err) {
      console.error("Failed to create booking", err);
      json(res, 500, { error: "Internal server error" });
    }
    return;
  }

  json(res, 405, { error: "Method not allowed" });
}
