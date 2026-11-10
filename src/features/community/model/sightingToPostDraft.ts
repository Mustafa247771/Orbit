import type { Sighting } from "../../sightings/model/Sighting";
import type { PostDraft } from "./communityTypes.ts";

export function sightingToPostDraft(sighting: Sighting): PostDraft {
  const draft: PostDraft = {
    caption: sighting.caption,
    objectName: sighting.objectName,
    sightingId: sighting.id,
    photoUri: sighting.photoUri,
  };

  if (sighting.location) {
    draft.city = sighting.location.cityLabel;
    draft.latitude = sighting.location.latitude;
    draft.longitude = sighting.location.longitude;
  }

  const observedAt = Date.parse(sighting.observedAt);
  if (Number.isFinite(observedAt)) draft.observedAt = observedAt;

  return draft;
}
