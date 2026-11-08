import { json2satrec, propagate, type OMMJsonObject } from "satellite.js";

export type SatelliteElements = OMMJsonObject;

export type CachedSatellite = {
  elements: SatelliteElements;
  fetchedAt: number;
};

export type SatelliteSnapshot = {
  satellites: CachedSatellite[];
  error: string | null;
};

const NUMBER_FIELDS = [
  "NORAD_CAT_ID",
  "MEAN_MOTION",
  "ECCENTRICITY",
  "INCLINATION",
  "RA_OF_ASC_NODE",
  "ARG_OF_PERICENTER",
  "MEAN_ANOMALY",
  "BSTAR",
  "MEAN_MOTION_DOT",
  "MEAN_MOTION_DDOT",
  "ELEMENT_SET_NO",
] as const;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseElements(value: unknown): SatelliteElements | null {
  if (!isRecord(value)) return null;

  if (typeof value.OBJECT_NAME !== "string" || !value.OBJECT_NAME.trim())
    return null;

  if (
    typeof value.EPOCH !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/.test(value.EPOCH)
  )
    return null;

  const epoch = new Date(
    value.EPOCH.endsWith("Z") ? value.EPOCH : value.EPOCH + "Z",
  );

  if (!Number.isFinite(epoch.getTime())) return null;

  const numbers = {} as Record<(typeof NUMBER_FIELDS)[number], number>;

  for (const key of NUMBER_FIELDS) {
    const raw = value[key];

    if (typeof raw !== "number" && (typeof raw !== "string" || !raw.trim()))
      return null;

    const number = Number(raw);

    if (!Number.isFinite(number)) return null;

    numbers[key] = number;
  }

  if (
    !Number.isSafeInteger(numbers.NORAD_CAT_ID) ||
    numbers.NORAD_CAT_ID <= 0 ||
    numbers.NORAD_CAT_ID > 999_999_999 ||
    numbers.MEAN_MOTION <= 0 ||
    numbers.ECCENTRICITY < 0 ||
    numbers.ECCENTRICITY >= 1 ||
    numbers.INCLINATION < 0 ||
    numbers.INCLINATION > 180 ||
    !Number.isInteger(numbers.ELEMENT_SET_NO) ||
    numbers.ELEMENT_SET_NO < 0
  )
    return null;

  for (const key of [
    "RA_OF_ASC_NODE",
    "ARG_OF_PERICENTER",
    "MEAN_ANOMALY",
  ] as const)
    if (numbers[key] < 0 || numbers[key] >= 360) return null;

  for (const [key, expected] of Object.entries({
    CENTER_NAME: "EARTH",
    REF_FRAME: "TEME",
    TIME_SYSTEM: "UTC",
    MEAN_ELEMENT_THEORY: "SGP4",
  })) {
    if (value[key] !== undefined && value[key] !== expected) return null;
  }

  if (value.EPHEMERIS_TYPE !== undefined && Number(value.EPHEMERIS_TYPE) !== 0)
    return null;

  const elements: SatelliteElements = {
    ...numbers,
    OBJECT_NAME: value.OBJECT_NAME.trim(),
    OBJECT_ID: typeof value.OBJECT_ID === "string" ? value.OBJECT_ID : "",
    EPOCH: epoch.toISOString(),
  };

  try {
    const satrec = json2satrec(elements);
    const state = propagate(satrec, epoch);

    if (satrec.error !== 0 || !state || !state.position || !state.velocity)
      return null;

    if (
      ![
        ...Object.values(state.position),
        ...Object.values(state.velocity),
      ].every(Number.isFinite)
    )
      return null;

    return elements;
  } catch {
    return null;
  }
}
