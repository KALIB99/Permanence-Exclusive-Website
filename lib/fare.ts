export type TripType = "One way" | "Round trip" | "Hourly" | "Airport transfer";

export type VehicleId = "Luxury sedan" | "Executive SUV";

export type FareInput = {
  tripType: TripType;
  vehicle: VehicleId;
  distanceMiles: number;
  durationMinutes: number;
  pickupTime: string; // HH:MM
  hours?: number;
  airportInvolved: boolean;
};

export type FareBreakdown = {
  baseCents: number;
  mileageCents: number;
  airportFeeCents: number;
  hourlyCents: number;
  nightSurchargeCents: number;
  roundTripCents: number;
  vehiclePremiumCents: number;
  subtotalCents: number;
  totalCents: number;
  currency: "USD";
  lines: { label: string; cents: number }[];
};

const RATES = {
  baseOneWayCents: 7500,
  perMileCents: 350,
  airportFeeCents: 2500,
  hourlyRateCents: 9500,
  hourlyMinimumHours: 3,
  nightSurchargeRate: 0.15,
  roundTripMultiplier: 1.85,
  suvMultiplier: 1.4,
} as const;

function isNightPickup(pickupTime: string) {
  const [h = "12", m = "0"] = pickupTime.split(":");
  const minutes = Number(h) * 60 + Number(m);
  return minutes >= 22 * 60 || minutes < 6 * 60;
}

export function calculateFare(input: FareInput): FareBreakdown {
  const lines: { label: string; cents: number }[] = [];
  let baseCents = 0;
  let mileageCents = 0;
  let airportFeeCents = 0;
  let hourlyCents = 0;
  let roundTripCents = 0;
  let vehiclePremiumCents = 0;

  if (input.tripType === "Hourly") {
    const hours = Math.max(RATES.hourlyMinimumHours, Number(input.hours) || RATES.hourlyMinimumHours);
    hourlyCents = hours * RATES.hourlyRateCents;
    lines.push({ label: `${hours}-hour chauffeur minimum`, cents: hourlyCents });
  } else {
    baseCents = RATES.baseOneWayCents;
    mileageCents = Math.round(input.distanceMiles * RATES.perMileCents);
    lines.push({ label: "Base fare", cents: baseCents });
    lines.push({ label: `Mileage · ${input.distanceMiles.toFixed(1)} mi`, cents: mileageCents });

    if (input.tripType === "Round trip") {
      const oneWay = baseCents + mileageCents;
      roundTripCents = Math.round(oneWay * (RATES.roundTripMultiplier - 1));
      lines.push({ label: "Return leg", cents: roundTripCents });
    }
  }

  if (input.airportInvolved || input.tripType === "Airport transfer") {
    airportFeeCents = RATES.airportFeeCents;
    lines.push({ label: "Airport meet & assist", cents: airportFeeCents });
  }

  let subtotal =
    baseCents + mileageCents + airportFeeCents + hourlyCents + roundTripCents;

  if (input.vehicle === "Executive SUV") {
    vehiclePremiumCents = Math.round(subtotal * (RATES.suvMultiplier - 1));
    lines.push({ label: "Executive SUV", cents: vehiclePremiumCents });
    subtotal += vehiclePremiumCents;
  }

  let nightSurchargeCents = 0;
  if (isNightPickup(input.pickupTime)) {
    nightSurchargeCents = Math.round(subtotal * RATES.nightSurchargeRate);
    lines.push({ label: "Night service (10pm–6am)", cents: nightSurchargeCents });
    subtotal += nightSurchargeCents;
  }

  const totalCents = Math.round(subtotal / 100) * 100; // nearest dollar

  return {
    baseCents,
    mileageCents,
    airportFeeCents,
    hourlyCents,
    nightSurchargeCents,
    roundTripCents,
    vehiclePremiumCents,
    subtotalCents: totalCents,
    totalCents,
    currency: "USD",
    lines,
  };
}

export function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
