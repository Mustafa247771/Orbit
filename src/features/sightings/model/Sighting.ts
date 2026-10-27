export type SightingVisibility = "private" | "community";

export const VISIBILITY_OPTIONS = [
  { value: "private", label: "Private" },
  { value: "community", label: "Community" },
] as const;

export type SightingLocation = {
  cityLabel: string;
  latitude: number;
  longitude: number;
};

export type Sighting = {
  id: string;
  objectId: string;
  objectName: string;
  caption: string;
  observedAt: string;
  photoUri: string;
  location: SightingLocation | null;
  visibility: SightingVisibility;
  syncStatus: "local" | "pending-upload";
};

export type NewSightingDraft = Omit<
  Sighting,
  "id" | "photoUri" | "syncStatus"
> & {
  sourcePhotoUri: string;
};
