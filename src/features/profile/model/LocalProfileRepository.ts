import { readJson, removeJson, writeJson } from "@/core/storage/jsonFile";
import type { AccountProfile } from "./Profile";
import { parseAccountProfile } from "./profileValidation";
import type { ProfileRepository } from "./ProfileRepository";

const fileName = (uid: string) => `profile-${uid}.json`;

export class LocalProfileRepository implements ProfileRepository {
  async read(uid: string): Promise<AccountProfile> {
    return parseAccountProfile(await readJson(fileName(uid)));
  }

  write(uid: string, profile: AccountProfile): Promise<void> {
    return writeJson(fileName(uid), profile);
  }

  remove(uid: string): Promise<void> {
    return removeJson(fileName(uid));
  }
}

export const profileRepository = new LocalProfileRepository();
