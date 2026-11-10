import assert from "node:assert/strict";
import test from "node:test";
import {
  parseAccountProfile,
  parseDeviceSettings,
  snapToRange,
  validateDisplayName,
  validateLocationInput,
  validateSearchQuery,
  SEARCH_QUERY_MIN,
  SEARCH_QUERY_MAX,
} from "../src/features/profile/model/profileValidation.ts";
import {
  DEFAULT_ACCOUNT_SETTINGS,
  DEFAULT_DEVICE_SETTINGS,
  ELEVATION_RANGE,
  LEAD_TIME_OPTIONS,
  MAX_LOCATIONS,
} from "../src/features/profile/model/Profile.ts";

const saved = (id, name, isDefault = false) => ({
  id,
  name,
  latitude: 10,
  longitude: 20,
  isDefault,
});
const okInput = { name: "Home", latitude: 10, longitude: 20 };
const leadTimeOf = (leadMinutes) =>
  parseAccountProfile({ settings: { leadMinutes } }).settings.leadMinutes;

test("display name: blank is rejected", () => {
  assert.ok(validateDisplayName(""));
  assert.ok(validateDisplayName("    "));
});

test("display name: one character is too short", () => {
  assert.match(validateDisplayName("a"), /at least 2/);
});

test("display name: over 40 characters is too long", () => {
  assert.match(validateDisplayName("x".repeat(41)), /40/);
});

test("display name: valid names are accepted after trimming", () => {
  assert.equal(validateDisplayName("  Jo  "), null);
  assert.equal(validateDisplayName("x".repeat(40)), null);
});

test("search query: blank and one trimmed character are rejected", () => {
  for (const query of ["", "   ", "a", "  a  "]) {
    assert.equal(
      validateSearchQuery(query),
      `Enter at least ${SEARCH_QUERY_MIN} characters to find a place.`,
    );
  }
});

test("search query: trimmed minimum and maximum lengths are accepted", () => {
  assert.equal(validateSearchQuery(`  ${"x".repeat(SEARCH_QUERY_MIN)}  `), null);
  assert.equal(validateSearchQuery(`  ${"x".repeat(SEARCH_QUERY_MAX)}  `), null);
  assert.equal(validateSearchQuery("Cairo"), null);
});

test("search query: over the trimmed maximum has a friendly error", () => {
  assert.equal(
    validateSearchQuery(`  ${"x".repeat(SEARCH_QUERY_MAX + 1)}  `),
    `Keep your search to ${SEARCH_QUERY_MAX} characters.`,
  );
});

test("location input: a valid place has no errors", () => {
  assert.deepEqual(validateLocationInput(okInput, []), {});
});

test("location input: name is required and limited to 40 characters", () => {
  assert.ok(validateLocationInput({ ...okInput, name: "   " }, []).name);
  assert.ok(validateLocationInput({ ...okInput, name: "x".repeat(41) }, []).name);
});

test("location input: latitude outside -90..90 or non-finite is rejected", () => {
  assert.ok(validateLocationInput({ ...okInput, latitude: 91 }, []).latitude);
  assert.ok(validateLocationInput({ ...okInput, latitude: -90.1 }, []).latitude);
  assert.ok(validateLocationInput({ ...okInput, latitude: NaN }, []).latitude);
  assert.equal(validateLocationInput({ ...okInput, latitude: 90 }, []).latitude, undefined);
});

test("location input: longitude outside -180..180 or non-finite is rejected", () => {
  assert.ok(validateLocationInput({ ...okInput, longitude: 181 }, []).longitude);
  assert.ok(validateLocationInput({ ...okInput, longitude: Infinity }, []).longitude);
  assert.equal(validateLocationInput({ ...okInput, longitude: -180 }, []).longitude, undefined);
});

test("location input: duplicate names are rejected case-insensitively", () => {
  const errors = validateLocationInput({ ...okInput, name: "  hOmE " }, [saved("a", "Home")]);
  assert.ok(errors.name);
});

test("location input: editing the same location is not a duplicate of itself", () => {
  assert.deepEqual(validateLocationInput(okInput, [saved("a", "Home")], "a"), {});
});

test("location input: editing into another saved name is still a duplicate", () => {
  const list = [saved("a", "Home"), saved("b", "Work")];
  assert.ok(validateLocationInput({ ...okInput, name: "work" }, list, "a").name);
});

test("location input: adding past the maximum count is rejected, editing is not", () => {
  const full = Array.from({ length: MAX_LOCATIONS }, (_, i) => saved(`p${i}`, `Place ${i}`));
  assert.match(validateLocationInput({ ...okInput, name: "Extra" }, full).name, /up to/);
  assert.deepEqual(validateLocationInput({ ...okInput, name: "Renamed" }, full, "p0"), {});
});

test("snapToRange rounds to the step, clamps to the range, and falls back on non-numbers", () => {
  const range = ELEVATION_RANGE;
  assert.equal(snapToRange(17, range, 15), 15);
  assert.equal(snapToRange(18, range, 15), 20);
  assert.equal(snapToRange(-100, range, 15), 0);
  assert.equal(snapToRange(1000, range, 15), 45);
  assert.equal(snapToRange("20", range, 15), 15);
  assert.equal(snapToRange(NaN, range, 15), 15);
});

