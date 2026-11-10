import * as Location from "expo-location";
import { Platform } from "react-native";

import { validateSearchQuery } from "./profileValidation";

export type Place = { name: string; latitude: number; longitude: number };
type Coordinates = Pick<Place, "latitude" | "longitude">;

const PERMISSION_MESSAGE =
  "Allow Orbit to access your location in Settings, then try again.";

async function requestPermission() {
  let granted: boolean;
  try {
    granted = (await Location.requestForegroundPermissionsAsync()).granted;
  } catch {
    throw new Error(
      "Could not request location access. Check Settings and try again.",
    );
  }
  if (!granted) throw new Error(PERMISSION_MESSAGE);
}

export function formatCoordinates({
  latitude,
  longitude,
}: Coordinates): string {
  return `${Math.abs(latitude).toFixed(2)}° ${latitude >= 0 ? "N" : "S"}, ${Math.abs(longitude).toFixed(2)}° ${longitude >= 0 ? "E" : "W"}`;
}

async function placeLabel(coords: Coordinates): Promise<string> {
  try {
    const [address] = await Location.reverseGeocodeAsync(coords);
    const parts = [
      address?.city ?? address?.district,
      address?.region ?? address?.country,
    ].filter((part): part is string => Boolean(part));
    if (parts.length) return [...new Set(parts)].join(", ");
  } catch {
    // Coordinates still work when a device cannot resolve an address.
  }
  return `${coords.latitude.toFixed(2)}°, ${coords.longitude.toFixed(2)}°`;
}

export async function currentPlace(): Promise<Place> {
  await requestPermission();
  let coords: Coordinates;
  try {
    const result = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    coords = {
      latitude: result.coords.latitude,
      longitude: result.coords.longitude,
    };
  } catch {
    throw new Error(
      "Could not find your location. Turn on location services in Settings and try again, or search for a place.",
    );
  }
  return { ...coords, name: await placeLabel(coords) };
}

type GoogleResponse = {
  status?: string;
  results?: {
    formatted_address?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
  }[];
};

async function googlePlaces(query: string, key: string): Promise<Place[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let data: GoogleResponse;
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${encodeURIComponent(key)}`,
      { signal: controller.signal },
    );
    if (!response.ok) throw new Error();
    data = await response.json();
    if (!data || typeof data.status !== "string") throw new Error();
    if (data.status === "OK" && !Array.isArray(data.results)) throw new Error();
  } finally {
    clearTimeout(timer);
  }
  if (data.status === "ZERO_RESULTS") return [];
  if (data.status !== "OK") throw new Error("Google place search is unavailable.");

  const places: Place[] = [];
  for (const result of data.results ?? []) {
    const latitude = result.geometry?.location?.lat;
    const longitude = result.geometry?.location?.lng;
    const name = result.formatted_address?.trim();
    if (
      name &&
      typeof latitude === "number" &&
      typeof longitude === "number" &&
      Number.isFinite(latitude) &&
      Math.abs(latitude) <= 90 &&
      Number.isFinite(longitude) &&
      Math.abs(longitude) <= 180
    ) {
      places.push({ name, latitude, longitude });
    }
    if (places.length === 5) break;
  }
  return places;
}

async function devicePlaces(address: string): Promise<Place[]> {
  if (Platform.OS === "web") {
    throw new Error(
      "Device place search is available on iOS and Android. Use your current location here.",
    );
  }
  if (Platform.OS === "android") await requestPermission();

  try {
    const coordinates = await Location.geocodeAsync(address);
    const places: Place[] = [];
    // Resolve labels in sequence to avoid overwhelming the native geocoder.
    for (const coords of coordinates.slice(0, 5)) {
      places.push({
        latitude: coords.latitude,
        longitude: coords.longitude,
        name: await placeLabel(coords),
      });
    }
    return places;
  } catch {
    throw new Error(
      "Could not search for places. Check your connection and location services, then try again.",
    );
  }
}

export async function searchPlaces(query: string): Promise<{
  places: Place[];
  source: string;
}> {
  const problem = validateSearchQuery(query);
  if (problem) throw new Error(problem);
  const address = query.trim();
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

  if (key) {
    try {
      return {
        places: await googlePlaces(address, key),
        source: "Google Geocoding",
      };
    } catch {
      // A device lookup can still answer when Google is unavailable.
    }
  }
  return { places: await devicePlaces(address), source: "Device geocoding" };
}
