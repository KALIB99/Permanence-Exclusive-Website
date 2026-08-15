import { desc, eq } from "drizzle-orm";
import { getAdminUser } from "../../../lib/admin-auth";
import { getDb } from "../../../db";
import { bookings } from "../../../db/schema";

const statuses = new Set(["Quote Requested", "Confirmed", "Assigned", "Driver En Route", "Completed", "Cancelled"]);

function clean(value: unknown, max = 300) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function GET() {
  const user = await getAdminUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });

  const rows = await getDb().select().from(bookings).orderBy(desc(bookings.createdAt)).limit(100);
  return Response.json({ bookings: rows });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const tripType = clean(body.tripType, 40) || "One way";
    const required = ["pickup", "pickupDate", "pickupTime", "customerName", "customerEmail", "customerPhone"];
    if (required.some((key) => !clean(body[key]))) {
      return Response.json({ error: "Complete all required booking fields." }, { status: 400 });
    }
    if (tripType !== "Hourly" && !clean(body.destination)) {
      return Response.json({ error: "Destination is required for this trip type." }, { status: 400 });
    }

    const extras = [
      tripType !== "One way" ? `Trip: ${tripType}` : "",
      clean(body.returnDate, 20) ? `Return: ${clean(body.returnDate, 20)} ${clean(body.returnTime, 20)}` : "",
      Number(body.hours) ? `Hours: ${Math.max(3, Math.min(12, Number(body.hours)))}` : "",
      clean(body.flightNumber, 40) ? `Flight: ${clean(body.flightNumber, 40)}` : "",
      Number(body.distanceMiles) ? `Est. distance: ${Number(body.distanceMiles).toFixed(1)} mi` : "",
      Number(body.durationMinutes) ? `Est. drive: ${Number(body.durationMinutes)} min` : "",
      clean(body.specialInstructions, 600),
    ].filter(Boolean).join(" · ");

    const estimatedFareCents = Math.max(
      0,
      Math.min(500000, Math.round(Number(body.estimatedFareCents) || 0)),
    );

    const id = crypto.randomUUID();
    const reference = `PE-${Date.now().toString(36).slice(-6).toUpperCase()}`;
    const now = new Date();
    const [booking] = await getDb().insert(bookings).values({
      id,
      reference,
      status: "Quote Requested",
      service: clean(body.service, 80) || tripType,
      vehicle: clean(body.vehicle, 80) || "Luxury sedan",
      pickup: clean(body.pickup),
      destination: tripType === "Hourly" ? "As directed" : clean(body.destination),
      pickupDate: clean(body.pickupDate, 20),
      pickupTime: clean(body.pickupTime, 20),
      passengers: Math.max(1, Math.min(12, Number(body.passengers) || 1)),
      customerName: clean(body.customerName, 120),
      customerEmail: clean(body.customerEmail, 160).toLowerCase(),
      customerPhone: clean(body.customerPhone, 60),
      specialInstructions: extras.slice(0, 800),
      estimatedFareCents,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return Response.json({
      booking,
      confirmation: {
        message: `We’ll confirm pricing and availability within 2 hours during business hours.`,
        emailHint: `A confirmation note will be sent to ${booking.customerEmail} once the reservation is reviewed.`,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/bookings failed:", error);
    return Response.json(
      { error: "Reservation could not be saved. Please try again or email reservations." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const user = await getAdminUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const id = clean(body.id, 80);
  const status = clean(body.status, 40);
  if (!id || !statuses.has(status)) {
    return Response.json({ error: "Invalid booking update." }, { status: 400 });
  }

  const [booking] = await getDb().update(bookings)
    .set({ status, updatedAt: new Date() })
    .where(eq(bookings.id, id))
    .returning();
  return Response.json({ booking });
}
