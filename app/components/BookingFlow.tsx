"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatUsd, type TripType, type VehicleId } from "../../lib/fare";

type Step = "form" | "estimate" | "vehicle" | "details" | "review";

type PlaceSuggestion = { id: string; label: string; kind: string };

type FareEstimate = {
  pickup: string;
  destination: string;
  distanceMiles: number;
  durationMinutes: number;
  airportInvolved: boolean;
  source: string;
  disclaimer: string;
  fare: {
    totalCents: number;
    lines: { label: string; cents: number }[];
  };
};

type Guest = { first: string; last: string; email: string; phone: string };

type Draft = {
  tripType: TripType;
  pickup: string;
  destination: string;
  date: string;
  time: string;
  returnDate: string;
  returnTime: string;
  hours: string;
  flightNumber: string;
  passengers: string;
  vehicle: VehicleId;
  selectedService: string;
  guest: Guest;
  specialInstructions: string;
  step: Step;
};

const DRAFT_KEY = "pe-booking-draft-v1";
const STEPS: Step[] = ["form", "estimate", "vehicle", "details", "review"];
const STEP_LABELS = ["Trip", "Route", "Vehicle", "Details", "Review"];

export function Arrow({ down = false }: { down?: boolean }) {
  return <span aria-hidden="true">{down ? "↓" : "↗"}</span>;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isPastDateTime(date: string, time: string) {
  if (!date || !time) return false;
  return new Date(`${date}T${time}:00`).getTime() < Date.now() - 60_000;
}

function loadDraft(): Partial<Draft> | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<Draft>) : null;
  } catch {
    return null;
  }
}

function PlaceField({
  label,
  value,
  onChange,
  placeholder,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  required?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch(`/api/places?q=${encodeURIComponent(value)}`)
        .then((r) => (r.ok ? r.json() : { places: [] }))
        .then((data) => setSuggestions(data.places ?? []))
        .catch(() => setSuggestions([]));
    }, 180);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value]);

  return (
    <label className={`field full place-field${error ? " has-error" : ""}`}>
      <span>{label}</span>
      <input
        required={required}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
        aria-invalid={Boolean(error)}
        aria-autocomplete="list"
      />
      {error ? <em className="field-error">{error}</em> : null}
      {open && suggestions.length > 0 ? (
        <ul className="place-suggestions" role="listbox">
          {suggestions.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(place.label);
                  setOpen(false);
                }}
              >
                <strong>{place.label}</strong>
                <small>{place.kind}</small>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </label>
  );
}

