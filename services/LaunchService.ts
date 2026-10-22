import { File, Paths } from "expo-file-system";

import type { Launch } from "@/data/Launch";

const API_URL = "https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=12&mode=normal&format=json";
const CACHE_FILE = new File(Paths.cache, "upcoming-launches.json");
const CACHE_TTL_MS = 15 * 60 * 1000;

type ApiLaunch = {
  id: string;
  name: string;
  net: string;
  window_start: string;
  window_end: string;
  status?: { name?: string; abbrev?: string };
  image?: { image_url?: string; credit?: string | null } | null;
  launch_service_provider?: { name?: string } | null;
  rocket?: { configuration?: { full_name?: string; name?: string } } | null;
  mission?: { name?: string; type?: string; description?: string } | null;
  pad?: { name?: string; location?: { name?: string } } | null;
  webcast_live?: boolean;
};

type CachePayload = { cachedAt: number; launches: Launch[] };

function mapLaunch(item: ApiLaunch): Launch {
  return {
    description: item.mission?.description ?? "Mission details will be confirmed closer to launch.",
    id: item.id,
    imageCredit: item.image?.credit ?? null,
    imageUrl: item.image?.image_url ?? null,
    location: item.pad?.location?.name ?? "Location to be confirmed",
    mission: item.mission?.name ?? item.name.split("|").at(-1)?.trim() ?? item.name,
    missionType: item.mission?.type ?? "Orbital mission",
    name: item.name,
    net: item.net,
    pad: item.pad?.name ?? "Launch pad to be confirmed",
    provider: item.launch_service_provider?.name ?? "Launch provider to be confirmed",
    rocket: item.rocket?.configuration?.full_name ?? item.rocket?.configuration?.name ?? item.name.split("|")[0].trim(),
    status: item.status?.name ?? "To Be Confirmed",
    statusAbbreviation: item.status?.abbrev ?? "TBC",
    webcastLive: item.webcast_live ?? false,
    windowEnd: item.window_end,
    windowStart: item.window_start,
  };
}

async function readCache() {
  if (!CACHE_FILE.exists) return null;
  try {
    return JSON.parse(await CACHE_FILE.text()) as CachePayload;
  } catch {
    return null;
  }
}

function writeCache(payload: CachePayload) {
  if (!CACHE_FILE.exists) CACHE_FILE.create({ intermediates: true });
  CACHE_FILE.write(JSON.stringify(payload));
}

export class LaunchService {
  async getUpcoming(forceRefresh = false): Promise<{ launches: Launch[]; source: "live" | "cache" }> {
    const cache = await readCache();
    if (!forceRefresh && cache && Date.now() - cache.cachedAt < CACHE_TTL_MS) {
      return { launches: cache.launches, source: "cache" };
    }

    try {
      const response = await fetch(API_URL, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Launch service returned ${response.status}`);
      const payload = (await response.json()) as { results?: ApiLaunch[] };
      const launches = (payload.results ?? [])
        .map(mapLaunch)
        .filter((launch) => new Date(launch.net).getTime() > Date.now() - 60 * 60 * 1000)
        .sort((a, b) => new Date(a.net).getTime() - new Date(b.net).getTime());
      if (!launches.length) throw new Error("No upcoming launches were returned.");
      writeCache({ cachedAt: Date.now(), launches });
      return { launches, source: "live" };
    } catch (error) {
      if (cache?.launches.length) return { launches: cache.launches, source: "cache" };
      throw error;
    }
  }
}

export const launchService = new LaunchService();
