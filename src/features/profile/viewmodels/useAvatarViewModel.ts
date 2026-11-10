import * as ImagePicker from "expo-image-picker";
import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";

import { useAuthSession } from "@/features/auth/viewmodels/AuthProvider";
import { photoUploadAvailable, uploadPhoto } from "@/core/media/PhotoUploader";
import { deleteAvatar } from "../model/avatarStorage";
import { useAccountProfile } from "./ProfileProvider";

const PICKER_OPTIONS = {
  allowsEditing: true,
  aspect: [1, 1] as [number, number],
  exif: false,
  mediaTypes: ["images"] as ImagePicker.MediaType[],
  quality: 0.7,
};

const CAMERA_DENIED =
  "Camera access is off. Please allow it in your phone's Settings to take a profile photo.";
const PHOTO_FAILED = "We could not update your photo. Please try again.";
const UPLOAD_UNAVAILABLE =
  "Profile photos are not set up in this build, so your current photo was kept.";
const AVATAR_FOLDER = "orbit/avatars";

export function useAvatarViewModel() {
  const { user } = useAuthSession();
  const { profile, setPhotoUri } = useAccountProfile();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);

  const photoUri = profile?.photoUri ?? null;

  const run = useCallback(async (task: () => Promise<void>) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch {
      setError(PHOTO_FAILED);
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, []);

  const pick = useCallback(
    (source: "camera" | "library") =>
      run(async () => {
        const camera = source === "camera";
        // The system photo picker needs no library permission.
        if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) {
          setError(CAMERA_DENIED);
          return;
        }
        const result = camera
          ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
          : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
        if (result.canceled || !result.assets[0] || !user) return;

        if (!photoUploadAvailable()) {
          setError(UPLOAD_UNAVAILABLE);
          return;
        }

        // The photo is hosted online, so the https link follows the account to
        // every device. The old photo is kept if the upload or the save fails.
        const asset = result.assets[0];
        let hosted: string;
        try {
          hosted = await uploadPhoto(asset.uri, {
            folder: AVATAR_FOLDER,
            fileSize: asset.fileSize,
          });
        } catch (failure) {
          setError(
            failure instanceof Error && failure.message ? failure.message : PHOTO_FAILED,
          );
          return;
        }

        if (!(await setPhotoUri(hosted))) {
          setError(PHOTO_FAILED);
          return;
        }
        deleteAvatar(photoUri);
      }),
    [photoUri, run, setPhotoUri, user],
  );

  const remove = useCallback(
    () =>
      run(async () => {
        if (!(await setPhotoUri(null))) {
          setError(PHOTO_FAILED);
          return;
        }
        deleteAvatar(photoUri);
      }),
    [photoUri, run, setPhotoUri],
  );

  const changePhoto = useCallback(() => {
    Alert.alert("Profile photo", undefined, [
      { text: "Take photo", onPress: () => void pick("camera") },
      { text: "Choose from library", onPress: () => void pick("library") },
      ...(photoUri
        ? [
            {
              text: "Remove photo",
              style: "destructive" as const,
              onPress: () => void remove(),
            },
          ]
        : []),
      { text: "Cancel", style: "cancel" as const },
    ]);
  }, [photoUri, pick, remove]);

  return { photoUri, busy, error, changePhoto };
}
