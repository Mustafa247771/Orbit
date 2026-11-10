import type { AccountProfile } from "./Profile";

export interface ProfileRepository {
  read(uid: string): Promise<AccountProfile>;
  write(uid: string, profile: AccountProfile): Promise<void>;
  remove(uid: string): Promise<void>;
}
