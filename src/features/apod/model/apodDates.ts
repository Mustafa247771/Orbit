export const FIRST_APOD_DATE = "1995-06-16";

const DAY_MS = 86_400_000;

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

function formatUtc(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

// APOD days roll over at midnight US Eastern, wherever the phone is.
export function easternToday(now: Date): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    const date = `${get("year")}-${get("month")}-${get("day")}`;
    if (isValidIsoDate(date)) return date;
  } catch {
    // Intl or the time zone database is missing; use the UTC date minus one day.
  }
  return formatUtc(now.getTime() - DAY_MS);
}

// Milliseconds until the Eastern date changes. Midnight in New York always falls on a
// whole UTC hour, so the next change is found by checking the coming hour marks.
export function msUntilNextEasternDay(now: Date): number {
  const current = easternToday(now);
  const HOUR = 3_600_000;
  const first = Math.floor(now.getTime() / HOUR) * HOUR + HOUR;
  for (let i = 0; i < 26; i++) {
    const at = first + i * HOUR;
    if (easternToday(new Date(at)) !== current) return at - now.getTime();
  }
  return DAY_MS;
}

export type IsoParts = { year: number; month: number; day: number };

export function parseIsoDate(input: string): IsoParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  const real =
    d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
  return real ? { year, month, day } : null;
}

export function isValidIsoDate(input: string): boolean {
  return parseIsoDate(input) !== null;
}

export function validateApodDate(input: string, today: string): string | null {
  const text = input.trim();
  if (text.length === 0) return "Enter a date as YYYY-MM-DD.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "Use the format YYYY-MM-DD, like 2024-03-15.";
  if (!isValidIsoDate(text)) return "That day does not exist on the calendar.";
  if (text < FIRST_APOD_DATE) return "The first picture was published on 1995-06-16.";
  if (text > today) return "That day has not happened yet. Pick today or earlier.";
  return null;
}

export function addDays(date: string, days: number): string {
  const p = parseIsoDate(date);
  if (!p) return date;
  return formatUtc(Date.UTC(p.year, p.month - 1, p.day) + days * DAY_MS);
}

// Seven days with `selected` near the end, never past today or before the first picture.
export function weekWindow(selected: string, today: string): string[] {
  let end = addDays(selected, 3);
  if (end > today) end = today;
  let start = addDays(end, -6);
  if (start < FIRST_APOD_DATE) {
    start = FIRST_APOD_DATE;
    end = addDays(start, 6);
    if (end > today) end = today;
  }
  const days: string[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) days.push(day);
  return days;
}

// Weeks (Sunday first) of ISO dates, with null padding outside the month. month is 1-12.
export function monthGrid(year: number, month: number): (string | null)[][] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const lead = first.getUTCDay();
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= count; day++) {
    cells.push(`${pad(year, 4)}-${pad(month)}-${pad(day)}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
