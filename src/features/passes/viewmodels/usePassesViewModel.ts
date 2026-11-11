import { useCallback, useEffect, useMemo, useState } from "react";
import { getEphemeris } from "@/core/satellites/EphemerisRepository";
import type { ObserverLocation } from "@/core/orbit/observer";
import { getCloudForecast } from "../model/WeatherService";
import { predictPasses, type PredictedPass } from "../model/PassPredictionService";

export type PassLocation = ObserverLocation & { label: string };
export const INITIAL_LOCATION: PassLocation = { label: "Cairo (sample location)", latitude: 30.04, longitude: 31.24 };

export function usePassesViewModel(noradId: number) {
  const [location, setLocation] = useState<PassLocation>(INITIAL_LOCATION);
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

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { const interval = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(interval); }, []);
  const future = useMemo(() => passes.filter((pass) => pass.endAt > now), [passes, now]);
  return { location, setLocation, passes, future, next: future[0] ?? null, loading, error, stale, now, refresh };
}