export default function BookingFlow({
  initialService,
  onServiceConsumed,
}: {
  initialService?: string | null;
  onServiceConsumed?: () => void;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [tripType, setTripType] = useState<TripType>("One way");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [hours, setHours] = useState("3");
  const [flightNumber, setFlightNumber] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [step, setStep] = useState<Step>("form");
  const [mapProvider, setMapProvider] = useState<"apple" | "google">("apple");
  const [vehicle, setVehicle] = useState<VehicleId>("Luxury sedan");
  const [selectedService, setSelectedService] = useState("Point-to-point travel");
  const [guest, setGuest] = useState<Guest>({ first: "", last: "", email: "", phone: "" });
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [estimate, setEstimate] = useState<FareEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState<{ reference: string; message: string; emailHint: string } | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupRef, setLookupRef] = useState("");
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupResult, setLookupResult] = useState<Record<string, unknown> | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      if (draft.tripType) setTripType(draft.tripType);
      if (draft.pickup) setPickup(draft.pickup);
      if (draft.destination) setDestination(draft.destination);
      if (draft.date) setDate(draft.date);
      if (draft.time) setTime(draft.time);
      if (draft.returnDate) setReturnDate(draft.returnDate);
      if (draft.returnTime) setReturnTime(draft.returnTime);
      if (draft.hours) setHours(draft.hours);
      if (draft.flightNumber) setFlightNumber(draft.flightNumber);
      if (draft.passengers) setPassengers(draft.passengers);
      if (draft.vehicle) setVehicle(draft.vehicle);
      if (draft.selectedService) setSelectedService(draft.selectedService);
      if (draft.guest) setGuest(draft.guest);
      if (draft.specialInstructions) setSpecialInstructions(draft.specialInstructions);
      if (draft.step && draft.step !== "review") setStep(draft.step);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!initialService) return;
    setSelectedService(initialService);
    const lower = initialService.toLowerCase();
    if (lower.includes("hourly")) setTripType("Hourly");
    else if (lower.includes("airport")) setTripType("Airport transfer");
    else setTripType("One way");
    setStep("form");
    onServiceConsumed?.();
  }, [initialService, onServiceConsumed]);

  useEffect(() => {
    if (!hydrated || confirmation) return;
    const payload: Draft = {
      tripType, pickup, destination, date, time, returnDate, returnTime, hours,
      flightNumber, passengers, vehicle, selectedService, guest, specialInstructions, step,
    };
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    } catch {
      /* ignore quota */
    }
  }, [hydrated, confirmation, tripType, pickup, destination, date, time, returnDate, returnTime, hours, flightNumber, passengers, vehicle, selectedService, guest, specialInstructions, step]);

  const activeIndex = STEPS.indexOf(step);
  const needsDestination = tripType !== "Hourly";
  const needsReturn = tripType === "Round trip";
  const needsFlight = tripType === "Airport transfer" || /phx|aza|sky harbor|gateway/i.test(`${pickup} ${destination}`);

  const appleMapsUrl = `https://maps.apple.com/?saddr=${encodeURIComponent(pickup)}&daddr=${encodeURIComponent(destination)}&dirflg=d`;
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;

  const validateForm = useCallback(() => {
    const next: Record<string, string> = {};
    if (!pickup.trim()) next.pickup = "Enter a pickup location.";
    if (needsDestination && !destination.trim()) next.destination = "Enter a destination.";
    if (!date) next.date = "Choose a pickup date.";
    else if (date < todayISO()) next.date = "Pickup date can’t be in the past.";
    if (!time) next.time = "Choose a pickup time.";
    else if (isPastDateTime(date, time)) next.time = "Pickup time can’t be in the past.";
    if (needsReturn) {
      if (!returnDate) next.returnDate = "Choose a return date.";
      else if (returnDate < date) next.returnDate = "Return must be on or after pickup.";
      if (!returnTime) next.returnTime = "Choose a return time.";
    }
    if (tripType === "Hourly" && Number(hours) < 3) next.hours = "Hourly service requires a 3-hour minimum.";
    if (needsFlight && !flightNumber.trim()) next.flightNumber = "Add a flight number for airport meet & assist.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [pickup, destination, date, time, returnDate, returnTime, hours, flightNumber, needsDestination, needsReturn, needsFlight, tripType]);

  async function submitEstimate(event: FormEvent) {
    event.preventDefault();
    if (!validateForm()) return;
    setEstimating(true);
    setErrors({});
    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup, destination, pickupTime: time, tripType, vehicle, hours: Number(hours),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors({ form: data.error || "Could not build an estimate." });
        return;
      }
      setEstimate(data.estimate);
      setPickup(data.estimate.pickup);
      if (needsDestination) setDestination(data.estimate.destination);
      if (data.estimate.airportInvolved && tripType === "One way") setTripType("Airport transfer");
      setStep("estimate");
    } catch {
      setErrors({ form: "Estimate request failed. Check your connection and try again." });
    } finally {
      setEstimating(false);
    }
  }

  async function refreshEstimateForVehicle(nextVehicle: VehicleId) {
    setVehicle(nextVehicle);
    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup, destination, pickupTime: time, tripType, vehicle: nextVehicle, hours: Number(hours),
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setEstimate(data.estimate);
      }
    } catch {
      /* keep prior estimate */
    }
  }

  function goToStep(target: Step) {
    const targetIndex = STEPS.indexOf(target);
    if (targetIndex <= activeIndex) setStep(target);
  }

  function swapLocations() {
    setPickup(destination);
    setDestination(pickup);
  }

  async function requestReservation() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: selectedService,
          tripType,
          vehicle,
          pickup,
          destination: needsDestination ? destination : "As directed",
          pickupDate: date,
          pickupTime: time,
          returnDate: needsReturn ? returnDate : "",
          returnTime: needsReturn ? returnTime : "",
          hours: tripType === "Hourly" ? Number(hours) : undefined,
          flightNumber,
          passengers,
          customerName: `${guest.first} ${guest.last}`.trim(),
          customerEmail: guest.email,
          customerPhone: guest.phone,
          specialInstructions,
          estimatedFareCents: estimate?.fare.totalCents ?? 0,
          distanceMiles: estimate?.distanceMiles,
          durationMinutes: estimate?.durationMinutes,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Reservation could not be saved");
      setConfirmation({
        reference: data.booking.reference,
        message: data.confirmation?.message ?? "We’ll confirm within 2 hours.",
        emailHint: data.confirmation?.emailHint ?? "",
      });
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We couldn’t save your request. You can retry below or email reservations@permanenceexclusive.com.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function lookupBooking(event: FormEvent) {
    event.preventDefault();
    setLookupLoading(true);
    setLookupError("");
    setLookupResult(null);
    try {
      const response = await fetch("/api/bookings/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: lookupRef, email: lookupEmail }),
      });
      const data = await response.json();
      if (!response.ok) {
        setLookupError(data.error || "Lookup failed.");
        return;
      }
      setLookupResult(data.booking);
    } catch {
      setLookupError("Lookup failed. Check your connection and try again.");
    } finally {
      setLookupLoading(false);
    }
  }

  const fareDisplay = useMemo(
    () => (estimate ? formatUsd(estimate.fare.totalCents) : "—"),
    [estimate],
  );

  return (
    <>
      <div className="booking-progress" aria-label="Booking progress">
        {STEP_LABELS.map((label, index) => {
          const target = STEPS[index];
          const complete = index <= activeIndex;
          const clickable = index < activeIndex && !confirmation;
          return (
            <button
              type="button"
              className={complete ? "complete" : ""}
              key={label}
              disabled={!clickable}
              onClick={() => goToStep(target)}
              aria-current={index === activeIndex ? "step" : undefined}
            >
              <i>{index + 1}</i>{label}
            </button>
          );
        })}
      </div>

      {step === "form" ? (
        <div className="booking-stack">
          <form className="booking-card" onSubmit={submitEstimate} noValidate>
            <div className="selected-service"><span>Selected service</span><strong>{selectedService}</strong></div>
            <div className="trip-tabs" role="group" aria-label="Trip type">
              {(["One way", "Round trip", "Hourly"] as TripType[]).map((type) => (
                <button
                  className={tripType === type || (tripType === "Airport transfer" && type === "One way") ? "active" : ""}
                  key={type}
                  onClick={() => setTripType(type)}
                  type="button"
                >
                  {type}
                </button>
              ))}
            </div>
            {tripType === "Airport transfer" ? (
              <p className="trip-hint">Airport transfer — meet & assist at arrivals with your flight details.</p>
            ) : null}
            <PlaceField
              label="Pickup location"
              value={pickup}
              onChange={setPickup}
              placeholder="City, landmark, PHX, or AZA"
              error={errors.pickup}
              required
            />
            {needsDestination ? (
              <>
                <div className="swap-row">
                  <button type="button" className="swap-button" onClick={swapLocations} aria-label="Swap pickup and destination">⇅ Swap</button>
                </div>
                <PlaceField
                  label="Destination"
                  value={destination}
                  onChange={setDestination}
                  placeholder="Where are you going?"
                  error={errors.destination}
                  required
                />
              </>
            ) : null}
            <label className={`field${errors.date ? " has-error" : ""}`}>
              <span>Pickup date</span>
              <input required type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={Boolean(errors.date)} />
              {errors.date ? <em className="field-error">{errors.date}</em> : null}
            </label>
            <label className={`field${errors.time ? " has-error" : ""}`}>
              <span>Pickup time</span>
              <input required type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-invalid={Boolean(errors.time)} />
              {errors.time ? <em className="field-error">{errors.time}</em> : null}
            </label>
            {needsReturn ? (
              <>
                <label className={`field${errors.returnDate ? " has-error" : ""}`}>
                  <span>Return date</span>
                  <input type="date" min={date || todayISO()} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                  {errors.returnDate ? <em className="field-error">{errors.returnDate}</em> : null}
                </label>
                <label className={`field${errors.returnTime ? " has-error" : ""}`}>
                  <span>Return time</span>
                  <input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} />
                  {errors.returnTime ? <em className="field-error">{errors.returnTime}</em> : null}
                </label>
              </>
            ) : null}
            {tripType === "Hourly" ? (
              <label className={`field full${errors.hours ? " has-error" : ""}`}>
                <span>Hours needed</span>
                <select value={hours} onChange={(e) => setHours(e.target.value)}>
                  {[3, 4, 5, 6, 7, 8, 10, 12].map((count) => <option key={count} value={count}>{count} hours</option>)}
                </select>
                {errors.hours ? <em className="field-error">{errors.hours}</em> : null}
              </label>
            ) : null}
            {needsFlight ? (
              <label className={`field full${errors.flightNumber ? " has-error" : ""}`}>
                <span>Flight number</span>
                <input value={flightNumber} onChange={(e) => setFlightNumber(e.target.value.toUpperCase())} placeholder="e.g. AA1234" />
                {errors.flightNumber ? <em className="field-error">{errors.flightNumber}</em> : null}
              </label>
            ) : null}
            <label className="field full">
              <span>Passengers</span>
              <select value={passengers} onChange={(e) => setPassengers(e.target.value)}>
                {[1, 2, 3, 4, 5, 6].map((count) => <option key={count}>{count}</option>)}
              </select>
            </label>
            {errors.form ? <p className="form-error" role="alert">{errors.form}</p> : null}
            <button className="estimate-button" type="submit" disabled={estimating}>
              {estimating ? "Calculating estimate…" : "Get your estimate"} <Arrow />
            </button>
            <p className="form-note">No account required · Your details remain private</p>
          </form>

          <div className="lookup-shell">
            <button type="button" className="lookup-toggle" onClick={() => setLookupOpen((v) => !v)}>
              Already booked? Look up your reservation
            </button>
            {lookupOpen ? (
              <form className="lookup-panel" onSubmit={lookupBooking}>
                <label className="field"><span>Reference</span><input value={lookupRef} onChange={(e) => setLookupRef(e.target.value.toUpperCase())} placeholder="PE-XXXXXX" required /></label>
                <label className="field"><span>Email</span><input type="email" value={lookupEmail} onChange={(e) => setLookupEmail(e.target.value)} required /></label>
                <button className="estimate-button" type="submit" disabled={lookupLoading}>{lookupLoading ? "Searching…" : "Find booking"}</button>
                {lookupError ? <p className="form-error" role="alert">{lookupError}</p> : null}
                {lookupResult ? (
                  <div className="lookup-result">
                    <p><strong>{String(lookupResult.reference)}</strong> · {String(lookupResult.status)}</p>
                    <p>{String(lookupResult.pickup)} → {String(lookupResult.destination)}</p>
                    <p>{String(lookupResult.pickupDate)} at {String(lookupResult.pickupTime)}</p>
                    <p>Estimated fare · {formatUsd(Number(lookupResult.estimatedFareCents) || 0)}</p>
                  </div>
                ) : null}
              </form>
            ) : null}
          </div>
        </div>
      ) : step === "estimate" && estimate ? (
        <div className="booking-card result-card" aria-live="polite">
          <div className="result-top">
            <p className="eyebrow dark">Trip estimate</p>
            <button type="button" onClick={() => setStep("form")}>Edit trip</button>
          </div>
          {needsDestination ? (
            <>
              <div className="map-toolbar">
                <span>Route preview</span>
                <div>
                  <button type="button" className={mapProvider === "apple" ? "selected" : ""} onClick={() => setMapProvider("apple")}>Apple Maps</button>
                  <button type="button" className={mapProvider === "google" ? "selected" : ""} onClick={() => setMapProvider("google")}>Google Maps</button>
                </div>
              </div>
              <div className={`route-map ${mapProvider}`}>
                <div className="map-grid" aria-hidden="true" />
                <span className="map-city city-phoenix">PHOENIX</span>
                <span className="map-city city-scottsdale">SCOTTSDALE</span>
                <span className="map-city city-tempe">TEMPE</span>
                <i className="map-route" aria-hidden="true" />
                <i className="map-pin start" aria-hidden="true">A</i>
                <i className="map-pin end" aria-hidden="true">B</i>
                <div className="map-badge">{mapProvider === "apple" ? "Apple Maps" : "Google Maps"} · preview</div>
                <a href={mapProvider === "apple" ? appleMapsUrl : googleMapsUrl} target="_blank" rel="noreferrer">Open live directions <Arrow /></a>
              </div>
            </>
          ) : null}
          <div className="route">
            <div><i /><span><small>Pickup</small>{estimate.pickup}</span></div>
            <div><i /><span><small>Destination</small>{estimate.destination}</span></div>
          </div>
          <div className="trip-facts">
            {tripType === "Hourly" ? (
              <span><small>Duration</small>{hours} hours</span>
            ) : (
              <>
                <span><small>Estimated distance</small>{estimate.distanceMiles.toFixed(1)} mi{tripType === "Round trip" ? " each way" : ""}</span>
                <span><small>Estimated drive</small>{estimate.durationMinutes} min</span>
              </>
            )}
            <span><small>Pickup</small>{date} · {time}</span>
          </div>
          <div className="fare-breakdown">
            {estimate.fare.lines.map((line) => (
              <div key={line.label}><span>{line.label}</span><strong>{formatUsd(line.cents)}</strong></div>
            ))}
          </div>
          <div className="manual-quote">
            <p><strong>Estimated fare · {fareDisplay}</strong><br />{estimate.disclaimer}</p>
            <button type="button" onClick={() => setStep("vehicle")}>Choose vehicle <Arrow /></button>
          </div>
        </div>
      ) : step === "vehicle" ? (
        <div className="booking-card result-card" aria-live="polite">
          <div className="result-top">
            <p className="eyebrow dark">Select your service</p>
            <button type="button" onClick={() => setStep("estimate")}>Back to route</button>
          </div>
          <div className="vehicle-options">
            {([
              ["Luxury sedan", "Up to 3 passengers · 2 large bags", "Available"],
              ["Executive SUV", "Up to 6 passengers · 5 large bags", "Available"],
            ] as const).map(([name, capacity, status]) => (
              <button
                className={vehicle === name ? "vehicle-card selected" : "vehicle-card"}
                key={name}
                type="button"
                onClick={() => refreshEstimateForVehicle(name)}
              >
                <span className="vehicle-silhouette" aria-hidden="true" />
                <small>{status}</small>
                <strong>{name}</strong>
                <p>{capacity}</p>
                <b>{estimate && vehicle === name ? fareDisplay : "See estimate"}</b>
              </button>
            ))}
          </div>
          <div className="included"><span>Included</span><p>Private chauffeur · Bottled water · Climate control · Direct service</p></div>
          <button className="estimate-button" type="button" onClick={() => setStep("details")}>Continue with {vehicle} <Arrow /></button>
        </div>
      ) : step === "details" ? (
        <form className="booking-card guest-form" onSubmit={(event) => { event.preventDefault(); setStep("review"); }} noValidate>
          <div className="result-top full-row">
            <p className="eyebrow dark">Passenger details</p>
            <button type="button" onClick={() => setStep("vehicle")}>Back to vehicle</button>
          </div>
          <label className="field"><span>First name</span><input required autoComplete="given-name" value={guest.first} onChange={(e) => setGuest({ ...guest, first: e.target.value })} /></label>
          <label className="field"><span>Last name</span><input required autoComplete="family-name" value={guest.last} onChange={(e) => setGuest({ ...guest, last: e.target.value })} /></label>
          <label className="field full"><span>Email</span><input required type="email" autoComplete="email" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} placeholder="For your confirmation" /></label>
          <label className="field full"><span>Mobile phone</span><input required type="tel" autoComplete="tel" value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} placeholder="For trip updates" /></label>
          <label className="field full"><span>Special instructions · optional</span><input value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} placeholder="Accessibility needs, child seat, or other requests" /></label>
          <button className="estimate-button" type="submit">Review your journey <Arrow /></button>
          <p className="form-note">Guest checkout · No account required</p>
        </form>
      ) : (
        <div className="booking-card result-card review-card" aria-live="polite">
          {confirmation ? (
            <div className="confirmation-panel">
              <p className="eyebrow dark">Request received</p>
              <i>✓</i>
              <h3>Thank you, {guest.first}.</h3>
              <p>Your booking request <strong>{confirmation.reference}</strong> is with our reservations team.</p>
              <p className="confirm-note">{confirmation.message}</p>
              <p className="confirm-note">{confirmation.emailHint}</p>
              <p className="confirm-note">Save your reference to look up this booking anytime on this page.</p>
              <div>
                <button type="button" onClick={() => navigator.clipboard?.writeText(confirmation.reference)}>Copy reference</button>
                <button type="button" onClick={() => { setConfirmation(null); setStep("form"); setEstimate(null); }}>Plan another ride</button>
              </div>
            </div>
          ) : (
            <>
              <div className="result-top">
                <p className="eyebrow dark">Review</p>
                <button type="button" onClick={() => setStep("details")}>Edit details</button>
              </div>
              <h3>Your journey is ready to request.</h3>
              <div className="review-line"><span>Route</span><strong>{pickup}{needsDestination ? <><br />to {destination}</> : null}</strong></div>
              <div className="review-line"><span>When</span><strong>{date} at {time}{needsReturn ? <><br />Return {returnDate} at {returnTime}</> : null}</strong></div>
              <div className="review-line"><span>Service</span><strong>{vehicle} · {tripType} · {passengers} passenger{passengers === "1" ? "" : "s"}{flightNumber ? ` · Flight ${flightNumber}` : ""}</strong></div>
              <div className="review-line"><span>Passenger</span><strong>{guest.first} {guest.last}<br />{guest.email}</strong></div>
              <div className="review-total">
                <span>Estimated fare<small>Final on confirmation · Payment not yet charged</small></span>
                <strong>{fareDisplay}</strong>
              </div>
              {submitError ? (
                <div className="submit-error" role="alert">
                  <p>{submitError}</p>
                  <div>
                    <button type="button" onClick={requestReservation}>Retry request</button>
                    <a href={`mailto:reservations@permanenceexclusive.com?subject=${encodeURIComponent(`Reservation help · ${pickup}`)}&body=${encodeURIComponent(`Name: ${guest.first} ${guest.last}\nEmail: ${guest.email}\nPhone: ${guest.phone}\nPickup: ${pickup}\nDestination: ${destination}\nWhen: ${date} ${time}\nVehicle: ${vehicle}\nEstimated fare: ${fareDisplay}`)}`}>Email reservations</a>
                  </div>
                </div>
              ) : null}
              <button className="estimate-button" type="button" disabled={submitting} onClick={requestReservation}>
                {submitting ? "Saving your request…" : "Request reservation"} <Arrow />
              </button>
              <p className="form-note">We’ll confirm within 2 hours · Secure payment comes after confirmation</p>
            </>
          )}
        </div>
      )}
    </>
  );
}
