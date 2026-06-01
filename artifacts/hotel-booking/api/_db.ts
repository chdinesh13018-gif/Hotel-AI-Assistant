import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";

const { Pool } = pg;

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  guestName: text("guest_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  checkInDate: text("check_in_date").notNull(),
  checkOutDate: text("check_out_date").notNull(),
  numberOfGuests: integer("number_of_guests").notNull(),
  roomType: text("room_type").notNull(),
  roomId: integer("room_id").notNull(),
  specialRequests: text("special_requests"),
  status: text("status").notNull().default("confirmed"),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  confirmationCode: text("confirmation_code").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set.");
    }
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    _db = drizzle(pool, { schema: { bookings, conversations, messages } });
  }
  return _db;
}
