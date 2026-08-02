import { calculateFare, type TripType, type VehicleId } from "../../../lib/fare";
import {
  estimateDriveMinutes,
  estimateRoadMiles,
  haversineMiles,
  isAirportQuery,
  resolvePlace,
} from "../../../lib/geo";

function clean(value: unknown, max = 300) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const pickup = clean(body.pickup);
  const destination = clean(body.destination);
  const pickupTime = clean(body.pickupTime, 20) || "12:00";
  const tripType = (clean(body.tripType, 40) || "One way") as TripType;
  const vehicle = (clean(body.vehicle, 40) || "Luxury sedan") as VehicleId;
  const hours = Math.max(3, Math.min(12, Number(body.hours) || 3));

  if (!pickup) {
    return Response.json({ error: "Enter a pickup location." }, { status: 400 });
  }

  if (tripType !== "Hourly" && !destination) {
    return Response.json({ error: "Enter a destination." }, { status: 400 });
  }

  const origin = resolvePlace(pickup);
  const dest = tripType === "Hourly" ? origin : resolvePlace(destination);

  if (!origin || (tripType !== "Hourly" && !dest)) {
    return Response.json(
      {
        error:
          "We couldn’t match that address yet. Choose a Valley city, landmark, or airport from the suggestions — or include PHX / AZA for airport transfers.",
      },
      { status: 422 },
    );
  }

  const airportInvolved =
    isAirportQuery(pickup) ||
    isAirportQuery(destination) ||
    origin.kind === "airport" ||
    dest?.kind === "airport";

  let distanceMiles = 0;
  let durationMinutes = 0;

  if (tripType === "Hourly") {
    distanceMiles = 0;
    durationMinutes = hours * 60;
  } else if (dest) {
    const straight = haversineMiles(origin, dest);
    distanceMiles = Math.round(estimateRoadMiles(straight) * 10) / 10;
    durationMinutes = estimateDriveMinutes(distanceMiles);
    if (tripType === "Round trip") {
      durationMinutes = Math.round(durationMinutes * 2 * 0.95);
    }
  }

  const fare = calculateFare({
    tripType,
    vehicle,
    distanceMiles: tripType === "Round trip" ? distanceMiles : distanceMiles,
    durationMinutes,
    pickupTime,
    hours,
    airportInvolved: airportInvolved || tripType === "Airport transfer",
  });

  return Response.json({
    estimate: {
      pickup: origin.label,
      destination: tripType === "Hourly" ? "Chauffeur as directed" : dest?.label ?? destination,
      distanceMiles,
      durationMinutes,
      airportInvolved,
      source: "valley-network",
      disclaimer: "Estimated fare · final on confirmation. Live map routing can replace this Valley network estimate when a provider key is connected.",
      fare,
    },
  });
}
