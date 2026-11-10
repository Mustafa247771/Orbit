import assert from "node:assert/strict";
import test from "node:test";
import {
  feedEmptyMessage,
  isFeedOfflineError,
  matchesFeedScope,
  mergeFeedPosts,
} from "../src/features/community/viewmodels/feedPolicy.ts";

test("only connection failures mark the feed offline", () => {
  for (const code of [
    "unavailable",
    "deadline-exceeded",
    "firestore/unavailable",
    "firestore/deadline-exceeded",
  ])
    assert.equal(isFeedOfflineError({ code }), true, code);
  for (const code of [
    "permission-denied",
    "failed-precondition",
    "unauthenticated",
    "resource-exhausted",
    "unknown",
  ])
    assert.equal(isFeedOfflineError({ code }), false, code);
  for (const failure of [null, undefined, "unavailable", new Error("offline"), { code: 5 }])
    assert.equal(isFeedOfflineError(failure), false);
});

test("empty feeds explain sign-in, location and following requirements in order", () => {
  for (const scope of ["global", "nearby", "following"])
    assert.equal(
      feedEmptyMessage(null, scope, false, 0),
      "Sign in to see and share community sightings.",
    );
  assert.equal(
    feedEmptyMessage("me", "nearby", false, 2),
    "Add a default location in Profile to find sightings near you.",
  );
  assert.equal(
    feedEmptyMessage("me", "following", true, 0),
    "Follow observers using search to see their sightings here.",
  );
  assert.equal(
    feedEmptyMessage("me", "nearby", true, 0),
    "No sightings within 150 km yet. Share what you saw tonight.",
  );
  assert.equal(
    feedEmptyMessage("me", "following", false, 1),
    "No sightings here yet. Share what you saw tonight.",
  );
  assert.equal(
    feedEmptyMessage("me", "global", false, 0),
    "No sightings here yet. Share what you saw tonight.",
  );
});

const post = (id, patch = {}) => ({
  id,
  author: { uid: "observer-a", name: "A", initials: "A", rank: "Observer" },
  sightingId: null,
  objectName: "Moon",
  caption: "Bright tonight",
  photoUrl: null,
  city: null,
  latitude: 0,
  longitude: 0,
  cell: "0:0",
  createdAt: 1,
  observedAt: null,
  starredBy: [],
  seenBy: [],
  commentCount: 0,
  ...patch,
});

test("nearby requires a default location and coordinates on the post", () => {
  assert.equal(matchesFeedScope(post("a"), "nearby", null, []), false);
  assert.equal(
    matchesFeedScope(post("a", { latitude: null }), "nearby", { latitude: 0, longitude: 0 }, []),
    false,
  );
  assert.equal(
    matchesFeedScope(post("a", { longitude: null }), "nearby", { latitude: 0, longitude: 0 }, []),
    false,
  );
});

test("nearby rejects posts just beyond 150 km, including saved posts from an old location", () => {
  const latitudeAtKm = (km) => ((km / 6371) * 180) / Math.PI;
  const origin = { latitude: 0, longitude: 0 };
  assert.equal(
    matchesFeedScope(post("a", { latitude: latitudeAtKm(149.99) }), "nearby", origin, []),
    true,
  );
  assert.equal(
    matchesFeedScope(post("a", { latitude: latitudeAtKm(150.01) }), "nearby", origin, []),
    false,
  );
  assert.equal(matchesFeedScope(post("a"), "nearby", { latitude: 30, longitude: 31 }, []), false);
});

test("nearby crosses the antimeridian correctly", () => {
  assert.equal(
    matchesFeedScope(
      post("a", { longitude: -179.9 }),
      "nearby",
      { latitude: 0, longitude: 179.9 },
      [],
    ),
    true,
  );
});

test("following only shows followed authors; an empty list stays empty", () => {
  assert.equal(matchesFeedScope(post("a"), "following", null, []), false);
  assert.equal(matchesFeedScope(post("a"), "following", null, ["observer-b"]), false);
  assert.equal(matchesFeedScope(post("a"), "following", null, ["observer-a"]), true);
});

test("global permits posts without location or follows", () => {
  assert.equal(
    matchesFeedScope(post("a", { latitude: null, longitude: null }), "global", null, []),
    true,
  );
});

test("overlapping pages keep local engagement and preserve cursor order without duplicates", () => {
  const starred = post("a", { starredBy: ["me"] });
  const first = [starred, post("b")];
  const next = [post("a"), post("c")];
  const merged = mergeFeedPosts(first, next);
  assert.deepEqual(
    merged.map((item) => item.id),
    ["a", "b", "c"],
  );
  assert.deepEqual(merged[0].starredBy, ["me"]);
  assert.equal(first.length, 2);
  assert.equal(next.length, 2);
});

test("a just-published post survives a delayed first page containing its id", () => {
  const published = post("new", { caption: "Just shared", createdAt: 10 });
  const merged = mergeFeedPosts([published], [post("new"), post("old")]);
  assert.equal(merged[0], published);
  assert.deepEqual(
    merged.map((item) => item.id),
    ["new", "old"],
  );
});
