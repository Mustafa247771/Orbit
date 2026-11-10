import assert from "node:assert/strict";
import test from "node:test";
import {
  FIRST_APOD_DATE,
  addDays,
  msUntilNextEasternDay,
  easternToday,
  isValidIsoDate,
  monthGrid,
  parseIsoDate,
  validateApodDate,
  weekWindow,
} from "../src/features/apod/model/apodDates.ts";

const at = (iso) => new Date(iso);

test("easternToday: follows Eastern time near midnight UTC", () => {
  assert.equal(easternToday(at("2024-07-04T03:59:00Z")), "2024-07-03");
  assert.equal(easternToday(at("2024-07-04T04:00:00Z")), "2024-07-04");
  assert.equal(easternToday(at("2024-01-15T04:59:00Z")), "2024-01-14");
  assert.equal(easternToday(at("2024-01-15T05:00:00Z")), "2024-01-15");
});

test("easternToday: spring-forward day (2024-03-10, 07:00 UTC)", () => {
  assert.equal(easternToday(at("2024-03-10T06:59:00Z")), "2024-03-10");
  assert.equal(easternToday(at("2024-03-11T03:59:00Z")), "2024-03-10");
  assert.equal(easternToday(at("2024-03-11T04:00:00Z")), "2024-03-11");
});

test("easternToday: fall-back day (2024-11-03, 06:00 UTC)", () => {
  assert.equal(easternToday(at("2024-11-03T03:59:00Z")), "2024-11-02");
  assert.equal(easternToday(at("2024-11-03T04:00:00Z")), "2024-11-03");
  assert.equal(easternToday(at("2024-11-04T04:59:00Z")), "2024-11-03");
  assert.equal(easternToday(at("2024-11-04T05:00:00Z")), "2024-11-04");
});

test("easternToday: without Intl it uses the UTC date minus one day", () => {
  const original = Intl.DateTimeFormat;
  Intl.DateTimeFormat = function () {
    throw new Error("no Intl");
  };
  try {
    assert.equal(easternToday(at("2024-07-04T03:59:00Z")), "2024-07-03");
    assert.equal(easternToday(at("2024-07-04T23:59:00Z")), "2024-07-03");
    assert.equal(easternToday(at("2024-01-01T00:00:00Z")), "2023-12-31");
  } finally {
    Intl.DateTimeFormat = original;
  }
});

test("msUntilNextEasternDay: counts down to Eastern midnight, DST included", () => {
  const HOUR = 3_600_000;
  assert.equal(msUntilNextEasternDay(at("2024-07-04T03:00:00Z")), HOUR);
  assert.equal(msUntilNextEasternDay(at("2024-07-04T03:59:00Z")), 60_000);
  assert.equal(msUntilNextEasternDay(at("2024-07-04T04:00:00Z")), 24 * HOUR);
  assert.equal(msUntilNextEasternDay(at("2024-01-15T04:30:00Z")), 30 * 60_000);
  // Spring forward: 2024-03-10 lasts 23 hours (05:00Z to 04:00Z).
  assert.equal(msUntilNextEasternDay(at("2024-03-10T05:00:00Z")), 23 * HOUR);
  // Fall back: 2024-11-03 lasts 25 hours (04:00Z to 05:00Z).
  assert.equal(msUntilNextEasternDay(at("2024-11-03T04:00:00Z")), 25 * HOUR);
});

test("parseIsoDate / isValidIsoDate: leap days and bad dates", () => {
  assert.deepEqual(parseIsoDate("2024-02-29"), { year: 2024, month: 2, day: 29 });
  assert.equal(isValidIsoDate("2024-02-29"), true);
  assert.equal(isValidIsoDate("2023-02-29"), false);
  assert.equal(isValidIsoDate("1900-02-29"), false);
  assert.equal(isValidIsoDate("2000-02-29"), true);
  assert.equal(isValidIsoDate("2024-13-01"), false);
  assert.equal(isValidIsoDate("2024-04-31"), false);
  assert.equal(parseIsoDate("2024-3-5"), null);
});

test("validateApodDate: accepts the range and rejects the rest", () => {
  const today = "2024-06-10";
  assert.equal(validateApodDate("2024-06-10", today), null);
  assert.equal(validateApodDate(" 2024-02-29 ", today), null);
  assert.equal(validateApodDate(FIRST_APOD_DATE, today), null);
  assert.match(validateApodDate("1995-06-15", today) ?? "", /1995-06-16/);
  assert.match(validateApodDate("2024-06-11", today) ?? "", /not happened/);
  assert.match(validateApodDate("2023-02-29", today) ?? "", /does not exist/);
  assert.match(validateApodDate("", today) ?? "", /YYYY-MM-DD/);
  assert.match(validateApodDate("06/10/2024", today) ?? "", /YYYY-MM-DD/);
  assert.match(validateApodDate("2024-6-1", today) ?? "", /YYYY-MM-DD/);
  assert.match(validateApodDate("hello", today) ?? "", /YYYY-MM-DD/);
});

test("addDays: crosses month, year and leap boundaries", () => {
  assert.equal(addDays("2024-02-28", 1), "2024-02-29");
  assert.equal(addDays("2024-02-29", 1), "2024-03-01");
  assert.equal(addDays("2023-12-31", 1), "2024-01-01");
  assert.equal(addDays("2024-01-01", -1), "2023-12-31");
  assert.equal(addDays("2024-03-10", 0), "2024-03-10");
});

test("weekWindow: seven days ending three after the selection", () => {
  const days = weekWindow("2024-05-10", "2024-06-01");
  assert.equal(days.length, 7);
  assert.equal(days[0], "2024-05-07");
  assert.equal(days[6], "2024-05-13");
  assert.ok(days.includes("2024-05-10"));
});

test("weekWindow: clamps at today", () => {
  const days = weekWindow("2024-05-31", "2024-06-01");
  assert.equal(days.length, 7);
  assert.equal(days[6], "2024-06-01");
  assert.equal(days[0], "2024-05-26");
});

test("weekWindow: clamps at the first picture", () => {
  const days = weekWindow("1995-06-17", "2024-06-01");
  assert.equal(days.length, 7);
  assert.equal(days[0], FIRST_APOD_DATE);
  assert.equal(days[6], "1995-06-22");
});

test("weekWindow: shorter when the archive is shorter than a week", () => {
  const days = weekWindow("1995-06-16", "1995-06-18");
  assert.deepEqual(days, ["1995-06-16", "1995-06-17", "1995-06-18"]);
});

test("monthGrid: weeks of seven with null padding", () => {
  const feb = monthGrid(2024, 2);
  assert.ok(feb.every((week) => week.length === 7));
  assert.equal(feb.length, 5);
  // 2024-02-01 is a Thursday.
  assert.deepEqual(feb[0].slice(0, 5), [null, null, null, null, "2024-02-01"]);
  const days = feb.flat().filter((d) => d !== null);
  assert.equal(days.length, 29);
  assert.equal(days[28], "2024-02-29");
  assert.equal(monthGrid(2023, 2).flat().filter((d) => d !== null).length, 28);
  // Sunday-start month: 2023-10-01 is a Sunday.
  assert.equal(monthGrid(2023, 10)[0][0], "2023-10-01");
});
