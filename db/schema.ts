import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  status: text("status").notNull().default("Quote Requested"),
  service: text("service").notNull(),
  vehicle: text("vehicle").notNull(),
  pickup: text("pickup").notNull(),
  destination: text("destination").notNull(),
  pickupDate: text("pickup_date").notNull(),
  pickupTime: text("pickup_time").notNull(),
  passengers: integer("passengers").notNull().default(1),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  specialInstructions: text("special_instructions"),
  estimatedFareCents: integer("estimated_fare_cents").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
