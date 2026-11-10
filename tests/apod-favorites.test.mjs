import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_FAVORITES,
  isFavorite,
  parseFavorites,
  toFavorite,
  toggleFavorite,
} from "../src/features/apod/model/apodFavorites.ts";
import { addDays } from "../src/features/apod/model/apodDates.ts";

const entry = (date, over = {}) => ({
  date,
  title: `Picture ${date}`,
  explanation: "Long text that is not saved",
  kind: "image",
  imageUrl: `https://example.com/${date}.jpg`,
  hdUrl: `https://example.com/${date}-hd.jpg`,
  videoUrl: null,
  thumbnailUrl: null,
  copyright: "Someone",
  pageUrl: "https://apod.nasa.gov/apod/ap240101.html",
  ...over,
});

const saved = (date, savedAt, over = {}) => ({ ...toFavorite(entry(date), savedAt), ...over });

test("toFavorite: copies only the small fields", () => {
  const favorite = toFavorite(
    entry("2024-05-01", { kind: "video", thumbnailUrl: "https://example.com/t.jpg", imageUrl: null }),
    1234,
  );
  assert.deepEqual(favorite, {
    date: "2024-05-01",
    title: "Picture 2024-05-01",
    kind: "video",
    thumbnailUrl: "https://example.com/t.jpg",
    imageUrl: null,
    savedAt: 1234,
  });
});

test("toggleFavorite: adds, then removes the same day", () => {
  const added = toggleFavorite([], entry("2024-05-01"), 10);
  assert.equal(added.length, 1);
  assert.ok(isFavorite(added, "2024-05-01"));
  assert.equal(isFavorite(added, "2024-05-02"), false);
  const removed = toggleFavorite(added, entry("2024-05-01"), 20);
  assert.deepEqual(removed, []);
  assert.equal(added.length, 1, "input list is not mutated");
});

test("toggleFavorite: newest saved comes first", () => {
  let list = toggleFavorite([], entry("2024-05-01"), 10);
  list = toggleFavorite(list, entry("2023-01-01"), 20);
  list = toggleFavorite(list, entry("2025-01-01"), 30);
  assert.deepEqual(list.map((f) => f.date), ["2025-01-01", "2023-01-01", "2024-05-01"]);
  list = toggleFavorite(list, entry("2023-01-01"), 40);
  assert.deepEqual(list.map((f) => f.date), ["2025-01-01", "2024-05-01"]);
});

test("toggleFavorite: caps at 200 and drops the oldest saved", () => {
  let list = [];
  for (let i = 0; i < MAX_FAVORITES; i++) {
    list = toggleFavorite(list, entry(addDays("2020-01-01", i)), i + 1);
  }
  assert.equal(list.length, MAX_FAVORITES);
  list = toggleFavorite(list, entry("2010-01-01"), 1000);
  assert.equal(list.length, MAX_FAVORITES);
  assert.equal(list[0].date, "2010-01-01");
  assert.equal(isFavorite(list, "2020-01-01"), false, "oldest saved was dropped");
});

test("parseFavorites: round-trips and orders newest saved first", () => {
  const list = [saved("2024-05-01", 5), saved("2024-05-02", 9)];
  const parsed = parseFavorites(JSON.parse(JSON.stringify(list)));
  assert.deepEqual(parsed.map((f) => f.date), ["2024-05-02", "2024-05-01"]);
});

test("parseFavorites: non-arrays become an empty list", () => {
  for (const raw of [null, undefined, 3, "x", {}, { favorites: [] }]) {
    assert.deepEqual(parseFavorites(raw), []);
  }
});

test("parseFavorites: drops invalid items", () => {
  const raw = [
    saved("2024-05-01", 5),
    null,
    "junk",
    saved("2024-13-45", 5),
    saved("2024-05-02", 5, { title: "" }),
    saved("2024-05-03", 5, { kind: "gif" }),
    saved("2024-05-04", "later"),
    saved("2024-05-05", Number.NaN),
  ];
  assert.deepEqual(parseFavorites(raw).map((f) => f.date), ["2024-05-01"]);
});

test("parseFavorites: cleans bad urls to null", () => {
  const [item] = parseFavorites([saved("2024-05-01", 5, { thumbnailUrl: 7, imageUrl: "" })]);
  assert.equal(item.thumbnailUrl, null);
  assert.equal(item.imageUrl, null);
});

test("parseFavorites: dedupes by date keeping the latest save", () => {
  const parsed = parseFavorites([
    saved("2024-05-01", 5, { title: "Early" }),
    saved("2024-05-01", 50, { title: "Late" }),
    saved("2024-05-01", 20, { title: "Middle" }),
  ]);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].title, "Late");
});

test("parseFavorites: caps at 200 keeping the newest saved", () => {
  const raw = Array.from({ length: 230 }, (_, i) => saved(addDays("2020-01-01", i), i + 1));
  const parsed = parseFavorites(raw);
  assert.equal(parsed.length, MAX_FAVORITES);
  assert.equal(parsed[0].savedAt, 230);
  assert.equal(parsed[parsed.length - 1].savedAt, 31);
});
