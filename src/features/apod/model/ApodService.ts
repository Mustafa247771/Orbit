import { ApodError, isApodError } from "./Apod.ts";
import type { ApodEntry } from "./Apod.ts";
import { addDays } from "./apodDates.ts";
import { isPlaceholderEntry, parseApodPosts } from "./apodPageParsing.ts";
import { apodErrorFromResponse, parseApodEntry, parseApodList } from "./apodParsing.ts";

const BASE_URL = "https://api.nasa.gov/planetary/apod";
// NASA's own APOD pages: one WordPress post per day, with the picture, text and credit.
const SITE_URL = "https://science.nasa.gov/wp-json/wp/v2/image-article";
const API_PAUSE_MS = 600_000;
const TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 800;
const DEMO_KEY = "DEMO_KEY";

function apiKey(): string {
  return process.env.EXPO_PUBLIC_NASA_API_KEY?.trim() || DEMO_KEY;
}

// True when no personal NASA key is configured (DEMO_KEY has a tight rate limit).
export function usingDemoKey(): boolean {
  return apiKey() === DEMO_KEY;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function buildUrl(params: Record<string, string>): string {
  const query = new URLSearchParams({ api_key: apiKey(), thumbs: "true", ...params });
  return `${BASE_URL}?${query.toString()}`;
}

async function fetchOnce(url: string): Promise<unknown> {
  // The timer stays armed until the body is read, so a stalled body cannot hang.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let status: number;
    let ok: boolean;
    let bodyText: string;
    try {
      const response = await fetch(url, { signal: controller.signal });
      status = response.status;
      ok = response.ok;
      bodyText = await response.text();
    } catch {
      throw controller.signal.aborted
        ? new ApodError("timeout", "NASA took too long to answer.")
        : new ApodError("network", "Could not reach NASA.");
    }

    let body: unknown = null;
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = null;
    }
    if (!ok) throw apodErrorFromResponse(status, body);
    if (body === null) throw new ApodError("bad-response", "NASA sent something unexpected.");
    return body;
  } finally {
    clearTimeout(timer);
  }
}

// One retry after a short pause for dropped connections. Server errors are not retried:
// the NASA pages below answer instead.
async function fetchJson(url: string): Promise<unknown> {
  try {
    return await fetchOnce(url);
  } catch (error) {
    if (!(isApodError(error) && error.code === "network")) throw error;
    await wait(RETRY_DELAY_MS);
    return fetchOnce(url);
  }
}

// The API is currently broken upstream (500s and a logo for every day), so after one
// failure it is skipped for a while and the NASA pages are used directly.
let apiPausedUntil = 0;

const apiPaused = () => Date.now() < apiPausedUntil;

// The NASA pages cannot help when the phone has no connection.
const canUsePages = (error: unknown) =>
  !isApodError(error) || (error.code !== "network" && error.code !== "timeout");

function noteApiFailure(error: unknown) {
  const broken = isApodError(error) && (error.code === "server" || error.code === "bad-response");
  if (broken) apiPausedUntil = Date.now() + API_PAUSE_MS;
}

function siteUrl(start: string, end: string): string {
  const query = new URLSearchParams({
    after: `${addDays(start, -1)}T23:59:59`,
    before: `${addDays(end, 1)}T00:00:00`,
    per_page: "100",
    orderby: "date",
    order: "desc",
    _fields: "date,link,title,content,featured_image",
  });
  return `${SITE_URL}?${query.toString()}`;
}

async function getRangeFromSite(start: string, end: string): Promise<ApodEntry[]> {
  const entries = parseApodPosts(await fetchJson(siteUrl(start, end)));
  return entries.filter((entry) => entry.date >= start && entry.date <= end);
}

export async function getDay(date: string): Promise<ApodEntry> {
  let failure: unknown = null;
  if (!apiPaused()) {
    try {
      const entry = parseApodEntry(await fetchJson(buildUrl({ date })));
      if (entry && !isPlaceholderEntry(entry)) return entry;
      apiPausedUntil = Date.now() + API_PAUSE_MS;
      failure = new ApodError("bad-response", "NASA sent something unexpected.");
    } catch (error) {
      if (!canUsePages(error)) throw error;
      noteApiFailure(error);
      failure = error;
    }
  }

  const entry = (await getRangeFromSite(date, date).catch((error: unknown) => {
    if (isApodError(error) && error.code === "not-published") throw error;
    throw failure ?? error;
  })).find((item) => item.date === date);
  if (!entry) throw new ApodError("not-published", "No picture for that date.");
  return entry;
}

export async function getRange(start: string, end: string): Promise<ApodEntry[]> {
  let good: ApodEntry[] = [];
  let failure: unknown = null;
  if (!apiPaused()) {
    try {
      const raw = await fetchJson(buildUrl({ start_date: start, end_date: end }));
      const entries = parseApodList(raw);
      if (entries.length === 0 && Array.isArray(raw) && raw.length > 0) {
        throw new ApodError("bad-response", "NASA sent something unexpected.");
      }
      good = entries.filter((entry) => !isPlaceholderEntry(entry));
      if (good.length === entries.length) return entries;
      apiPausedUntil = Date.now() + API_PAUSE_MS;
    } catch (error) {
      if (!canUsePages(error)) throw error;
      noteApiFailure(error);
      failure = error;
    }
  }

  try {
    const have = new Set(good.map((entry) => entry.date));
    const fromSite = await getRangeFromSite(start, end);
    const merged = [...good, ...fromSite.filter((entry) => !have.has(entry.date))];
    return merged.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  } catch (error) {
    if (good.length > 0) return good;
    throw failure ?? error;
  }
}
