import type { AccountProfile } from "./Profile";

// A friendly line (never a hard failure) when the account copy could not be
// reached or updated; the data itself is still safe on the phone.
export type ProfileLoad = { profile: AccountProfile; notice: string | null };

export interface ProfileRepository {
  read(uid: string): Promise<ProfileLoad>;
  write(uid: string, profile: AccountProfile): Promise<{ notice: string | null }>;
  // Removes leftover phone files; the account copy is deleted with deleteAccountDocs.
  remove(uid: string): Promise<void>;
}
