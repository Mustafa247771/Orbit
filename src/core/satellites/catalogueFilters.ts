import type { CatalogueObject } from "@/core/satellites/catalogueTypes";

export type CatalogueMode = "all" | "bright" | "tracked";

export const CATALOGUE_MODES = [
  { value: "all", label: "All available" },
  { value: "bright", label: "Bright" },
  { value: "tracked", label: "Tracked" },
] as const;

export function matchesMode(
  id: number,
  mode: CatalogueMode | null,
  tracked: ReadonlySet<number>,
  bright: ReadonlySet<number>,
) {
  return (
    mode === "all" ||
    (mode === "bright" && bright.has(id)) ||
    (mode === "tracked" && tracked.has(id))
  );
}

export function searchCatalogue(objects: CatalogueObject[], query: string) {
  const normalized = query.trim().toLowerCase();

  return normalized
    ? objects
        .filter(
          (item) =>
            item.name.toLowerCase().includes(normalized) ||
            String(item.id).includes(normalized),
        )
        .slice(0, 50)
    : [];
}

export function objectSearchResults(
  objects: CatalogueObject[],
  query: string,
  mode: CatalogueMode | null,
  trackedIds: ReadonlySet<number>,
) {
  const text = query.trim().toLowerCase();
  const matches = text
    ? searchCatalogue(objects, query)
    : mode === "tracked"
      ? objects.filter((item) => trackedIds.has(item.id)).slice(0, 50)
      : [];
  const available = matches.map(({ id, name, kind }) => ({
    id,
    name,
    kind,
    available: true,
  }));
  const availableIds = new Set(objects.map((item) => item.id));
  const unavailable = [...trackedIds]
    .filter(
      (id) =>
        !availableIds.has(id) &&
        (text ? String(id).includes(text) : mode === "tracked"),
    )
    .map((id) => ({
      id,
      name: `NORAD ${id}`,
      kind: "unknown" as const,
      available: false,
    }));

  return [...available, ...unavailable].slice(0, 50);
}
