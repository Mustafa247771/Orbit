// Pure rules for account documents: no Firebase, no files. Kept separate so
// node:test can load it.

// What is kept on the phone for one account document.
export type CacheEnvelope = {
  data: unknown;
  clientUpdatedAt: number;
  // true while the copy has not been confirmed by Firestore yet.
  pending: boolean;
};

export type CloudCopy = { data: unknown; clientUpdatedAt: number };

export type Decision =
  | { use: "cloud"; push: false }
  | { use: "cache"; push: boolean }
  | { use: "none"; push: false };

export function cacheFileName(name: string, uid: string): string {
  return `cloud-${name}-${uid}.json`;
}

export function parseCacheEnvelope(raw: unknown): CacheEnvelope | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;

  if (
    typeof record.clientUpdatedAt !== "number" ||
    !Number.isFinite(record.clientUpdatedAt) ||
    !("data" in record)
  ) {
    return null;
  }

  return {
    data: record.data,
    clientUpdatedAt: record.clientUpdatedAt,
    pending: record.pending === true,
  };
}

// Reads the Firestore document body; null when it is missing or malformed.
export function parseCloudCopy(raw: unknown): CloudCopy | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;

  if (
    typeof record.clientUpdatedAt !== "number" ||
    !Number.isFinite(record.clientUpdatedAt) ||
    !("data" in record)
  ) {
    return null;
  }

  return { data: record.data, clientUpdatedAt: record.clientUpdatedAt };
}

// Which copy wins. A pending local edit is always pushed: device clocks differ,
// so timestamps are never compared across devices. A confirmed local copy is
// only pushed when the cloud has nothing, so data that exists only on the phone
// still reaches the account.
export function decideWinner(
  cloud: CloudCopy | null,
  cache: CacheEnvelope | null,
): Decision {
  if (!cloud && !cache) return { use: "none", push: false };
  if (!cloud && cache) return { use: "cache", push: true };
  if (cloud && !cache) return { use: "cloud", push: false };
  if (cache && cache.pending) return { use: "cache", push: true };
  return { use: "cloud", push: false };
}

// After a successful push: clear the pending flag unless a newer edit was
// saved while the push was in flight.
export function settleAfterPush(
  current: CacheEnvelope | null,
  pushedAt: number,
): CacheEnvelope | null {
  if (!current || current.clientUpdatedAt !== pushedAt) return current;
  return { ...current, pending: false };
}

const MESSAGES: Record<string, string> = {
  "permission-denied": "Your account data could not be saved. Please sign in again.",
  unauthenticated: "Please sign in to sync your data.",
  unavailable: "You are offline. Your changes are saved on this phone and will sync later.",
  "deadline-exceeded": "Syncing took too long. Your changes will sync later.",
  "resource-exhausted": "Syncing is busy right now. Your changes will sync later.",
  timeout: "Syncing took too long. Your changes will sync later.",
};

function errorCode(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) return "";
  const code = error.code;
  return typeof code === "string" ? code.replace(/^firestore\//, "") : "";
}

export function accountDocErrorMessage(error: unknown): string {
  return (
    MESSAGES[errorCode(error)] ??
    "Your data could not be synced. It is saved on this phone and will sync later."
  );
}
