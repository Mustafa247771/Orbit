export const NEARBY_RADIUS_KM = 150;

const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

// Keeps a longitude cell inside -180..179.
const wrapLon = (cell: number) => ((((cell + 180) % 360) + 360) % 360) - 180;

export function cellOf(lat: number, lon: number): string {
  return `${Math.floor(lat)}:${wrapLon(Math.floor(lon))}`;
}

const KM_PER_DEGREE = 111;
// Beyond this many cells each side the ring would blow past Firestore's `in` limits
// (queries are chunked by 30 values); only latitudes above ~85 degrees reach it.
const MAX_LON_CELLS = 12;

// Every cell that can hold a point within NEARBY_RADIUS_KM of (lat, lon). Rows
// scale with the radius; columns widen with latitude because meridians converge.
export function neighbourCells(lat: number, lon: number): string[] {
  const latCell = Math.floor(lat);
  const lonCell = Math.floor(lon);
  const latSpan = Math.ceil(NEARBY_RADIUS_KM / KM_PER_DEGREE);
  // Use the poleward edge of the search disc, where a degree of longitude is shortest.
  const poleward = Math.min(89, Math.abs(lat) + NEARBY_RADIUS_KM / KM_PER_DEGREE);
  const lonSpan = Math.min(
    MAX_LON_CELLS,
    Math.ceil(NEARBY_RADIUS_KM / (KM_PER_DEGREE * Math.cos(toRadians(poleward)))),
  );
  const cells = new Set<string>();

  for (let dLat = -latSpan; dLat <= latSpan; dLat++) {
    const row = Math.min(90, Math.max(-90, latCell + dLat));
    for (let dLon = -lonSpan; dLon <= lonSpan; dLon++) {
      cells.add(`${row}:${wrapLon(lonCell + dLon)}`);
    }
  }
  return [...cells];
}

type Point = { latitude: number; longitude: number };

export function distanceKm(a: Point, b: Point): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) *
      Math.cos(toRadians(b.latitude)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
