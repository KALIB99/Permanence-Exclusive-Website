import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { bookings } from "../../../../db/schema";

function clean(value: unknown, max = 300) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const reference = clean(body.reference, 40).toUpperCase();
  const email = clean(body.email, 160).toLowerCase();

  if (!reference || !email) {
    return Response.json({ error: "Enter your booking reference and email." }, { status: 400 });
  }

  try {
    const [booking] = await getDb()
      .select()
      .from(bookings)
      .where(and(eq(bookings.reference, reference), eq(bookings.customerEmail, email)))
      .limit(1);

    if (!booking) {
      return Response.json({ error: "No booking matched that reference and email." }, { status: 404 });
    }

    return Response.json({
      booking: {
        reference: booking.reference,
        status: booking.status,
        service: booking.service,
        vehicle: booking.vehicle,
        pickup: booking.pickup,
        destination: booking.destination,
        pickupDate: booking.pickupDate,
        pickupTime: booking.pickupTime,
        passengers: booking.passengers,
        customerName: booking.customerName,
        estimatedFareCents: booking.estimatedFareCents,
        specialInstructions: booking.specialInstructions,
      },
    });
  } catch {
    return Response.json(
      { error: "Lookup is temporarily unavailable. Email reservations@permanenceexclusive.com with your reference." },
      { status: 503 },
    );
  }
}
