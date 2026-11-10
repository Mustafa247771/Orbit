import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type DocumentSnapshot,
} from "firebase/firestore";

import { getFirebaseAuth } from "@/core/firebase/client";
import { getDb } from "@/core/firebase/firestore";

import {
  accountDocErrorMessage,
  cacheFileName,
  decideWinner,
  parseCacheEnvelope,
  parseCloudCopy,
  settleAfterPush,
  type CacheEnvelope,
} from "./cloudDocModel";
import { readJson, removeJson, writeJson } from "./jsonFile";

// Account documents live at userData/{uid}/docs/{name} in Firestore and are
// cached on the phone as cloud-{name}-{uid}.json. The phone copy is written
// first, so the app works offline and a failed upload is retried later.

const TIMEOUT_MS = 8000;

export type ReadResult<T> = {
  value: T;
  source: "cloud" | "cache";
  error: string | null;
};

export type WriteResult = { synced: boolean; error: string | null };

const queues = new Map<string, Promise<unknown>>();
const writeCounts = new Map<string, number>();
const latestWrites = new Map<string, Promise<WriteResult | null>>();

// One task at a time per (uid, name); a failed task never blocks the next.
// Every task waits on the network at most TIMEOUT_MS per call, so a queue
// cannot stall for good.
function enqueue<R>(key: string, task: () => Promise<R>): Promise<R> {
  const previous = queues.get(key) ?? Promise.resolve();
  const next = previous.then(task, task);

  queues.set(key, next.catch(() => undefined));
  return next;
}

