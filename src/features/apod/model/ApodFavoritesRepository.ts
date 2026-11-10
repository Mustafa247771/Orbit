import { migrateLocalFile, readAccountDoc, writeAccountDoc } from "@/core/storage/cloudDoc";
import { removeJson } from "@/core/storage/jsonFile";
import { parseFavorites } from "./apodFavorites.ts";
import type { ApodFavorite } from "./apodFavorites.ts";

export type FavoritesRead = {
  items: ApodFavorite[];
  /** True when the account copy could not be reached and the phone copy was used. */
  fromPhone: boolean;
};

export type FavoritesWrite = {
  /** False when saved on the phone only; it uploads on a later read or write. */
  synced: boolean;
};

export interface ApodFavoritesRepository {
  /** Real unreadable state throws; offline falls back to the phone copy. */
  read(uid: string): Promise<FavoritesRead>;
  write(uid: string, favorites: ApodFavorite[]): Promise<FavoritesWrite>;
}

const DOC_NAME = "apodFavorites";
const legacyFileName = (uid: string) => `apod-favorites-${uid}.json`;

export class CloudApodFavoritesRepository implements ApodFavoritesRepository {
  private readonly migrated = new Set<string>();

  // Moves the old per-phone file into the account once per session per user.
  private async migrate(uid: string): Promise<void> {
    if (this.migrated.has(uid)) return;
    try {
      const done = await migrateLocalFile(uid, DOC_NAME, legacyFileName(uid), parseFavorites);
      // Offline or nothing to move: try again on the next first read.
      if (!done) return;
      await removeJson(legacyFileName(uid));
      this.migrated.add(uid);
    } catch {
      // A failed migration must never block reading favourites.
    }
  }

  async read(uid: string): Promise<FavoritesRead> {
    await this.migrate(uid);
    const result = await readAccountDoc(uid, DOC_NAME, parseFavorites);
    return { items: result.value, fromPhone: result.source === "cache" };
  }

  async write(uid: string, favorites: ApodFavorite[]): Promise<FavoritesWrite> {
    const result = await writeAccountDoc(uid, DOC_NAME, favorites);
    return { synced: result.synced };
  }
}

/** Removes the old per-phone file, e.g. when the account is deleted. Never throws. */
export async function removeLegacyFavorites(uid: string): Promise<void> {
  try {
    await removeJson(legacyFileName(uid));
  } catch {
    // A leftover old file is harmless.
  }
}

export const apodFavoritesRepository: ApodFavoritesRepository = new CloudApodFavoritesRepository();
