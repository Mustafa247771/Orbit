import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_CACHED_ENTRIES,
  anyEntry,
  emptyApodCache,
  freshEntry,
  mergeEntries,
  parseCache,
} from "../src/features/apod/model/apodCache.ts";
import { addDays } from "../src/features/apod/model/apodDates.ts";

const HOUR = 3_600_000;

const entry = (date, title = `Picture ${date}`) => ({
  date,
  title,
  explanation: "Text",
  kind: "image",
  imageUrl: `https://example.com/${date}.jpg`,
  hdUrl: null,
  videoUrl: null,
  thumbnailUrl: null,
  copyright: null,
  pageUrl: "https://apod.nasa.gov/apod/ap240101.html",
});

test("mergeEntries: adds entries with fetch time and replaces same-day entries", () => {
  const first = mergeEntries(emptyApodCache(), [entry("2024-05-01", "Old")], 1000);
  assert.equal(first.version, 1);
  assert.equal(first.entries["2024-05-01"].fetchedAt, 1000);
  const second = mergeEntries(first, [entry("2024-05-01", "New"), entry("2024-05-02")], 2000);
  assert.equal(second.entries["2024-05-01"].entry.title, "New");
  assert.equal(second.entries["2024-05-01"].fetchedAt, 2000);
  assert.equal(Object.keys(second.entries).length, 2);
  assert.equal(Object.keys(first.entries).length, 1, "input cache is not mutated");
});

test("mergeEntries: caps at 60 and evicts the oldest fetch, not the oldest date", () => {
  const dates = Array.from({ length: 70 }, (_, i) => addDays("2024-01-01", i));
  // Fetch times rise with the date, so the first ten dates were fetched longest ago.
  let cache = emptyApodCache();
  dates.forEach((d, i) => {
    cache = mergeEntries(cache, [entry(d)], i + 1);
  });
  const kept = Object.keys(cache.entries).sort();
  assert.equal(kept.length, MAX_CACHED_ENTRIES);
  assert.equal(kept[0], dates[10]);
  assert.equal(kept[kept.length - 1], dates[69]);
});

test("mergeEntries: an old day browsed just now is kept and the stalest fetch goes", () => {
  const dates = Array.from({ length: MAX_CACHED_ENTRIES }, (_, i) => addDays("2024-01-01", i));
  let cache = emptyApodCache();
  dates.forEach((d, i) => {
    cache = mergeEntries(cache, [entry(d)], 100 + i);
  });
  const again = mergeEntries(cache, [entry("2020-01-01")], 5000);
  assert.ok(anyEntry(again, "2020-01-01"), "the just-merged old day is cached");
  assert.equal(anyEntry(again, dates[0]), null, "the oldest fetchedAt is evicted");
  assert.ok(anyEntry(again, dates[1]));
  assert.equal(Object.keys(again.entries).length, MAX_CACHED_ENTRIES);
});

test("mergeEntries: just-merged entries survive even with an older clock", () => {
  const dates = Array.from({ length: MAX_CACHED_ENTRIES }, (_, i) => addDays("2024-01-01", i));
  const cache = mergeEntries(emptyApodCache(), dates.map((d) => entry(d)), 9000);
  const again = mergeEntries(cache, [entry("2020-01-01")], 1);
  assert.ok(anyEntry(again, "2020-01-01"));
  assert.equal(Object.keys(again.entries).length, MAX_CACHED_ENTRIES);
});

test("freshEntry: past days never expire", () => {
  const cache = mergeEntries(emptyApodCache(), [entry("2024-05-01")], 0);
  const farFuture = 1000 * HOUR;
  assert.equal(freshEntry(cache, "2024-05-01", "2024-05-02", farFuture)?.date, "2024-05-01");
});

test("freshEntry: today is fresh for under an hour", () => {
  const cache = mergeEntries(emptyApodCache(), [entry("2024-05-02")], 10_000);
  assert.ok(freshEntry(cache, "2024-05-02", "2024-05-02", 10_000 + HOUR - 1));
  assert.equal(freshEntry(cache, "2024-05-02", "2024-05-02", 10_000 + HOUR), null);
  assert.equal(freshEntry(cache, "2024-05-02", "2024-05-02", 5_000), null, "clock went backwards");
});

test("freshEntry / anyEntry: missing dates and stale fallback", () => {
  const cache = mergeEntries(emptyApodCache(), [entry("2024-05-02")], 0);
  assert.equal(freshEntry(cache, "2024-05-03", "2024-05-03", 0), null);
  assert.equal(freshEntry(cache, "2024-05-02", "2024-05-02", 5 * HOUR), null);
  assert.equal(anyEntry(cache, "2024-05-02")?.title, "Picture 2024-05-02");
  assert.equal(anyEntry(cache, "2024-05-03"), null);
});

test("parseCache: round-trips a valid cache", () => {
  const cache = mergeEntries(emptyApodCache(), [entry("2024-05-01"), entry("2024-05-02")], 7);
  assert.deepEqual(parseCache(JSON.parse(JSON.stringify(cache))), cache);
});

test("parseCache: bad input becomes an empty cache", () => {
  for (const raw of [null, undefined, 5, "x", [], {}, { version: 2, entries: {} }, { version: 1 }]) {
    assert.deepEqual(parseCache(raw), emptyApodCache());
  }
});

test("parseCache: drops invalid items and mismatched keys, keeps good ones", () => {
  const good = entry("2024-05-01");
  const raw = {
    version: 1,
    entries: {
      "2024-05-01": { entry: good, fetchedAt: 5 },
      "2024-05-02": { entry: entry("2024-05-03"), fetchedAt: 5 },
      "2024-05-04": { entry: { ...entry("2024-05-04"), kind: "gif" }, fetchedAt: 5 },
      "2024-05-05": { entry: entry("2024-05-05"), fetchedAt: "now" },
      "2024-05-06": "junk",
      "2024-05-07": { entry: { ...entry("2024-05-07"), title: "" }, fetchedAt: 5 },
    },
  };
  const parsed = parseCache(raw);
  assert.deepEqual(Object.keys(parsed.entries), ["2024-05-01"]);
  assert.deepEqual(parsed.entries["2024-05-01"].entry, good);
});

test("parseCache: tolerates missing optional fields", () => {
  const sparse = { date: "2024-05-01", title: "T", kind: "video", pageUrl: "https://x.test/a" };
  const parsed = parseCache({ version: 1, entries: { "2024-05-01": { entry: sparse, fetchedAt: 1 } } });
  const stored = parsed.entries["2024-05-01"].entry;
  assert.equal(stored.explanation, "");
  assert.equal(stored.imageUrl, null);
  assert.equal(stored.copyright, null);
});
