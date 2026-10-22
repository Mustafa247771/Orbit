import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useCallback, useMemo, useState } from "react";

import { sightingRepository } from "@/features/sightings/model/LocalSightingRepository";
import type {
  SightingLocation,
  SightingVisibility,
} from "@/features/sightings/model/Sighting";

const OBJECT = { id: "25544", name: "International Space Station" };

function readableError(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export function useNewSightingViewModel() {
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<SightingVisibility>("private");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<SightingLocation | null>(null);
  const [observedAt, setObservedAt] = useState(() => new Date());
  const [busyAction, setBusyAction] = useState<
    "camera" | "library" | "location" | "save" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const observedLabel = useMemo(
    () =>
      observedAt.toLocaleString([], {
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        month: "short",
      }),
    [observedAt],
  );

  const acceptPickerResult = useCallback(
    (result: ImagePicker.ImagePickerResult) => {
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        setObservedAt(new Date());
        setError(null);
      }
    },
    [],
  );

  const takePhoto = useCallback(async () => {
    setBusyAction("camera");
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted)
        throw new Error("Camera permission is required to capture a sighting.");
      acceptPickerResult(
        await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          exif: false,
          mediaTypes: ["images"],
          quality: 0.85,
        }),
      );
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setBusyAction(null);
    }
  }, [acceptPickerResult]);

  const choosePhoto = useCallback(async () => {
    setBusyAction("library");
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted)
        throw new Error(
          "Photo-library permission is required to choose a sighting.",
        );
      acceptPickerResult(
        await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [4, 3],
          exif: false,
          mediaTypes: ["images"],
          quality: 0.85,
        }),
      );
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setBusyAction(null);
    }
  }, [acceptPickerResult]);

  const useCurrentLocation = useCallback(async () => {
    setBusyAction("location");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted)
        throw new Error(
          "Location permission is required to attach your observing location.",
        );
      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const addresses = await Location.reverseGeocodeAsync(result.coords);
      const address = addresses[0];
      const cityLabel =
        [
          address?.city ?? address?.district ?? address?.region,
          address?.country,
        ]
          .filter(Boolean)
          .join(", ") || "Current location";
      setLocation({
        cityLabel,
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      });
      setError(null);
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setBusyAction(null);
    }
  }, []);

  const save = useCallback(async () => {
    if (!photoUri) {
      setError("Add a photo before saving this sighting.");
      return null;
    }
    if (!location) {
      setError("Attach your current location before saving this sighting.");
      return null;
    }

    setBusyAction("save");
    try {
      const saved = await sightingRepository.save({
        caption: caption.trim(),
        location,
        objectId: OBJECT.id,
        objectName: OBJECT.name,
        observedAt: observedAt.toISOString(),
        sourcePhotoUri: photoUri,
        visibility,
      });
      setCaption("");
      setPhotoUri(null);
      setLocation(null);
      setVisibility("private");
      setObservedAt(new Date());
      setError(null);
      return saved;
    } catch (caught) {
      setError(readableError(caught));
      return null;
    } finally {
      setBusyAction(null);
    }
  }, [caption, location, observedAt, photoUri, visibility]);

  return {
    busyAction,
    caption,
    choosePhoto,
    error,
    location,
    object: OBJECT,
    observedLabel,
    photoUri,
    save,
    setCaption,
    setVisibility,
    takePhoto,
    useCurrentLocation,
    visibility,
  };
}
