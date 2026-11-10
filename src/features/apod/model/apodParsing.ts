import { ApodError, isApodError } from "./Apod.ts";
import type { ApodEntry, ApodKind } from "./Apod.ts";
import { isValidIsoDate } from "./apodDates.ts";

type Raw = Record<string, unknown>;

const isRecord = (value: unknown): value is Raw =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

// Old entries still point at http://; every host involved serves https.
const toHttps = (url: string): string => url.replace(/^http:\/\//i, "https://");

function cleanUrl(value: unknown): string | null {
  const url = text(value);
  return url.length > 0 ? toHttps(url) : null;
}

function cleanCopyright(value: unknown): string | null {
  const cleaned = text(value).replace(/\s+/g, " ");
  return cleaned.length > 0 ? cleaned : null;
}

export function apodPageUrl(date: string): string {
  return `https://apod.nasa.gov/apod/ap${date.slice(2, 4)}${date.slice(5, 7)}${date.slice(8, 10)}.html`;
}

function youtubeId(url: string): string | null {
  const embed = /^https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([\w-]{6,})/i.exec(url);
  if (embed) return embed[1];
  const short = /^https?:\/\/youtu\.be\/([\w-]{6,})/i.exec(url);
  return short ? short[1] : null;
}

function vimeoId(url: string): string | null {
  const match = /^https?:\/\/player\.vimeo\.com\/video\/(\d+)/i.exec(url);
  return match ? match[1] : null;
}

// Watch link and thumbnail for a video page: YouTube and Vimeo get their canonical links.
export function describeVideo(
  url: string,
  thumb: string | null,
): { videoUrl: string; thumbnailUrl: string | null } {
  const yt = youtubeId(url);
  const vimeo = vimeoId(url);
  const videoUrl = yt
    ? `https://www.youtube.com/watch?v=${yt}`
    : vimeo
      ? `https://vimeo.com/${vimeo}`
      : url;
  const thumbnailUrl = thumb ?? (yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : null);
  return { videoUrl, thumbnailUrl };
}

export function parseApodEntry(raw: unknown): ApodEntry | null {
  if (!isRecord(raw)) return null;
  const date = text(raw.date);
  const title = text(raw.title);
  if (!isValidIsoDate(date) || title.length === 0) return null;

  const kind: ApodKind =
    raw.media_type === "image" || raw.media_type === "video" ? raw.media_type : "other";
  const url = cleanUrl(raw.url);
  const thumb = cleanUrl(raw.thumbnail_url);
  const base = {
    date,
    title,
    explanation: text(raw.explanation),
    kind,
    copyright: cleanCopyright(raw.copyright),
    pageUrl: apodPageUrl(date),
  };

  if (kind === "image") {
    if (!url) return null;
    return { ...base, imageUrl: url, hdUrl: cleanUrl(raw.hdurl), videoUrl: null, thumbnailUrl: null };
  }

  if (kind === "video") {
    if (!url) return null;
    const video = describeVideo(url, thumb);
    return { ...base, imageUrl: video.thumbnailUrl, hdUrl: null, ...video };
  }

  return { ...base, imageUrl: thumb, hdUrl: null, videoUrl: null, thumbnailUrl: thumb };
}

// Tolerant: bad items are skipped. A single object is treated as a one-item list.
export function parseApodList(raw: unknown): ApodEntry[] {
  const items = Array.isArray(raw) ? raw : [raw];
  const entries: ApodEntry[] = [];
  for (const item of items) {
    const entry = parseApodEntry(item);
    if (entry) entries.push(entry);
  }
  return entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function apodErrorFromResponse(status: number, body: unknown): ApodError {
  let gatewayCode = "";
  let message = "";
  if (isRecord(body)) {
    if (isRecord(body.error)) {
      gatewayCode = text(body.error.code);
      message = text(body.error.message);
    } else {
      message = text(body.msg) || text(body.message);
    }
  }

  if (gatewayCode === "OVER_RATE_LIMIT" || status === 429) {
    return new ApodError("rate-limit", message || "NASA rate limit reached.");
  }
  if (gatewayCode === "API_KEY_INVALID" || gatewayCode === "API_KEY_MISSING" || status === 403) {
    return new ApodError("invalid-key", message || "NASA rejected the API key.");
  }
  if (status === 400 && /date/i.test(message)) {
    return new ApodError("out-of-range", message);
  }
  if (status === 404) {
    return new ApodError("not-published", message || "No picture for that date.");
  }
  if (status >= 500) {
    return new ApodError("server", message || "NASA server error.");
  }
  return new ApodError("bad-response", message || `Unexpected response (${status}).`);
}

export function apodErrorMessage(error: unknown): string {
  if (!isApodError(error)) return "Something went wrong loading the picture. Please try again.";
  switch (error.code) {
    case "rate-limit":
      return "NASA's picture service is busy. Please try again in a little while.";
    case "invalid-key":
      return "NASA did not accept the API key. Check the key and try again.";
    case "not-published":
      return "NASA has not published a picture for that day yet. Try an earlier date.";
    case "out-of-range":
      return "That date is outside the archive. Pick a day from 1995-06-16 up to today.";
    case "network":
      return "Could not reach NASA. Check your connection and try again.";
    case "timeout":
      return "NASA took too long to answer. Please try again.";
    case "server":
      return "NASA is having trouble right now. Please try again in a little while.";
    case "bad-response":
      return "NASA sent something unexpected. Please try again.";
  }
}
