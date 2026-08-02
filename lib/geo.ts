export type Place = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  kind: "airport" | "city" | "landmark" | "area";
  aliases?: string[];
};

/** Curated Arizona Valley network used when no Mapbox/Google key is set. */
export const VALLEY_PLACES: Place[] = [
  { id: "phx", label: "Phoenix Sky Harbor International Airport (PHX)", lat: 33.4373, lng: -112.0078, kind: "airport", aliases: ["phx", "sky harbor", "phoenix airport"] },
  { id: "aza", label: "Phoenix-Mesa Gateway Airport (AZA)", lat: 33.3078, lng: -111.6556, kind: "airport", aliases: ["aza", "mesa gateway", "gateway airport"] },
  { id: "downtown-phx", label: "Downtown Phoenix", lat: 33.4484, lng: -112.074, kind: "area", aliases: ["phoenix", "downtown"] },
  { id: "scottsdale", label: "Scottsdale", lat: 33.4942, lng: -111.9261, kind: "city" },
  { id: "old-town", label: "Old Town Scottsdale", lat: 33.4939, lng: -111.926, kind: "landmark", aliases: ["old town"] },
  { id: "paradise-valley", label: "Paradise Valley", lat: 33.5312, lng: -111.9426, kind: "city" },
  { id: "tempe", label: "Tempe", lat: 33.4255, lng: -111.94, kind: "city" },
  { id: "asu", label: "Arizona State University, Tempe", lat: 33.4242, lng: -111.9281, kind: "landmark", aliases: ["asu"] },
  { id: "chandler", label: "Chandler", lat: 33.3062, lng: -111.8413, kind: "city" },
  { id: "gilbert", label: "Gilbert", lat: 33.3528, lng: -111.789, kind: "city" },
  { id: "mesa", label: "Mesa", lat: 33.4152, lng: -111.8315, kind: "city" },
  { id: "glendale", label: "Glendale", lat: 33.5387, lng: -112.186, kind: "city" },
  { id: "peoria", label: "Peoria", lat: 33.5806, lng: -112.2374, kind: "city" },
  { id: "goodyear", label: "Goodyear", lat: 33.4353, lng: -112.3577, kind: "city" },
  { id: "avondale", label: "Avondale", lat: 33.4356, lng: -112.3496, kind: "city" },
  { id: "surprise", label: "Surprise", lat: 33.6292, lng: -112.3679, kind: "city" },
  { id: "cave-creek", label: "Cave Creek", lat: 33.8334, lng: -111.9507, kind: "city" },
  { id: "fountain-hills", label: "Fountain Hills", lat: 33.6117, lng: -111.7174, kind: "city" },
  { id: "carefree", label: "Carefree", lat: 33.8223, lng: -111.9182, kind: "city" },
  { id: "biltmore", label: "Biltmore Fashion Park, Phoenix", lat: 33.5102, lng: -112.027, kind: "landmark", aliases: ["biltmore"] },
  { id: "arcadia", label: "Arcadia, Phoenix", lat: 33.5002, lng: -111.978, kind: "area" },
  { id: "kierland", label: "Kierland Commons, Scottsdale", lat: 33.6235, lng: -111.929, kind: "landmark", aliases: ["kierland"] },
  { id: "fashion-square", label: "Scottsdale Fashion Square", lat: 33.5038, lng: -111.929, kind: "landmark" },
  { id: "state-farm", label: "State Farm Stadium, Glendale", lat: 33.5275, lng: -112.2625, kind: "landmark", aliases: ["cardinals", "stadium"] },
  { id: "footprint", label: "Footprint Center, Phoenix", lat: 33.4453, lng: -112.0712, kind: "landmark", aliases: ["suns arena", "footprint"] },
  { id: "desert-ridge", label: "Desert Ridge Marketplace, Phoenix", lat: 33.675, lng: -111.968, kind: "landmark" },
  { id: "tucson", label: "Tucson", lat: 32.2226, lng: -110.9747, kind: "city" },
  { id: "sedona", label: "Sedona", lat: 34.8697, lng: -111.761, kind: "city" },
  { id: "flagstaff", label: "Flagstaff", lat: 35.1983, lng: -111.6513, kind: "city" },
];

const AIRPORT_PATTERN = /\b(phx|aza|sky\s*harbor|mesa\s*gateway|gateway\s*airport|phoenix\s+airport)\b/i;

export function isAirportQuery(value: string) {
  if (AIRPORT_PATTERN.test(value)) return true;
  const place = resolvePlace(value);
  return place?.kind === "airport";
}

export function searchPlaces(query: string, limit = 8): Place[] {
  const q = query.trim().toLowerCase();
  if (!q) return VALLEY_PLACES.filter((p) => p.kind === "airport" || p.kind === "city").slice(0, limit);

  const scored = VALLEY_PLACES.map((place) => {
    const haystack = [place.label, ...(place.aliases ?? [])].join(" ").toLowerCase();
    let score = 0;
    if (haystack.startsWith(q)) score += 40;
    if (haystack.includes(q)) score += 20;
    for (const token of q.split(/\s+/)) {
      if (token.length > 1 && haystack.includes(token)) score += 8;
    }
    if (place.kind === "airport" && AIRPORT_PATTERN.test(q)) score += 25;
    return { place, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((row) => row.place);
}

export function resolvePlace(query: string): Place | null {
  const matches = searchPlaces(query, 1);
  if (!matches.length) return null;
  const q = query.trim().toLowerCase();
  const best = matches[0];
  const haystack = [best.label, ...(best.aliases ?? [])].join(" ").toLowerCase();
  if (haystack.includes(q) || q.includes(haystack.split(",")[0].toLowerCase()) || q.length >= 4) {
    return best;
  }
  return best;
}

/** Great-circle miles between two coordinates. */
export function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Road distance is typically ~1.25× straight-line in metro Phoenix. */
export function estimateRoadMiles(straightLineMiles: number) {
  return Math.max(3, straightLineMiles * 1.25);
}

export function estimateDriveMinutes(roadMiles: number) {
  // Valley average ~28 mph including lights; freeways faster for longer trips
  const mph = roadMiles > 40 ? 52 : roadMiles > 18 ? 36 : 28;
  return Math.max(12, Math.round((roadMiles / mph) * 60));
}
