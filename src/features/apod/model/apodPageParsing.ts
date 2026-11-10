import type { ApodEntry } from "./Apod.ts";
import { isValidIsoDate } from "./apodDates.ts";
import { apodPageUrl, describeVideo } from "./apodParsing.ts";

// NASA moved every APOD page to science.nasa.gov (apod.nasa.gov only redirects there).
// Each day is a post whose page has a "media detail hero": the picture or video, the
// <h1> title, the explanation paragraph and a table with the credit.

const SITE = "https://science.nasa.gov";
const MAX_CREDIT = 160;

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeEntities(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const hex = code[1].toLowerCase() === "x";
      const n = hex ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

// Tags removed, entities decoded, whitespace collapsed.
function plain(html: string): string {
  const text = html
    .replace(/<br\s*\/?>|<\/(?:p|div|li|tr|td|th)>/gi, " ")
    .replace(/<[^>]*>/g, "");
  return decodeEntities(text).replace(/\s+/g, " ").replace(/ ([,.;:!?])/g, "$1").trim();
}

function attribute(tag: string, name: string): string | null {
  const match = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i").exec(tag);
  const value = match ? (match[1] ?? match[2] ?? "").trim() : "";
  return value.length > 0 ? value : null;
}

function cleanUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const url = decodeEntities(value.trim());
  if (url.length === 0) return null;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${SITE}${url}`;
  return url.replace(/^http:\/\//i, "https://");
}

function cleanCredit(html: string): string | null {
  const text = plain(html).replace(/^(?:image\s+)?credit(?:\s*&\s*copyright)?\s*:\s*/i, "");
  if (text.length === 0) return null;
  return text.length > MAX_CREDIT ? `${text.slice(0, MAX_CREDIT - 1).trimEnd()}…` : text;
}

export type PageExtras = {
  /** Used when the page has no <h1>. */
  title?: string;
  /** The page's own address; the old apYYMMDD.html address is used when missing. */
  link?: string;
  /** Used when the page shows no picture of its own. */
  fallbackImage?: string;
};

/** Reads one APOD day from the HTML of its science.nasa.gov page (or just its hero). */
export function parseApodPage(html: string, date: string, extras: PageExtras = {}): ApodEntry | null {
  if (!isValidIsoDate(date)) return null;
  const start = html.indexOf("media-detail-hero");
  const hero = start >= 0 ? html.slice(start) : html;

  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(hero);
  const title = (h1 ? plain(h1[1]) : "") || extras.title?.trim() || "";
  if (title.length === 0) return null;
  const media = h1 ? hero.slice(0, h1.index) : hero;

  const description = /media-detail-hero__description[^>]*>([\s\S]*?)<\/p>/i.exec(hero);
  const explanation = description ? plain(description[1]).replace(/^explanation:\s*/i, "") : "";

  let copyright: string | null = null;
  for (const row of hero.matchAll(/<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/gi)) {
    if (/credit/i.test(plain(row[1]))) {
      copyright = cleanCredit(row[2]);
      break;
    }
  }

  const base = {
    date,
    title,
    explanation,
    copyright,
    pageUrl: cleanUrl(extras.link) ?? apodPageUrl(date),
  };
  const fallback = cleanUrl(extras.fallbackImage);

  const iframe = /<iframe\b[^>]*>/i.exec(media);
  const embedUrl = iframe ? cleanUrl(attribute(iframe[0], "src")) : null;
  if (embedUrl) {
    const video = describeVideo(embedUrl, null);
    const thumbnailUrl = video.thumbnailUrl ?? fallback;
    return { ...base, kind: "video", imageUrl: thumbnailUrl, hdUrl: null, ...video, thumbnailUrl };
  }

  const videoTag = /<video\b[^>]*>[\s\S]*?<\/video>/i.exec(media);
  if (videoTag) {
    const source = /<source\b[^>]*>/i.exec(videoTag[0]);
    const file = cleanUrl(source ? attribute(source[0], "src") : null);
    const thumbnailUrl = cleanUrl(attribute(videoTag[0], "poster")) ?? fallback;
    if (file) {
      return { ...base, kind: "video", imageUrl: thumbnailUrl, hdUrl: null, videoUrl: file, thumbnailUrl };
    }
  }

  const img = /<img\b[^>]*>/i.exec(media);
  const imageUrl = (img ? cleanUrl(attribute(img[0], "src")) : null) ?? fallback;
  if (!imageUrl) return null;
  const link = /<a\b[^>]*>\s*<img\b/i.exec(media);
  const hdUrl = link ? cleanUrl(attribute(link[0], "href")) : null;
  return { ...base, kind: "image", imageUrl, hdUrl, videoUrl: null, thumbnailUrl: null };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const rendered = (value: unknown): string =>
  isRecord(value) && typeof value.rendered === "string" ? value.rendered : "";

/** Reads one post from NASA's WordPress API (`/wp-json/wp/v2/image-article`). */
export function parseApodPost(raw: unknown): ApodEntry | null {
  if (!isRecord(raw) || typeof raw.date !== "string") return null;
  const html = rendered(raw.content);
  if (html.length === 0) return null;
  const featured = isRecord(raw.featured_image) ? raw.featured_image : {};
  // "APOD: 2024 June 1 – Stereo Helene" -> "Stereo Helene"
  const title = decodeEntities(rendered(raw.title)).replace(
    /^APOD:\s*\d{4}\s+[a-z]+\s+\d{1,2}\s*[–-]\s*/i,
    "",
  );
  return parseApodPage(html, raw.date.slice(0, 10), {
    title,
    link: typeof raw.link === "string" ? raw.link : undefined,
    fallbackImage: typeof featured.file === "string" ? featured.file : undefined,
  });
}

/** Tolerant: bad posts are skipped. Newest day first. */
export function parseApodPosts(raw: unknown): ApodEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: ApodEntry[] = [];
  for (const item of raw) {
    const entry = parseApodPost(item);
    if (entry) entries.push(entry);
  }
  return entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** The API's stand-in for every day while it is broken: the NASA Science logo. */
export function isPlaceholderEntry(entry: ApodEntry): boolean {
  const urls = [entry.imageUrl, entry.hdUrl].map((url) => url ?? "");
  return entry.title === "NASA Science" || urls.some((url) => url.includes("nasa-logo"));
}
