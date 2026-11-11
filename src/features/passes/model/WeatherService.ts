import { readJson, writeJson } from "@/core/storage/jsonFile";
import type { ObserverLocation } from "@/core/orbit/observer";

export type CloudForecast = { times: number[]; cloudCover: number[] };
const TTL = 60 * 60 * 1000;

export async function getCloudForecast(location: ObserverLocation): Promise<CloudForecast | null> {
  const key = `clouds-${location.latitude.toFixed(2)}-${location.longitude.toFixed(2)}.json`;
  let cached: { fetched: number; forecast: CloudForecast } | null = null;
  try { cached = await readJson(key) as typeof cached; } catch { /* no cache */ }
  if (cached && Date.now() - cached.fetched < TTL) return cached.forecast;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&hourly=cloud_cover&forecast_days=8&timezone=GMT`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    let response: Response;
    try { response = await fetch(url, { signal: controller.signal }); }
    finally { clearTimeout(timer); }
    if (!response.ok) throw new Error(`Weather HTTP ${response.status}`);
    const data = await response.json() as { hourly?: { time?: string[]; cloud_cover?: number[] } };
    const times = (data.hourly?.time ?? []).map((t) => Date.parse(`${t}Z`));
    const cloudCover = data.hourly?.cloud_cover ?? [];
    if (!times.length || times.length !== cloudCover.length) throw new Error("Weather response was incomplete.");
    const forecast = { times, cloudCover };
    await writeJson(key, { fetched: Date.now(), forecast }).catch(() => undefined);
    return forecast;
  } catch { return cached?.forecast ?? null; }
}

export function cloudsAt(forecast: CloudForecast | null, at: number): number | null {
  if (!forecast) return null;
  const index = forecast.times.findIndex((t) => t >= at);
  if (index < 0) return null;
  const candidates = [index, Math.max(0, index - 1)];
  const nearest = candidates.reduce((a, b) =>
    Math.abs(forecast.times[a] - at) < Math.abs(forecast.times[b] - at) ? a : b,
  );
  if (Math.abs(forecast.times[nearest] - at) > 90 * 60_000) return null;
  const number = forecast.cloudCover[nearest];
  return Number.isFinite(number) ? number : null;
}
