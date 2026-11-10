import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { getDay, getRange } from "../src/features/apod/model/ApodService.ts";
import { emptyApodCache, freshEntry, mergeEntries, parseCache } from "../src/features/apod/model/apodCache.ts";
import {
  decodeEntities,
  isPlaceholderEntry,
  parseApodPage,
  parseApodPosts,
} from "../src/features/apod/model/apodPageParsing.ts";

const posts = JSON.parse(fs.readFileSync(new URL("./fixtures/apod-posts.json", import.meta.url), "utf8"));
const entries = parseApodPosts(posts);
const byDate = (date) => entries.find((entry) => entry.date === date);

const LOGO = "https://science.nasa.gov/wp-content/themes/nasa-child/assets/images/nasa-logo@2x.png";
const placeholder = (date) => ({
  date,
  title: "NASA Science",
  explanation: "",
  media_type: "image",
  url: LOGO,
  hdurl: LOGO,
});

// Answers the NASA API and the NASA pages from memory, and records what was asked.
function mockFetch({ api, site = posts }) {
  const calls = [];
  globalThis.fetch = async (url) => {
    const text = String(url);
    calls.push(text);
    const reply = text.includes("api.nasa.gov") ? api : { status: 200, body: site };
    return new Response(JSON.stringify(reply.body), { status: reply.status });
  };
  return calls;
}

test("getDay: a working API answer is used as it is", async () => {
  const good = { ...placeholder("2024-06-01"), title: "Real", url: "https://example.com/real.jpg", hdurl: "" };
  const calls = mockFetch({ api: { status: 200, body: good } });
  const day = await getDay("2024-06-01");
  assert.equal(day.title, "Real");
  assert.equal(calls.length, 1);
});

test("getDay: a placeholder from the API is replaced by the NASA page", async () => {
  mockFetch({ api: { status: 200, body: placeholder("2024-06-01") } });
  const day = await getDay("2024-06-01");
  assert.equal(day.title, "Stereo Helene");
});

test("getDay: server errors use the NASA page, and the broken API is skipped afterwards", async () => {
  const calls = mockFetch({ api: { status: 500, body: { msg: "boom" } } });
  const day = await getDay("2026-11-10");
  assert.equal(day.title, "Saturn Behind the Moon");
  const before = calls.length;
  await getDay("2026-10-18");
  assert.equal(calls.slice(before).some((url) => url.includes("api.nasa.gov")), false);
});

test("getDay: a day missing from the site is reported as not published", async () => {
  mockFetch({ api: { status: 500, body: {} }, site: [] });
  await assert.rejects(getDay("2026-11-11"), (error) => error.code === "not-published");
});

test("getRange: days come from the NASA pages, limited to the asked dates", async () => {
  mockFetch({ api: { status: 500, body: {} } });
  const week = await getRange("2026-10-18", "2026-11-10");
  assert.deepEqual(
    week.map((entry) => entry.date),
    ["2026-11-10", "2026-10-28", "2026-10-18"],
  );
  assert.equal(week.some(isPlaceholderEntry), false);
  const narrow = await getRange("2026-10-20", "2026-10-30");
  assert.deepEqual(
    narrow.map((entry) => entry.date),
    ["2026-10-28"],
  );
});

