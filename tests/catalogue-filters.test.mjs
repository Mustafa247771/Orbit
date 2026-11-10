import assert from "node:assert/strict";
import test from "node:test";
import {
  matchesMode,
  objectSearchResults,
  searchCatalogue,
} from "../src/core/satellites/catalogueFilters.ts";

const objects = [
  { id: 25544, name: "ISS (ZARYA)", kind: "payload" },
  { id: 20580, name: "HST", kind: "payload" },
  { id: 48274, name: "STARLINK-2305", kind: "payload" },
];

test("search matches names case-insensitively and trims the query", () => {
  assert.deepEqual(searchCatalogue(objects, "  iss "), [objects[0]]);
});

test("search matches a substring of the NORAD id", () => {
  assert.deepEqual(searchCatalogue(objects, "2058"), [objects[1]]);
});

test("empty or blank query returns no results", () => {
  assert.deepEqual(searchCatalogue(objects, ""), []);
  assert.deepEqual(searchCatalogue(objects, "   "), []);
});

test("search results are capped at 50", () => {
  const many = Array.from({ length: 80 }, (_, i) => ({
    id: 1000 + i,
    name: `STARLINK-${i}`,
  }));
  assert.equal(searchCatalogue(many, "starlink").length, 50);
});

test("matchesMode 'all' accepts every id", () => {
  assert.equal(matchesMode(1, "all", new Set(), new Set()), true);
});

test("matchesMode 'bright' only accepts bright ids", () => {
  const bright = new Set([1]);
  assert.equal(matchesMode(1, "bright", new Set(), bright), true);
  assert.equal(matchesMode(2, "bright", new Set([2]), bright), false);
});

test("matchesMode 'tracked' only accepts tracked ids", () => {
  const tracked = new Set([2]);
  assert.equal(matchesMode(2, "tracked", tracked, new Set()), true);
  assert.equal(matchesMode(1, "tracked", tracked, new Set([1])), false);
});

test("matchesMode with null mode accepts nothing", () => {
  assert.equal(matchesMode(1, null, new Set([1]), new Set([1])), false);
});

test("object search matches names and ids, including missing tracked ids", () => {
  const tracked = new Set([25545, 99999]);
  assert.deepEqual(objectSearchResults(objects, "  iss ", "bright", tracked), [
    { ...objects[0], available: true },
  ]);
  assert.deepEqual(objectSearchResults(objects, " 2554 ", null, tracked), [
    { ...objects[0], available: true },
    { id: 25545, name: "NORAD 25545", kind: "unknown", available: false },
  ]);
  assert.deepEqual(
    objectSearchResults(objects, "norad", "tracked", tracked),
    [],
  );
});

test("blank object search shows available then missing tracked rows only in tracked mode", () => {
  const tracked = new Set([99999, objects[1].id, objects[0].id]);
  assert.deepEqual(objectSearchResults(objects, "   ", "tracked", tracked), [
    { ...objects[0], available: true },
    { ...objects[1], available: true },
    { id: 99999, name: "NORAD 99999", kind: "unknown", available: false },
  ]);
  for (const mode of [null, "all", "bright"]) {
    assert.deepEqual(objectSearchResults(objects, "", mode, tracked), []);
  }
});

test("object search caps combined available and missing tracked rows at 50", () => {
  const many = Array.from({ length: 49 }, (_, i) => ({
    id: 1000 + i,
    name: `OBJECT-${i}`,
    kind: "payload",
  }));
  const tracked = new Set([...many.map((item) => item.id), 1098, 1099]);
  const expected = [
    ...many.map((item) => ({ ...item, available: true })),
    { id: 1098, name: "NORAD 1098", kind: "unknown", available: false },
  ];
  assert.deepEqual(objectSearchResults(many, "10", "all", tracked), expected);
  assert.deepEqual(objectSearchResults(many, "", "tracked", tracked), expected);
  assert.equal(
    objectSearchResults(
      [],
      "",
      "tracked",
      new Set(Array.from({ length: 80 }, (_, i) => 1000 + i)),
    ).length,
    50,
  );
});
