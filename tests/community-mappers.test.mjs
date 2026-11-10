import assert from "node:assert/strict";
import test from "node:test";
import { sightingToPostDraft } from "../src/features/community/model/sightingToPostDraft.ts";
import { formatAgo } from "../src/features/community/model/formatAgo.ts";
import { communityErrorMessage } from "../src/features/community/model/communityErrors.ts";

const sighting = {
  id: "s1",
  objectId: "jupiter",
  objectName: "Jupiter",
  caption: "Bright tonight",
  observedAt: "2026-03-12T20:00:00.000Z",
  photoUri: "file:///photo.jpg",
  location: { cityLabel: "Cairo", latitude: 30.04, longitude: 31.23 },
  visibility: "community",
  syncStatus: "local",
};

test("sightingToPostDraft: copies text, photo, id and location", () => {
  assert.deepEqual(sightingToPostDraft(sighting), {
    caption: "Bright tonight",
    objectName: "Jupiter",
    sightingId: "s1",
    photoUri: "file:///photo.jpg",
    city: "Cairo",
    latitude: 30.04,
    longitude: 31.23,
    observedAt: Date.parse("2026-03-12T20:00:00.000Z"),
  });
});

test("sightingToPostDraft: no location leaves city and coordinates out", () => {
  const draft = sightingToPostDraft({ ...sighting, location: null });
  assert.equal(draft.city, undefined);
  assert.equal(draft.latitude, undefined);
  assert.equal(draft.longitude, undefined);
});

test("sightingToPostDraft: an unreadable date leaves observedAt out", () => {
  assert.equal(sightingToPostDraft({ ...sighting, observedAt: "soon" }).observedAt, undefined);
});

test("formatAgo: buckets from just now to weeks", () => {
  const now = 100 * 24 * 3_600_000;
  const ago = (ms) => formatAgo(now - ms, now);
  assert.equal(ago(30_000), "just now");
  assert.equal(ago(60_000), "1m");
  assert.equal(ago(5 * 60_000), "5m");
  assert.equal(ago(3 * 3_600_000), "3h");
  assert.equal(ago(2 * 86_400_000), "2d");
  assert.equal(ago(21 * 86_400_000), "3w");
});

test("formatAgo: older than four weeks shows a short date; future timestamps read as just now", () => {
  const stamp = new Date(2026, 2, 12, 12).getTime();
  assert.equal(formatAgo(stamp, stamp + 60 * 86_400_000), "12 Mar");
  assert.equal(formatAgo(stamp + 5000, stamp), "just now");
});

test("communityErrorMessage: known Firestore codes get distinct friendly text", () => {
  const codes = [
    "permission-denied",
    "unavailable",
    "deadline-exceeded",
    "resource-exhausted",
    "unauthenticated",
    "not-found",
    "failed-precondition",
  ];
  const messages = codes.map((code) => communityErrorMessage({ code }));
  assert.equal(new Set(messages).size, codes.length);
  assert.match(communityErrorMessage({ code: "firestore/unavailable" }), /connection/);
});

test("communityErrorMessage: unknown codes and non-errors use the generic message", () => {
  const generic = "We could not complete that request. Please try again.";
  for (const value of [{ code: "weird" }, new Error("x"), null, undefined, "boom", 7]) {
    assert.equal(communityErrorMessage(value), generic);
  }
});
