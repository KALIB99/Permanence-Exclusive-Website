"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatUsd, type TripType, type VehicleId } from "../../lib/fare";
import { ArrowDown, ArrowRight, ArrowUpDown, ArrowUpRight, Check, Lock, MapPin, Plane } from "./Icons";

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

type Personalization = {
  temperature: string;
  atmosphere: string;
  water: string;
  luggageHelp: string;
};

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
  personalization: Personalization;
  specialInstructions: string;
  step: Step;
};

const DRAFT_KEY = "pe-booking-draft-v2";
const STEPS: Step[] = ["form", "estimate", "vehicle", "details", "review"];
const STEP_LABELS = ["Trip", "Route Map", "Vehicle", "Preferences", "Review"];

export function Arrow({ down = false }: { down?: boolean }) {
  return (
    <span aria-hidden="true" className="arrow-icon">
      {down ? <ArrowDown size={14} /> : <ArrowUpRight size={14} />}
    </span>
  );
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function currentTimeHHMM(offsetMinutes = 30) {
  const d = new Date(Date.now() + offsetMinutes * 60 * 1000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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

export function PlaceField({
  label,
  value,
  onChange,
  placeholder,
  error,
  required,
  variant = "default",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  required?: boolean;
  variant?: "default" | "hero";
}) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!value || value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
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

  const suggestionList =
    open && suggestions.length > 0 ? (
      <ul className={`place-suggestions${variant === "hero" ? " hero-suggestions" : ""}`} role="listbox">
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
    ) : null;

  if (variant === "hero") {
    return (
      <div className="hero-quick-field place-field">
        <small>{label}</small>
        <input
          type="text"
          required={required}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder={placeholder}
          autoComplete="off"
          aria-label={label}
          aria-autocomplete="list"
        />
        {suggestionList}
      </div>
    );
  }

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
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        placeholder={placeholder}
        autoComplete="off"
        aria-invalid={Boolean(error)}
        aria-autocomplete="list"
      />
      {error ? <em className="field-error">{error}</em> : null}
      {suggestionList}
    </label>
  );
}

export default function BookingFlow({
  initialService,
  initialPickup,
  initialDestination,
  onServiceConsumed,
  onTripConsumed,
}: {
  initialService?: string | null;
  initialPickup?: string | null;
  initialDestination?: string | null;
  onServiceConsumed?: () => void;
  onTripConsumed?: () => void;
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
  const [personalization, setPersonalization] = useState<Personalization>({
    temperature: "Comfortable (70°F)",
    atmosphere: "Quiet & relaxing",
    water: "Chilled Still Water",
    luggageHelp: "Full Chauffeur Assistance",
  });
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
  const pendingAutoEstimate = useRef(false);

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
      if (draft.personalization) setPersonalization(draft.personalization);
      if (draft.specialInstructions) setSpecialInstructions(draft.specialInstructions);
      if (draft.step && draft.step !== "review") setStep(draft.step);
    } else {
      // Default to today and 30 min from now
      setDate(todayISO());
      setTime(currentTimeHHMM(30));
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
    if (!hydrated) return;
    if (!initialPickup && !initialDestination) return;
    if (initialPickup) setPickup(initialPickup);
    if (initialDestination) setDestination(initialDestination);
    if (initialPickup && /phx|aza|sky harbor|gateway|airport/i.test(initialPickup)) {
      setTripType("Airport transfer");
    } else {
      setTripType("One way");
    }
    setDate((current) => current || todayISO());
    setTime((current) => current || currentTimeHHMM(30));
    setStep("form");
    setEstimate(null);
    setConfirmation(null);
    setErrors({});
    pendingAutoEstimate.current = Boolean(initialPickup && initialDestination);
    onTripConsumed?.();
  }, [hydrated, initialPickup, initialDestination, onTripConsumed]);

  useEffect(() => {
    if (!hydrated || confirmation) return;
    const payload: Draft = {
      tripType, pickup, destination, date, time, returnDate, returnTime, hours,
      flightNumber, passengers, vehicle, selectedService, guest, personalization, specialInstructions, step,
    };
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    } catch {
      /* ignore quota */
    }
  }, [hydrated, confirmation, tripType, pickup, destination, date, time, returnDate, returnTime, hours, flightNumber, passengers, vehicle, selectedService, guest, personalization, specialInstructions, step]);

  const activeIndex = STEPS.indexOf(step);
  const needsDestination = tripType !== "Hourly";
  const needsReturn = tripType === "Round trip";
  const needsFlight = tripType === "Airport transfer" || /phx|aza|sky harbor|gateway|airport/i.test(`${pickup} ${destination}`);

  const appleMapsUrl = `https://maps.apple.com/?saddr=${encodeURIComponent(pickup)}&daddr=${encodeURIComponent(destination)}&dirflg=d`;
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;

  const validateForm = useCallback(() => {
    const next: Record<string, string> = {};
    if (!pickup.trim()) next.pickup = "Enter a pickup location (e.g. PHX Airport or Scottsdale resort).";
    if (needsDestination && !destination.trim()) next.destination = "Enter a destination address or landmark.";
    if (!date) next.date = "Select a pickup date.";
    else if (date < todayISO()) next.date = "Pickup date cannot be in the past.";
    if (!time) next.time = "Select a pickup time.";
    else if (isPastDateTime(date, time)) next.time = "Pickup time cannot be in the past.";
    if (needsReturn) {
      if (!returnDate) next.returnDate = "Select a return date.";
      else if (returnDate < date) next.returnDate = "Return date must be on or after pickup date.";
      if (!returnTime) next.returnTime = "Select a return time.";
    }
    if (tripType === "Hourly" && Number(hours) < 3) next.hours = "Hourly chauffeur service requires a 3-hour minimum.";
    // Flight number is helpful for meet & assist but not required to calculate a fare.
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [pickup, destination, date, time, returnDate, returnTime, hours, needsDestination, needsReturn, tripType]);

  const runEstimate = useCallback(async () => {
    if (!validateForm()) return false;
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
        setErrors({ form: data.error || "Could not calculate an estimate." });
        return false;
      }
      setEstimate(data.estimate);
      setPickup(data.estimate.pickup);
      if (needsDestination) setDestination(data.estimate.destination);
      if (data.estimate.airportInvolved && tripType === "One way") setTripType("Airport transfer");
      setStep("estimate");
      return true;
    } catch {
      setErrors({ form: "Estimate request failed. Please check your internet connection." });
      return false;
    } finally {
      setEstimating(false);
    }
  }, [validateForm, pickup, destination, time, tripType, vehicle, hours, needsDestination]);

  async function submitEstimate(event: FormEvent) {
    event.preventDefault();
    await runEstimate();
  }

  useEffect(() => {
    if (!pendingAutoEstimate.current) return;
    if (!pickup.trim() || !destination.trim() || !date || !time) return;
    pendingAutoEstimate.current = false;
    void runEstimate();
  }, [pickup, destination, date, time, runEstimate]);

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

  function setQuickTime(offsetMins: number) {
    setDate(todayISO());
    setTime(currentTimeHHMM(offsetMins));
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
          specialInstructions: `[Prefs: ${personalization.temperature}, ${personalization.atmosphere}, ${personalization.water}, ${personalization.luggageHelp}] ${specialInstructions}`.trim(),
          estimatedFareCents: estimate?.fare.totalCents ?? 0,
          distanceMiles: estimate?.distanceMiles,
          durationMinutes: estimate?.durationMinutes,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Reservation could not be processed");
      setConfirmation({
        reference: data.booking.reference,
        message: data.confirmation?.message ?? "Your chauffeur reservation is confirmed with our executive dispatch.",
        emailHint: data.confirmation?.emailHint ?? "A detailed itinerary has been sent to your email.",
      });
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We couldn’t save your request. You can retry below or contact reservations directly.",
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
        setLookupError(data.error || "Reservation lookup failed.");
        return;
      }
      setLookupResult(data.booking);
    } catch {
      setLookupError("Lookup failed. Please verify reference code and email.");
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
        <div className="booking-stack step-panel" key="step-form">
          <form className="booking-card" onSubmit={submitEstimate} noValidate>
            <div className="selected-service">
              <span>Chauffeur Service</span>
              <strong>{selectedService}</strong>
            </div>

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
              <p className="trip-hint"><Plane size={14} /> Airport transfer includes terminal flight tracking & executive meet-and-assist.</p>
            ) : null}

            <PlaceField
              label="Pickup Location"
              value={pickup}
              onChange={setPickup}
              placeholder="e.g. Phoenix Sky Harbor (PHX), Scottsdale Resort, Address"
              error={errors.pickup}
              required
            />

            {needsDestination ? (
              <>
                <div className="swap-row">
                  <button type="button" className="swap-button" onClick={swapLocations} aria-label="Swap pickup and destination">
                    <ArrowUpDown size={13} /> Swap Locations
                  </button>
                </div>
                <PlaceField
                  label="Destination"
                  value={destination}
                  onChange={setDestination}
                  placeholder="Where can we chauffeur you?"
                  error={errors.destination}
                  required
                />
              </>
            ) : null}

            <label className={`field${errors.date ? " has-error" : ""}`}>
              <span>Pickup Date</span>
              <input required type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={Boolean(errors.date)} />
              {errors.date ? <em className="field-error">{errors.date}</em> : null}
            </label>

            <label className={`field${errors.time ? " has-error" : ""}`}>
              <span>Pickup Time</span>
              <input required type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-invalid={Boolean(errors.time)} />
              {errors.time ? <em className="field-error">{errors.time}</em> : null}
            </label>

            <div className="quick-time-presets">
              <button type="button" onClick={() => setQuickTime(30)}>In 30 min</button>
              <button type="button" onClick={() => setQuickTime(60)}>In 1 hour</button>
              <button type="button" onClick={() => setQuickTime(120)}>In 2 hours</button>
            </div>

            {needsReturn ? (
              <>
                <label className={`field${errors.returnDate ? " has-error" : ""}`}>
                  <span>Return Date</span>
                  <input type="date" min={date || todayISO()} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                  {errors.returnDate ? <em className="field-error">{errors.returnDate}</em> : null}
                </label>
                <label className={`field${errors.returnTime ? " has-error" : ""}`}>
                  <span>Return Time</span>
                  <input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} />
                  {errors.returnTime ? <em className="field-error">{errors.returnTime}</em> : null}
                </label>
              </>
            ) : null}

            {tripType === "Hourly" ? (
              <label className={`field full${errors.hours ? " has-error" : ""}`}>
                <span>Chauffeur Hours</span>
                <select value={hours} onChange={(e) => setHours(e.target.value)}>
                  {[3, 4, 5, 6, 7, 8, 10, 12].map((count) => <option key={count} value={count}>{count} hours (Dedicated Vehicle)</option>)}
                </select>
                {errors.hours ? <em className="field-error">{errors.hours}</em> : null}
              </label>
            ) : null}

            {needsFlight ? (
              <label className={`field full${errors.flightNumber ? " has-error" : ""}`}>
                <span>Flight Number · Optional for estimate</span>
                <input value={flightNumber} onChange={(e) => setFlightNumber(e.target.value.toUpperCase())} placeholder="e.g. AA 1420 or DL 482" />
                {errors.flightNumber ? <em className="field-error">{errors.flightNumber}</em> : null}
              </label>
            ) : null}

            <label className="field full">
              <span>Passengers & Luggage</span>
              <select value={passengers} onChange={(e) => setPassengers(e.target.value)}>
                <option value="1">1 Passenger · Up to 2 Large Bags</option>
                <option value="2">2 Passengers · Up to 3 Large Bags</option>
                <option value="3">3 Passengers · Up to 3 Bags (Sedan Max)</option>
                <option value="4">4 Passengers · Executive SUV Recommended</option>
                <option value="5">5 Passengers · Executive SUV</option>
                <option value="6">6 Passengers · Executive SUV Max</option>
              </select>
            </label>

            {errors.form ? <p className="form-error" role="alert">{errors.form}</p> : null}

            <button className="estimate-button" type="submit" disabled={estimating}>
              {estimating ? "Calculating Fare & Route…" : "Calculate Instant Estimate"} <Arrow />
            </button>

            <p className="form-note"><Lock size={12} /> Transparent pricing · Prearranged luxury transportation · No hidden fees</p>
          </form>

          <div className="lookup-shell">
            <button type="button" className="lookup-toggle" onClick={() => setLookupOpen((v) => !v)}>
              Already reserved? Manage or look up your journey <ArrowRight size={13} />
            </button>
            {lookupOpen ? (
              <form className="lookup-panel" onSubmit={lookupBooking}>
                <label className="field"><span>Booking Reference</span><input value={lookupRef} onChange={(e) => setLookupRef(e.target.value.toUpperCase())} placeholder="PE-XXXXXX" required /></label>
                <label className="field"><span>Email Address</span><input type="email" value={lookupEmail} onChange={(e) => setLookupEmail(e.target.value)} required /></label>
                <button className="estimate-button" type="submit" disabled={lookupLoading}>{lookupLoading ? "Searching…" : "Find Reservation"}</button>
                {lookupError ? <p className="form-error" role="alert">{lookupError}</p> : null}
                {lookupResult ? (
                  <div className="lookup-result">
                    <p><strong>{String(lookupResult.reference)}</strong> · Status: <span style={{ color: "#d4af37", fontWeight: 700 }}>{String(lookupResult.status)}</span></p>
                    <p>{String(lookupResult.pickup)} → {String(lookupResult.destination)}</p>
                    <p>{String(lookupResult.pickupDate)} at {String(lookupResult.pickupTime)}</p>
                    <p>Estimated Fare: <strong>{formatUsd(Number(lookupResult.estimatedFareCents) || 0)}</strong></p>
                  </div>
                ) : null}
              </form>
            ) : null}
          </div>
        </div>
      ) : step === "estimate" && estimate ? (
        <div className="booking-card result-card step-panel" key="step-estimate" aria-live="polite">
          <div className="result-top">
            <p className="eyebrow dark">Interactive Route & Fare Estimate</p>
            <button type="button" onClick={() => setStep("form")}>Edit Route & Schedule</button>
          </div>

          {needsDestination ? (
            <>
              <div className="map-toolbar">
                <span>Arizona Valley Route Map</span>
                <div>
                  <button type="button" className={mapProvider === "apple" ? "selected" : ""} onClick={() => setMapProvider("apple")}>Apple Maps</button>
                  <button type="button" className={mapProvider === "google" ? "selected" : ""} onClick={() => setMapProvider("google")}>Google Maps</button>
                </div>
              </div>
              <div className={`route-map ${mapProvider}`}>
                <div className="map-grid" aria-hidden="true" />
                <span className="map-city city-phoenix">PHOENIX SKY HARBOR</span>
                <span className="map-city city-scottsdale">SCOTTSDALE</span>
                <span className="map-city city-tempe">PARADISE VALLEY</span>

                {/* Animated Route Line SVG */}
                <svg className="map-route-svg" viewBox="0 0 400 240" fill="none">
                  <path
                    d="M 120 170 Q 200 90 280 60"
                    stroke={mapProvider === "apple" ? "#d4af37" : "#34d399"}
                    strokeWidth="3"
                    strokeDasharray="6 4"
                  />
                </svg>

                <div className="map-pin start" style={{ left: "30%", top: "70%" }}>A</div>
                <div className="map-pin end" style={{ left: "70%", top: "25%" }}>B</div>

                <div className="map-badge">
                  <MapPin size={12} /> {estimate.distanceMiles.toFixed(1)} miles · ~{estimate.durationMinutes} min drive
                </div>

                <a href={mapProvider === "apple" ? appleMapsUrl : googleMapsUrl} target="_blank" rel="noreferrer">
                  Open Live Map <Arrow />
                </a>
              </div>
            </>
          ) : null}

          <div className="route">
            <div><i></i><span><small>Pickup Point</small>{estimate.pickup}</span></div>
            <div><i></i><span><small>Destination Point</small>{estimate.destination}</span></div>
          </div>

          <div className="trip-facts">
            {tripType === "Hourly" ? (
              <span><small>Chauffeur Time</small>{hours} Hours Dedicated</span>
            ) : (
              <>
                <span><small>Distance</small>{estimate.distanceMiles.toFixed(1)} miles</span>
                <span><small>Est. Duration</small>{estimate.durationMinutes} minutes</span>
              </>
            )}
            <span><small>Scheduled Pickup</small>{date} at {time}</span>
          </div>

          <div className="fare-breakdown">
            {estimate.fare.lines.map((line) => (
              <div key={line.label}><span>{line.label}</span><strong>{formatUsd(line.cents)}</strong></div>
            ))}
          </div>

          <div className="manual-quote">
            <div>
              <p>Estimated Total Fare</p>
              <strong>{fareDisplay}</strong>
            </div>
            <button type="button" onClick={() => setStep("vehicle")}>
              Select Vehicle <Arrow />
            </button>
          </div>
        </div>
      ) : step === "vehicle" ? (
        <div className="booking-card result-card step-panel" key="step-vehicle" aria-live="polite">
          <div className="result-top">
            <p className="eyebrow dark">Select Chauffeur Vehicle</p>
            <button type="button" onClick={() => setStep("estimate")}>← Route & Map</button>
          </div>

          <div className="vehicle-options">
            {([
              {
                id: "Luxury sedan",
                name: "Luxury Executive Sedan",
                capacity: "Up to 3 passengers · 3 large bags",
                amenities: ["Leather Interior", "Chilled Bottled Water", "Wi-Fi", "Flight Tracking"],
                status: "Available",
              },
              {
                id: "Executive SUV",
                name: "Executive Luxury SUV",
                capacity: "Up to 6 passengers · 5 large bags",
                amenities: ["Extra Legroom", "Spacious Luggage", "Rear Climate Control", "Premium Audio"],
                status: "Available",
              },
            ] as const).map((v) => (
              <button
                className={vehicle === v.id ? "vehicle-card selected" : "vehicle-card"}
                key={v.id}
                type="button"
                onClick={() => refreshEstimateForVehicle(v.id as VehicleId)}
              >
                <small>{v.status}</small>
                <strong>{v.name}</strong>
                <p>{v.capacity}</p>
                <div className="vehicle-amenities">
                  {v.amenities.map((a) => (
                    <span key={a} className="vehicle-amenity-tag">{a}</span>
                  ))}
                </div>
                <b>{estimate && vehicle === v.id ? fareDisplay : "View Fare"}</b>
              </button>
            ))}
          </div>

          <div className="included">
            <span>Standard Inclusions</span>
            <p>Vetted Chauffeur · Flight Tracking & Meet & Assist · Bottled Water · Climate Control · Zero Hidden Surcharges</p>
          </div>

          <button className="estimate-button" type="button" onClick={() => setStep("details")}>
            Customize Ride & Passenger Details <Arrow />
          </button>
        </div>
      ) : step === "details" ? (
        <form className="booking-card guest-form step-panel" key="step-details" onSubmit={(event) => { event.preventDefault(); setStep("review"); }} noValidate>
          <div className="result-top full-row">
            <p className="eyebrow dark">Chauffeur Preferences & Contact Details</p>
            <button type="button" onClick={() => setStep("vehicle")}>← Vehicle Selection</button>
          </div>

          {/* Personalization Options */}
          <div className="field full">
            <span style={{ fontWeight: 700, color: "var(--gold-dark)" }}>Cabin Personalization (Chauffeur Standard)</span>
            <div className="personalization-grid">
              <div className="personalization-item">
                <span>Cabin Climate</span>
                <select value={personalization.temperature} onChange={(e) => setPersonalization({ ...personalization, temperature: e.target.value })}>
                  <option>Comfortable (70°F)</option>
                  <option>Cooler (67°F)</option>
                  <option>Warmer (73°F)</option>
                </select>
              </div>
              <div className="personalization-item">
                <span>Atmosphere</span>
                <select value={personalization.atmosphere} onChange={(e) => setPersonalization({ ...personalization, atmosphere: e.target.value })}>
                  <option>Quiet & relaxing</option>
                  <option>Chauffeur conversation welcome</option>
                  <option>Classical / Soft Jazz</option>
                  <option>News / Financial Radio</option>
                </select>
              </div>
              <div className="personalization-item">
                <span>Complimentary Water</span>
                <select value={personalization.water} onChange={(e) => setPersonalization({ ...personalization, water: e.target.value })}>
                  <option>Chilled Still Water</option>
                  <option>Sparkling Water</option>
                  <option>Room Temperature</option>
                </select>
              </div>
              <div className="personalization-item">
                <span>Luggage Assistance</span>
                <select value={personalization.luggageHelp} onChange={(e) => setPersonalization({ ...personalization, luggageHelp: e.target.value })}>
                  <option>Full Chauffeur Assistance</option>
                  <option>Hand luggage only</option>
                </select>
              </div>
            </div>
          </div>

          <label className="field">
            <span>First Name</span>
            <input required autoComplete="given-name" value={guest.first} onChange={(e) => setGuest({ ...guest, first: e.target.value })} placeholder="e.g. Eleanor" />
          </label>
          <label className="field">
            <span>Last Name</span>
            <input required autoComplete="family-name" value={guest.last} onChange={(e) => setGuest({ ...guest, last: e.target.value })} placeholder="e.g. Vance" />
          </label>
          <label className="field full">
            <span>Email Address</span>
            <input required type="email" autoComplete="email" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} placeholder="For instant itinerary & confirmation" />
          </label>
          <label className="field full">
            <span>Mobile Phone</span>
            <input required type="tel" autoComplete="tel" value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} placeholder="For chauffeur SMS dispatch updates" />
          </label>
          <label className="field full">
            <span>Special Requests · Optional</span>
            <input value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} placeholder="Child seat, wheelchair accessibility, or specific arrival notes" />
          </label>

          <button className="estimate-button" type="submit">
            Review Trip Summary <Arrow />
          </button>
          <p className="form-note">Guest booking · No login password required</p>
        </form>
      ) : (
        <div className="booking-card result-card review-card step-panel" key="step-review" aria-live="polite">
          {confirmation ? (
            <div className="confirmation-panel">
              <p className="eyebrow dark">Reservation Confirmed</p>
              <i className="confirm-check"><Check size={26} /></i>
              <h3>Thank you, {guest.first}.</h3>
              <p>Your reservation <strong>{confirmation.reference}</strong> is officially registered with our executive dispatch.</p>
              <p className="confirm-note">{confirmation.message}</p>
              <p className="confirm-note">{confirmation.emailHint}</p>
              <div>
                <button type="button" onClick={() => navigator.clipboard?.writeText(confirmation.reference)}>
                  Copy Reference Code ({confirmation.reference})
                </button>
                <button type="button" onClick={() => { setConfirmation(null); setStep("form"); setEstimate(null); }}>
                  Reserve Another Journey
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="result-top">
                <p className="eyebrow dark">Final Trip Review</p>
                <button type="button" onClick={() => setStep("details")}>Edit Details</button>
              </div>

              <h3>Your journey is ready to submit.</h3>

              <div className="review-line">
                <span>Route</span>
                <strong>{pickup}{needsDestination ? <><br />→ {destination}</> : null}</strong>
              </div>

              <div className="review-line">
                <span>Date & Time</span>
                <strong>{date} at {time}{needsReturn ? <><br />Return: {returnDate} at {returnTime}</> : null}</strong>
              </div>

              <div className="review-line">
                <span>Vehicle & Service</span>
                <strong>{vehicle} · {tripType} · {passengers} Passenger(s){flightNumber ? ` · Flight ${flightNumber}` : ""}</strong>
              </div>

              <div className="review-line">
                <span>Cabin Preferences</span>
                <strong>{personalization.temperature} · {personalization.atmosphere} · {personalization.water}</strong>
              </div>

              <div className="review-line">
                <span>Passenger</span>
                <strong>{guest.first} {guest.last}<br />{guest.email} · {guest.phone}</strong>
              </div>

              <div className="review-total">
                <span>Estimated Fare<small>Guaranteed rate · Payment upon confirmation</small></span>
                <strong>{fareDisplay}</strong>
              </div>

              {submitError ? (
                <div className="submit-error" role="alert">
                  <p>{submitError}</p>
                  <div>
                    <button type="button" onClick={requestReservation}>Retry Request</button>
                    <a href={`mailto:reservations@permanenceexclusive.com?subject=${encodeURIComponent(`Reservation Inquiry · ${pickup}`)}`}>Email Executive Reservations</a>
                  </div>
                </div>
              ) : null}

              <button className="estimate-button" type="button" disabled={submitting} onClick={requestReservation}>
                {submitting ? "Securing Chauffeur Reservation…" : "Request Chauffeur Reservation"} <Arrow />
              </button>
              <p className="form-note">Dispatch confirmation within 2 hours · Direct private service</p>
            </>
          )}
        </div>
      )}
    </>
  );
}
