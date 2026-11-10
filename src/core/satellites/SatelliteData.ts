import { json2satrec, type OMMJsonObject } from "satellite.js";

export type SatelliteElements = OMMJsonObject;

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

  const { OBJECT_NAME: name, EPOCH: epochText } = value;

  if (typeof name !== "string" || !name.trim()) return null;
  if (typeof epochText !== "string") return null;

  const epoch = new Date(epochText.endsWith("Z") ? epochText : `${epochText}Z`);

  if (Number.isNaN(epoch.getTime())) return null;

  const numbers = {} as Record<(typeof NUMBER_FIELDS)[number], number>;

  for (const key of NUMBER_FIELDS) {
    const raw = value[key];
    const number =
      typeof raw === "number" || (typeof raw === "string" && raw.trim())
        ? Number(raw)
        : NaN;

    if (!Number.isFinite(number)) return null;

    numbers[key] = number;
  }

  if (!Number.isSafeInteger(numbers.NORAD_CAT_ID) || numbers.NORAD_CAT_ID <= 0)
    return null;

  const elements: SatelliteElements = {
    ...numbers,
    OBJECT_NAME: name.trim(),
    OBJECT_ID: typeof value.OBJECT_ID === "string" ? value.OBJECT_ID : "",
    EPOCH: epoch.toISOString(),
  };

  try {
    return json2satrec(elements).error === 0 ? elements : null;
  } catch {
    return null;
  }
}
