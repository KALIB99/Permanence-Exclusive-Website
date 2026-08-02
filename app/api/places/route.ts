import { searchPlaces } from "../../../lib/geo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 120);
  const places = searchPlaces(q, 8).map((place) => ({
    id: place.id,
    label: place.label,
    kind: place.kind,
  }));
  return Response.json({ places });
}
