import type { NewSightingDraft, Sighting } from "./Sighting";

export interface SightingRepository {
  list(): Promise<Sighting[]>;
  save(draft: NewSightingDraft): Promise<Sighting>;
}
