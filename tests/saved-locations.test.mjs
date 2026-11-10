import assert from "node:assert/strict";
import test from "node:test";
import {
  addLocation,
  ensureOneDefault,
  removeLocation,
  renameLocation,
  setDefaultLocation,
} from "../src/features/profile/model/savedLocations.ts";

const place = (id, isDefault = false) => ({
  id,
  name: `Place ${id}`,
  latitude: 10,
  longitude: 20,
  isDefault,
});
const defaults = (list) => list.filter((p) => p.isDefault).map((p) => p.id);

test("the first added location becomes the default and its name is trimmed", () => {
  const list = addLocation([], { name: "  Home ", latitude: 1, longitude: 2 }, "a");
  assert.equal(list.length, 1);
  assert.equal(list[0].name, "Home");
  assert.equal(list[0].isDefault, true);
});

test("later added locations are not default", () => {
  const list = addLocation([place("a", true)], { name: "Work", latitude: 1, longitude: 2 }, "b");
  assert.deepEqual(defaults(list), ["a"]);
  assert.equal(list.length, 2);
});

test("setDefaultLocation leaves exactly one default", () => {
  const list = setDefaultLocation([place("a", true), place("b"), place("c")], "c");
  assert.deepEqual(defaults(list), ["c"]);
});

test("setDefaultLocation with an unknown id changes nothing", () => {
  const input = [place("a", true), place("b")];
  assert.deepEqual(setDefaultLocation(input, "zzz"), input);
});

test("removing the default promotes the first remaining location", () => {
  const list = removeLocation([place("a", true), place("b"), place("c")], "a");
  assert.deepEqual(list.map((p) => p.id), ["b", "c"]);
  assert.deepEqual(defaults(list), ["b"]);
});

test("removing a non-default keeps the current default", () => {
  const list = removeLocation([place("a"), place("b", true)], "a");
  assert.deepEqual(defaults(list), ["b"]);
});

test("removing the last location leaves an empty list", () => {
  assert.deepEqual(removeLocation([place("a", true)], "a"), []);
});

test("ensureOneDefault picks the first when none is set and the first flagged when several are", () => {
  assert.deepEqual(defaults(ensureOneDefault([place("a"), place("b")])), ["a"]);
  assert.deepEqual(
    defaults(ensureOneDefault([place("a"), place("b", true), place("c", true)])),
    ["b"],
  );
  assert.deepEqual(ensureOneDefault([]), []);
});

test("renameLocation changes only the targeted entry and trims the name", () => {
  const input = [place("a", true), place("b")];
  const list = renameLocation(input, "b", "  Cabin ");
  assert.equal(list[1].name, "Cabin");
  assert.deepEqual(list[0], input[0]);
  assert.equal(list[1].latitude, input[1].latitude);
  assert.equal(list[1].isDefault, false);
});

test("operations do not mutate their input lists", () => {
  const input = [place("a", true), place("b")];
  const snapshot = JSON.parse(JSON.stringify(input));
  addLocation(input, { name: "N", latitude: 0, longitude: 0 }, "c");
  renameLocation(input, "a", "X");
  setDefaultLocation(input, "b");
  removeLocation(input, "a");
  ensureOneDefault(input);
  assert.deepEqual(input, snapshot);
});
