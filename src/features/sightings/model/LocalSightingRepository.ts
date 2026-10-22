import { Directory, File, Paths } from "expo-file-system";

import type { NewSightingDraft, Sighting } from "./Sighting";
import type { SightingRepository } from "./SightingRepository";

const sightingsDirectory = new Directory(Paths.document, "sightings");
const sightingsIndex = new File(Paths.document, "sightings.json");

function ensureStorage() {
  if (!sightingsDirectory.exists) {
    sightingsDirectory.create({ idempotent: true, intermediates: true });
  }
  if (!sightingsIndex.exists) {
    sightingsIndex.create({ intermediates: true });
    sightingsIndex.write("[]");
  }
}

function photoExtension(uri: string) {
  const match = uri.match(/\.(jpe?g|png|heic|webp)(?:\?|$)/i);
  return match ? match[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

export class LocalSightingRepository implements SightingRepository {
  async list(): Promise<Sighting[]> {
    ensureStorage();
    try {
      return JSON.parse(await sightingsIndex.text()) as Sighting[];
    } catch {
      return [];
    }
  }

  async save(draft: NewSightingDraft): Promise<Sighting> {
    ensureStorage();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const source = new File(draft.sourcePhotoUri);
    const storedPhoto = new File(
      sightingsDirectory,
      `${id}.${photoExtension(draft.sourcePhotoUri)}`,
    );
    await source.copy(storedPhoto);

    const sighting: Sighting = {
      ...draft,
      id,
      photoUri: storedPhoto.uri,
      syncStatus: draft.visibility === "community" ? "pending-upload" : "local",
    };
    const sightings = await this.list();
    sightingsIndex.write(JSON.stringify([sighting, ...sightings]));
    return sighting;
  }
}

export const sightingRepository = new LocalSightingRepository();
