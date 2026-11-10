import type { SavedLocation } from "./Profile";

type LocationInput = { name: string; latitude: number; longitude: number };

// Exactly one default when the list is not empty, the first one if none is set.
export function ensureOneDefault(list: SavedLocation[]): SavedLocation[] {
  const defaultId = list.find((place) => place.isDefault)?.id ?? list[0]?.id;

  return list.map((place) => ({ ...place, isDefault: place.id === defaultId }));
}

export function addLocation(
  list: SavedLocation[],
  input: LocationInput,
  id: string,
): SavedLocation[] {
  const place: SavedLocation = {
    id,
    name: input.name.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    isDefault: list.length === 0,
  };

  return [...list, place];
}

export function renameLocation(
  list: SavedLocation[],
  id: string,
  name: string,
): SavedLocation[] {
  return list.map((place) =>
    place.id === id ? { ...place, name: name.trim() } : place,
  );
}

export function setDefaultLocation(
  list: SavedLocation[],
  id: string,
): SavedLocation[] {
  if (!list.some((place) => place.id === id)) return list;

  return list.map((place) => ({ ...place, isDefault: place.id === id }));
}

export function removeLocation(
  list: SavedLocation[],
  id: string,
): SavedLocation[] {
  return ensureOneDefault(list.filter((place) => place.id !== id));
}
