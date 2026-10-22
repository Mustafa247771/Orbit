import type { NewSightingDraft, Sighting } from "@/data/Sighting";

export interface SightingRepository {
  list(): Promise<Sighting[]>;
  save(draft: NewSightingDraft): Promise<Sighting>;
}