test("parseAccountProfile: garbage input gives the default profile", () => {
  for (const raw of [null, undefined, 42, "text", [], {}]) {
    const profile = parseAccountProfile(raw);
    assert.deepEqual(profile.settings, DEFAULT_ACCOUNT_SETTINGS);
    assert.deepEqual(profile.locations, []);
    assert.equal(profile.photoUri, null);
  }
});

test("parseAccountProfile: out-of-range numbers are snapped and clamped", () => {
  const { settings } = parseAccountProfile({
    settings: { leadMinutes: 999, minElevation: -5, maxCloud: 33 },
  });
  assert.equal(settings.leadMinutes, 60);
  assert.equal(settings.minElevation, 0);
  assert.equal(settings.maxCloud, 30);
});

test("parseAccountProfile: every lead-time option is preserved", () => {
  assert.deepEqual(LEAD_TIME_OPTIONS, [5, 10, 15, 30, 60]);
  for (const leadMinutes of LEAD_TIME_OPTIONS) {
    assert.equal(leadTimeOf(leadMinutes), leadMinutes);
  }
});

test("parseAccountProfile: lead time snaps to the nearest option, with ties going lower", () => {
  const cases = [
    [-Number.MAX_VALUE, 5], [-100, 5], [7.5, 5], [8, 10],
    [12.5, 10], [13, 15], [20, 15], [22.5, 15], [23, 30],
    [40, 30], [45, 30], [46, 60], [999, 60], [Number.MAX_VALUE, 60],
  ];
  for (const [leadMinutes, expected] of cases) {
    assert.equal(leadTimeOf(leadMinutes), expected);
  }
});

test("parseAccountProfile: all old step-five lead times map to an allowed option", () => {
  for (let leadMinutes = 5; leadMinutes <= 60; leadMinutes += 5) {
    const actual = leadTimeOf(leadMinutes);
    assert.ok(LEAD_TIME_OPTIONS.includes(actual));
    assert.equal(
      Math.abs(actual - leadMinutes),
      Math.min(...LEAD_TIME_OPTIONS.map((option) => Math.abs(option - leadMinutes))),
    );
  }
});

test("parseAccountProfile: invalid lead time falls back to the default", () => {
  for (const leadMinutes of [undefined, null, "30", NaN, Infinity, -Infinity]) {
    assert.equal(leadTimeOf(leadMinutes), DEFAULT_ACCOUNT_SETTINGS.leadMinutes);
  }
});

test("parseAccountProfile: invalid enums and flags fall back to defaults, valid ones are kept", () => {
  const { settings } = parseAccountProfile({
    settings: {
      observationMode: "telescope",
      sightingVisibility: "nobody",
      notifications: { passAlerts: false, dailyPicture: "yes" },
    },
  });
  assert.equal(settings.observationMode, "telescope");
  assert.equal(settings.sightingVisibility, DEFAULT_ACCOUNT_SETTINGS.sightingVisibility);
  assert.equal(settings.notifications.passAlerts, false);
  assert.equal(
    settings.notifications.dailyPicture,
    DEFAULT_ACCOUNT_SETTINGS.notifications.dailyPicture,
  );
});

test("parseAccountProfile: invalid or duplicate-id locations are dropped", () => {
  const { locations } = parseAccountProfile({
    locations: [
      saved("a", "Home", true),
      { ...saved("b", "Bad"), latitude: 200 },
      { ...saved("c", "   ") },
      { id: "", name: "NoId", latitude: 1, longitude: 1 },
      { id: "d", name: "Str", latitude: "1", longitude: 1 },
      "junk",
      saved("a", "Dup id"),
    ],
  });
  assert.deepEqual(locations.map((p) => p.id), ["a"]);
});

test("parseAccountProfile: exactly one default is kept (first flagged, else first place)", () => {
  const two = parseAccountProfile({
    locations: [saved("a", "A"), saved("b", "B", true), saved("c", "C", true)],
  }).locations;
  assert.deepEqual(two.filter((p) => p.isDefault).map((p) => p.id), ["b"]);

  const none = parseAccountProfile({ locations: [saved("a", "A"), saved("b", "B")] }).locations;
  assert.deepEqual(none.filter((p) => p.isDefault).map((p) => p.id), ["a"]);
});

test("parseAccountProfile: locations are capped at the maximum count and empty photoUri becomes null", () => {
  const many = Array.from({ length: MAX_LOCATIONS + 5 }, (_, i) => saved(`p${i}`, `P${i}`));
  const profile = parseAccountProfile({ locations: many, photoUri: "" });
  assert.equal(profile.locations.length, MAX_LOCATIONS);
  assert.equal(profile.photoUri, null);
  assert.equal(parseAccountProfile({ photoUri: "file:///a.jpg" }).photoUri, "file:///a.jpg");
});

test("parseDeviceSettings: garbage gives the defaults", () => {
  const garbage = [null, 7, "x", [], {}, { units: "parsecs", haptics: "yes", reduceMotion: 1 }];
  for (const raw of garbage) {
    assert.deepEqual(parseDeviceSettings(raw), DEFAULT_DEVICE_SETTINGS);
  }
});

test("parseDeviceSettings: valid values are kept", () => {
  assert.deepEqual(
    parseDeviceSettings({ units: "imperial", haptics: false, reduceMotion: true }),
    { units: "imperial", haptics: false, reduceMotion: true },
  );
});
