import { readAccountDoc, writeAccountDoc, migrateLocalFile } from "@/core/storage/cloudDoc";
import { readJson, removeJson } from "@/core/storage/jsonFile";
import type { AccountProfile } from "./Profile";
import { parseAccountProfile } from "./profileValidation";
import type { ProfileRepository } from "./ProfileRepository";

export const PROFILE_DOC = "profile";

const SYNC_LATER =
  "Saved on this phone — will sync to your account when you're online.";
const SHOWING_PHONE_COPY =
  "Showing the copy saved on this phone — it will sync to your account when you're online.";

const legacyFileName = (uid: string) => `profile-${uid}.json`;

export class CloudProfileRepository implements ProfileRepository {
  // The old per-device file is moved to the account once per app session.
  private readonly migrationTried = new Set<string>();

  private async migrateLegacy(uid: string): Promise<void> {
    if (this.migrationTried.has(uid)) return;
    this.migrationTried.add(uid);

    try {
      // A cheap phone-only check, so users without an old file never wait on the network.
      if ((await readJson(legacyFileName(uid))) === null) return;
      const synced = await migrateLocalFile(
        uid,
        PROFILE_DOC,
        legacyFileName(uid),
        parseAccountProfile,
      );
      if (synced) await removeJson(legacyFileName(uid));
    } catch {
      // Migration is best effort; the old file stays and is tried next launch.
    }
  }

  async read(uid: string) {
    await this.migrateLegacy(uid);
    const result = await readAccountDoc(uid, PROFILE_DOC, parseAccountProfile);

    return {
      profile: result.value,
      notice: result.source === "cache" || result.error ? SHOWING_PHONE_COPY : null,
    };
  }

  async write(uid: string, profile: AccountProfile) {
    const result = await writeAccountDoc(uid, PROFILE_DOC, profile);

    return { notice: result.synced ? null : SYNC_LATER };
  }

  async remove(uid: string): Promise<void> {
    await removeJson(legacyFileName(uid));
  }
}

export const profileRepository = new CloudProfileRepository();