test("parseApodPosts: reads an image day with text, credit and both image sizes", () => {
  const day = byDate("2026-11-10");
  assert.equal(day.kind, "image");
  assert.equal(day.title, "Saturn Behind the Moon");
  assert.match(day.explanation, /^Sometimes Saturn disappears\./);
  assert.doesNotMatch(day.explanation, /Explanation:|<|&#/);
  assert.equal(day.copyright, "Roberto Ortu");
  assert.match(day.imageUrl, /^https:\/\/assets\.science\.nasa\.gov\/.*Moonsaturn6_Ortu_2124\.jpg\?w=2048/);
  assert.equal(day.imageUrl.includes("&amp;"), false);
  assert.equal(
    day.hdUrl,
    "https://assets.science.nasa.gov/content/dam/science/cds/apod/apod/2026/november/Moonsaturn6_Ortu_2124.jpg",
  );
  assert.equal(day.pageUrl, "https://science.nasa.gov/image-article/apod-2026-november-10-saturn-behind-the-moon/");
});

test("parseApodPosts: older days keep their text and get a tidy credit", () => {
  const day = byDate("2024-06-01");
  assert.equal(day.title, "Stereo Helene");
  assert.match(day.explanation, /^Get out your red\/blue glasses/);
  assert.match(day.explanation, /Lagrange point\. A Lagrange point/);
  assert.equal(day.copyright, "Cassini Imaging Team, ISS, JPL, ESA, NASA; Stereo Image by Roberto Beltramini");
  assert.equal(isPlaceholderEntry(day), false);
});

test("parseApodPosts: a YouTube embed becomes a video with a thumbnail and watch link", () => {
  const day = byDate("2026-10-18");
  assert.equal(day.kind, "video");
  assert.equal(day.videoUrl, "https://www.youtube.com/watch?v=DzrCEm1ZBRY");
  assert.equal(day.thumbnailUrl, "https://img.youtube.com/vi/DzrCEm1ZBRY/hqdefault.jpg");
  assert.equal(day.imageUrl, day.thumbnailUrl);
  assert.equal(day.hdUrl, null);
  assert.match(day.copyright, /^NASA, ESA, & The Hubble Heritage Project/);
});

test("parseApodPosts: a hosted video file uses its poster as the thumbnail", () => {
  const day = byDate("2026-10-28");
  assert.equal(day.kind, "video");
  assert.match(day.videoUrl, /occultation\.mp4$/);
  assert.match(day.thumbnailUrl, /occultation\.jpeg/);
  assert.equal(day.copyright, "Michael Wong");
});

test("parseApodPosts: newest first, and unreadable posts are skipped", () => {
  assert.deepEqual(
    entries.map((entry) => entry.date),
    ["2026-11-10", "2026-10-28", "2026-10-18", "2024-06-01"],
  );
  assert.deepEqual(parseApodPosts([null, 4, {}, { date: "2024-06-01T00:00:00", content: { rendered: "" } }]), []);
  assert.deepEqual(parseApodPosts({ not: "a list" }), []);
});

test("parseApodPage: needs a title, and falls back to the given picture", () => {
  assert.equal(parseApodPage("<p>nothing here</p>", "2024-01-02"), null);
  assert.equal(parseApodPage("<h1>Title</h1>", "2024-01-02"), null);
  const day = parseApodPage("<h1>Title</h1>", "2024-01-02", { fallbackImage: "http://example.com/a.jpg" });
  assert.equal(day.imageUrl, "https://example.com/a.jpg");
  assert.equal(day.pageUrl, "https://apod.nasa.gov/apod/ap240102.html");
  assert.equal(parseApodPage("<h1>Title</h1>", "2024-13-45"), null);
});

test("decodeEntities: named and numeric entities, unknown ones stay as written", () => {
  assert.equal(decodeEntities("A &amp; B &#8217;s &#x2019; &bogus; &#0;"), "A & B ’s ’ &bogus; &#0;");
});

test("isPlaceholderEntry: spots the NASA Science logo stand-in", () => {
  const base = { ...byDate("2024-06-01") };
  assert.equal(isPlaceholderEntry(base), false);
  assert.equal(isPlaceholderEntry({ ...base, title: "NASA Science" }), true);
  assert.equal(isPlaceholderEntry({ ...base, imageUrl: "https://x.test/nasa-logo@2x.png" }), true);
  assert.equal(isPlaceholderEntry({ ...base, hdUrl: "https://x.test/nasa-logo@2x.png" }), true);
});

test("cache: placeholders are never stored, served or loaded", () => {
  const real = byDate("2024-06-01");
  const fake = { ...real, date: "2024-06-02", title: "NASA Science" };
  const merged = mergeEntries(emptyApodCache(), [real, fake], 1000);
  assert.deepEqual(Object.keys(merged.entries), ["2024-06-01"]);

  const old = { version: 1, entries: { "2024-06-02": { entry: fake, fetchedAt: 1000 } } };
  assert.equal(freshEntry(old, "2024-06-02", "2026-11-10", 2000), null);
  assert.deepEqual(parseCache(old).entries, {});
});
