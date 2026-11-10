import assert from "node:assert/strict";
import test from "node:test";
import {
  NEARBY_RADIUS_KM,
  cellOf,
  distanceKm,
  neighbourCells,
} from "../src/features/community/model/geoCells.ts";

test("cellOf: floors latitude and longitude into a cell key", () => {
  assert.equal(cellOf(30.9, 31.2), "30:31");
  assert.equal(cellOf(-0.5, -0.5), "-1:-1");
});

// Point `km` away from (lat, lon) along a bearing, on a sphere.
function destination(lat, lon, bearingDeg, km) {
  const d = km / 6371;
  const rad = (x) => (x * Math.PI) / 180;
  const b = rad(bearingDeg);
  const phi1 = rad(lat);
  const phi2 = Math.asin(
    Math.sin(phi1) * Math.cos(d) + Math.cos(phi1) * Math.sin(d) * Math.cos(b),
  );
  const lambda2 =
    rad(lon) +
    Math.atan2(
      Math.sin(b) * Math.sin(d) * Math.cos(phi1),
      Math.cos(d) - Math.sin(phi1) * Math.sin(phi2),
    );
  return {
    latitude: (phi2 * 180) / Math.PI,
    longitude: ((((lambda2 * 180) / Math.PI + 180) % 360) + 360) % 360 - 180,
  };
}

test("neighbourCells: returns unique cells including the centre", () => {
  const cells = neighbourCells(30.5, 31.5);
  assert.equal(new Set(cells).size, cells.length);
  assert.ok(cells.includes("30:31"));
  assert.ok(cells.length > 9);
});

test("neighbourCells: ring size follows NEARBY_RADIUS_KM", () => {
  const rows = Math.ceil(NEARBY_RADIUS_KM / 111);
  const cells = neighbourCells(0.5, 10.5);
  const latitudes = new Set(cells.map((cell) => Number(cell.split(":")[0])));
  assert.equal(latitudes.size, 2 * rows + 1);
});

test("neighbourCells: covers points ~140 km away in every direction", () => {
  assert.ok(140 < NEARBY_RADIUS_KM);
  for (const lat of [0.3, 30.7, 45.2, 60.4, -60.4]) {
    for (const lon of [10.2, 179.8, -179.9]) {
      const cells = new Set(neighbourCells(lat, lon));
      for (let bearing = 0; bearing < 360; bearing += 15) {
        const p = destination(lat, lon, bearing, 140);
        assert.ok(
          cells.has(cellOf(p.latitude, p.longitude)),
          `lat ${lat} lon ${lon} bearing ${bearing} -> ${cellOf(p.latitude, p.longitude)}`,
        );
      }
    }
  }
});

test("neighbourCells: longitude wraps around at the antimeridian", () => {
  const east = neighbourCells(10.5, 179.5);
  assert.ok(east.includes("10:-180"));
  assert.ok(east.includes("10:-179"));
  const west = neighbourCells(10.5, -179.5);
  assert.ok(west.includes("10:179"));
  assert.equal(new Set(east).size, east.length);
});

test("neighbourCells: latitude is clamped at the poles without duplicates", () => {
  const north = neighbourCells(90, 10.5);
  assert.equal(new Set(north).size, north.length);
  assert.ok(north.every((cell) => Number(cell.split(":")[0]) <= 90));
  const south = neighbourCells(-90, 10.5);
  assert.equal(new Set(south).size, south.length);
  assert.ok(south.every((cell) => Number(cell.split(":")[0]) >= -90));
  assert.ok(south.length < 5 * 25);
});

test("distanceKm: same point is zero", () => {
  const p = { latitude: 30, longitude: 31 };
  assert.equal(distanceKm(p, p), 0);
});

test("distanceKm: Cairo to Alexandria is about 180 km", () => {
  const cairo = { latitude: 30.0444, longitude: 31.2357 };
  const alexandria = { latitude: 31.2001, longitude: 29.9187 };
  const km = distanceKm(cairo, alexandria);
  assert.ok(km > 170 && km < 190, `got ${km}`);
  assert.ok(km > NEARBY_RADIUS_KM);
});

test("distanceKm: is symmetric and equator to pole is about 10,000 km", () => {
  const a = { latitude: 0, longitude: 0 };
  const b = { latitude: 90, longitude: 0 };
  assert.ok(Math.abs(distanceKm(a, b) - distanceKm(b, a)) < 1e-9);
  assert.ok(Math.abs(distanceKm(a, b) - 10008) < 20);
});
