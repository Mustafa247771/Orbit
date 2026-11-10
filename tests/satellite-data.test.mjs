import assert from "node:assert/strict";
import test from "node:test";
import { parseElements } from "../src/core/satellites/SatelliteData.ts";

const iss = () => ({
  OBJECT_NAME: "  ISS (ZARYA)  ",
  OBJECT_ID: "1998-067A",
  EPOCH: "2024-05-01T12:00:00.000000",
  MEAN_MOTION: "15.50000000",
  ECCENTRICITY: "0.0005000",
  INCLINATION: 51.6400,
  RA_OF_ASC_NODE: 120.5,
  ARG_OF_PERICENTER: 80.25,
  MEAN_ANOMALY: 279.9,
  EPHEMERIS_TYPE: 0,
  CLASSIFICATION_TYPE: "U",
  NORAD_CAT_ID: "25544",
  ELEMENT_SET_NO: 999,
  REV_AT_EPOCH: 45000,
  BSTAR: 0.0001,
  MEAN_MOTION_DOT: 0.00002,
  MEAN_MOTION_DDOT: 0,
});

test("accepts a realistic ISS record and trims the name", () => {
  const result = parseElements(iss());
  assert.ok(result);
  assert.equal(result.OBJECT_NAME, "ISS (ZARYA)");
  assert.equal(result.OBJECT_ID, "1998-067A");
});

test("normalises the epoch to an ISO string ending in Z", () => {
  const result = parseElements(iss());
  assert.equal(result.EPOCH, "2024-05-01T12:00:00.000Z");
});

test("converts numeric strings to numbers", () => {
  const result = parseElements(iss());
  assert.equal(result.NORAD_CAT_ID, 25544);
  assert.equal(result.MEAN_MOTION, 15.5);
  assert.equal(result.ECCENTRICITY, 0.0005);
});

test("rejects a record with a missing or blank name", () => {
  const { OBJECT_NAME, ...noName } = iss();
  assert.equal(parseElements(noName), null);
  assert.equal(parseElements({ ...iss(), OBJECT_NAME: "   " }), null);
});

test("rejects an unparseable epoch", () => {
  assert.equal(parseElements({ ...iss(), EPOCH: "not a date" }), null);
});

test("rejects NORAD id 0", () => {
  assert.equal(parseElements({ ...iss(), NORAD_CAT_ID: 0 }), null);
});

test("rejects a non-numeric orbital field", () => {
  assert.equal(parseElements({ ...iss(), INCLINATION: "abc" }), null);
});

test("rejects non-object input", () => {
  for (const bad of [null, undefined, "iss", 42, [iss()]]) {
    assert.equal(parseElements(bad), null);
  }
});
