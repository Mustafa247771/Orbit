import { useCallback, useEffect, useMemo, useState } from "react";
import * as Location from "expo-location";
import { SAMPLE_PROFILE } from "@/features/profile/model/Profile";
import { getEphemeris } from "@/core/satellites/EphemerisRepository";
import type { ObserverLocation } from "@/core/orbit/observer";
import { getCloudForecast } from "../model/WeatherService";
import { predictPasses, type PredictedPass } from "../model/PassPredictionService";

export type PassLocation = ObserverLocation & { label: string };
export const INITIAL_LOCATION: PassLocation = { label: "Cairo (sample location)", latitude: 30.04, longitude: 31.24 };

export function usePassesViewModel(noradId: number) {
  const [location, setLocation] = useState<PassLocation>(INITIAL_LOCATION);
  const [gpsLocation, setGpsLocation] = useState<PassLocation | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const savedLocations: PassLocation[] = SAMPLE_PROFILE.locations.map((item) => ({
    latitude: item.latitude, longitude: item.longitude, label: `${item.name} (sample)`,
  }));
  const locations = [gpsLocation, ...savedLocations].filter((item): item is PassLocation => item !== null);
  const nextLocation = () => {
    const index = locations.findIndex((item) => item.label === location.label);
    setLocation(locations[(index + 1) % locations.length]);
  };
  const [passes, setPasses] = useState<PredictedPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [ephemeris, weather] = await Promise.all([getEphemeris(noradId), getCloudForecast(location)]);
      const computed = predictPasses(ephemeris.satellite, location, weather);
      setPasses(computed);
      setStale(ephemeris.stale);
      setError(weather === null ? "Cloud data is unavailable; visibility cannot be confirmed." : null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not calculate upcoming passes.");
      setPasses([]);
    } finally { setLoading(false); }
  }, [location, noradId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) throw new Error("Location access denied. Using a labeled sample city; tap to select another.");
        const result = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!mounted) return;
        const current = { latitude: result.coords.latitude, longitude: result.coords.longitude, label: "Current location (GPS)" };
        setGpsLocation(current);
        setLocation(current);
      } catch (caught) {
        if (mounted) setLocationMessage(caught instanceof Error ? caught.message : "GPS unavailable. Select a sample location.");
      }
    })();
    return () => { mounted = false; };
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { const interval = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(interval); }, []);
  const future = useMemo(() => passes.filter((pass) => pass.endAt > now), [passes, now]);
  return { location, setLocation, nextLocation, locations, locationMessage, passes, future, next: future[0] ?? null, loading, error, stale, now, refresh };
}
