import type { SatelliteElements } from "./SatelliteData";

export type ObjectKind = "payload" | "rocket" | "debris" | "unknown";

export type CatalogueObject = {
  id: number;
  name: string;
  kind: ObjectKind;
  elements: SatelliteElements;
};

export type Catalogue = {
  updatedAt: number;
  objects: CatalogueObject[];
  brightIds: number[];
  warning: string | null;
};

export type CatalogueSnapshot = {
  catalogue: Catalogue | null;
  error: string | null;
};

export type Group = { fetchedAt: number; records: SatelliteElements[] };
export type Types = { fetchedAt: number; kinds: Record<string, ObjectKind> };

export const OBJECT_LABELS: Record<ObjectKind, string> = {
  payload: "Satellite",
  rocket: "Rocket body",
  debris: "Debris",
  unknown: "Unknown object",
};

export const COLLECTIONS = [
  { key: "visual", label: "bright objects", kind: "unknown" },
  { key: "active", label: "active satellites", kind: "payload" },
  { key: "fengyun-1c-debris", label: "Fengyun debris", kind: "debris" },
  { key: "iridium-33-debris", label: "Iridium debris", kind: "debris" },
  { key: "cosmos-2251-debris", label: "Cosmos debris", kind: "debris" },
] as const;
