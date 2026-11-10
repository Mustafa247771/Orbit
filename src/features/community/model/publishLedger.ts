import { readJson, writeJson } from "@/core/storage/jsonFile";
import type { Sighting } from "@/features/sightings/model/Sighting";

const fileName = (uid: string) => `community-published-${uid}.json`;
let pending: Promise<void> = Promise.resolve();

async function readLedger(uid: string): Promise<Record<string, string>> {
  const value = await readJson(fileName(uid));
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry) => typeof entry[1] === "string"));
}

export async function unpublishedSightings(
  uid: string,
  sightings: Sighting[],
): Promise<Sighting[]> {
  await pending;
  const ledger = await readLedger(uid);
  return sightings.filter(
    (sighting) =>
      sighting.visibility === "community" &&
      !Object.prototype.hasOwnProperty.call(ledger, sighting.id),
  );
}

export function markPublished(uid: string, sightingId: string, postId: string): Promise<void> {
  const result = pending.then(async () => {
    const ledger = await readLedger(uid);
    await writeJson(fileName(uid), { ...ledger, [sightingId]: postId });
  });
  pending = result.catch(() => undefined);
  return result;
}