function withTimeout<R>(promise: Promise<R>): Promise<R> {
  return new Promise<R>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(Object.assign(new Error("Timed out."), { code: "timeout" })),
      TIMEOUT_MS,
    );

    promise.then(
      (result) => {
        clearTimeout(timer);
        resolve(result);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

const keyOf = (uid: string, name: string) => `${uid}/${name}`;
const docRef = (uid: string, name: string) =>
  doc(getDb(), "userData", uid, "docs", name);

// The rules only allow the signed-in owner, so a call for any other account
// (for example after sign-out) stays on the phone instead of waiting for a refusal.
function assertSignedInAs(uid: string) {
  if (getFirebaseAuth().currentUser?.uid !== uid) {
    throw Object.assign(new Error("Not signed in."), { code: "unauthenticated" });
  }
}

async function loadCache(uid: string, name: string): Promise<CacheEnvelope | null> {
  try {
    return parseCacheEnvelope(await readJson(cacheFileName(name, uid)));
  } catch {
    return null;
  }
}

async function saveCache(uid: string, name: string, envelope: CacheEnvelope): Promise<boolean> {
  try {
    await writeJson(cacheFileName(name, uid), envelope);
    return true;
  } catch {
    return false;
  }
}

// Firestore rejects undefined and class instances; a JSON round trip drops them.
function toJson(value: unknown): unknown {
  return value === undefined ? null : JSON.parse(JSON.stringify(value));
}

function fetchSnapshot(uid: string, name: string): Promise<DocumentSnapshot> {
  assertSignedInAs(uid);
  return withTimeout(getDoc(docRef(uid, name)));
}

async function push(uid: string, name: string, data: unknown, clientUpdatedAt: number) {
  assertSignedInAs(uid);
  await withTimeout(
    setDoc(docRef(uid, name), {
      data: toJson(data),
      updatedAt: serverTimestamp(),
      clientUpdatedAt,
    }),
  );
}

// Clears the pending flag after an upload, unless a newer edit was saved meanwhile.
async function confirmPushed(uid: string, name: string, pushedAt: number) {
  const settled = settleAfterPush(await loadCache(uid, name), pushedAt);

  if (settled) await saveCache(uid, name, settled);
}

// Saves on the phone first, then uploads. Must run inside the queue. Throws only
// when the change is saved nowhere.
async function saveAndPush(uid: string, name: string, data: unknown): Promise<WriteResult> {
  const at = Date.now();

  const cached = await saveCache(uid, name, { data, clientUpdatedAt: at, pending: true });

  try {
    await push(uid, name, data, at);
  } catch (failure) {
    // Neither the phone nor the account has the change: a real failure.
    if (!cached) throw new Error("Your change could not be saved.");
    return { synced: false, error: accountDocErrorMessage(failure) };
  }

  await confirmPushed(uid, name, at);
  return { synced: true, error: null };
}

// A pending phone edit wins; otherwise the cloud copy does. When nothing exists
// anywhere, parse receives null and should return defaults.
export async function readAccountDoc<T>(
  uid: string,
  name: string,
  parse: (raw: unknown) => T,
): Promise<ReadResult<T>> {
  return enqueue(keyOf(uid, name), async () => {
    const cache = await loadCache(uid, name);
    let cloud: ReturnType<typeof parseCloudCopy> = null;

    // A pending edit wins whatever the cloud holds, so no fetch is needed.
    if (!cache?.pending) {
      try {
        const snapshot = await fetchSnapshot(uid, name);

        cloud = snapshot.exists() ? parseCloudCopy(snapshot.data()) : null;
      } catch (failure) {
        return {
          value: parse(cache ? cache.data : null),
          source: "cache" as const,
          error: accountDocErrorMessage(failure),
        };
      }
    }

    const decision = decideWinner(cloud, cache);

    if (decision.use === "none" || (decision.use === "cache" && !cache)) {
      return { value: parse(null), source: "cloud" as const, error: null };
    }

    if (decision.use === "cloud" && cloud) {
      await saveCache(uid, name, {
        data: cloud.data,
        clientUpdatedAt: cloud.clientUpdatedAt,
        pending: false,
      });
      return { value: parse(cloud.data), source: "cloud" as const, error: null };
    }

    // The phone copy wins: upload it.
    const local = cache as CacheEnvelope;

    try {
      await push(uid, name, local.data, local.clientUpdatedAt);
      await confirmPushed(uid, name, local.clientUpdatedAt);
      return { value: parse(local.data), source: "cloud" as const, error: null };
    } catch (failure) {
      return {
        value: parse(local.data),
        source: "cache" as const,
        error: accountDocErrorMessage(failure),
      };
    }
  });
}

// Saves on the phone first, then uploads. A failed upload stays pending and is
// retried by the next read or write. Callers save the whole document, so a
// write still queued when a newer one arrives is skipped and reports the newer
// write's result: offline, several quick edits cost one wait, not one each.
export async function writeAccountDoc<T>(
  uid: string,
  name: string,
  value: T,
): Promise<WriteResult> {
  const key = keyOf(uid, name);
  const turn = (writeCounts.get(key) ?? 0) + 1;
  const data = toJson(value);

  writeCounts.set(key, turn);

  const done = enqueue<WriteResult | null>(key, async () =>
    writeCounts.get(key) === turn ? saveAndPush(uid, name, data) : null,
  );

  latestWrites.set(key, done);

  let result = await done;

  while (result === null) {
    result = await (latestWrites.get(key) ?? Promise.resolve(null));
  }
  return result;
}

// Removes the cloud documents and the phone copies. Phone copies are kept when
// a cloud delete fails, so the caller can retry.
export async function deleteAccountDocs(
  uid: string,
  names: string[],
): Promise<{ error: string | null }> {
  let error: string | null = null;

  for (const name of names) {
    const key = keyOf(uid, name);

    // Edits still waiting in the queue must not bring the document back.
    writeCounts.set(key, (writeCounts.get(key) ?? 0) + 1);
    await enqueue(key, async () => {
      try {
        assertSignedInAs(uid);
        await withTimeout(deleteDoc(docRef(uid, name)));
        await removeJson(cacheFileName(name, uid));
      } catch (failure) {
        error = accountDocErrorMessage(failure);
      }
    });
  }

  return { error };
}

// One-time upload of an old per-device file. Runs only when the phone has the
// old file, no cached copy yet, and the cloud has no document, all inside the
// document's queue so an edit made meanwhile is never overwritten. The legacy
// file is left in place (the caller may remove it once this returns true).
// Resolves true when the legacy data reached the account. When the cloud cannot
// be reached, the old data is kept as an unconfirmed phone copy: it shows
// offline, and a later read uploads it only if the cloud still has nothing.
export async function migrateLocalFile<T>(
  uid: string,
  name: string,
  legacyFileName: string,
  parse: (raw: unknown) => T,
): Promise<boolean> {
  return enqueue(keyOf(uid, name), async () => {
    let legacy: unknown;

    try {
      legacy = await readJson(legacyFileName);
    } catch {
      return false;
    }
    if (legacy === null || (await loadCache(uid, name))) return false;

    const data = toJson(parse(legacy));

    try {
      if ((await fetchSnapshot(uid, name)).exists()) return false;
    } catch {
      await saveCache(uid, name, { data, clientUpdatedAt: Date.now(), pending: false });
      return false;
    }

    return (await saveAndPush(uid, name, data)).synced;
  });
}
