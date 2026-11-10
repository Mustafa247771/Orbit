import * as ImagePicker from "expo-image-picker";
import { useCallback, useState, type RefObject } from "react";

import { communityErrorMessage } from "../model/communityErrors";
import { MAX_PHOTO_BYTES } from "../model/PhotoUploader";

export function usePhotoPicker(
  busyRef: RefObject<boolean>,
  generationRef: RefObject<number>,
  setError: (message: string | null) => void,
  onPicked: () => void,
) {
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [picking, setPicking] = useState(false);
  const reset = useCallback(() => {
    setAsset(null);
    setPicking(false);
  }, []);
  const pick = async (camera: boolean) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setPicking(true);
    setError(null);
    const token = generationRef.current;
    try {
      const permission = camera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (token !== generationRef.current) return;
      if (!permission.granted) {
        setError(
          `Allow ${camera ? "camera" : "photo library"} access in your phone settings to attach a photo.`,
        );
        return;
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.8 };
      const result = camera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (token !== generationRef.current || result.canceled || !result.assets[0]) return;
      const picked = result.assets[0];
      if (picked.fileSize !== undefined && picked.fileSize > MAX_PHOTO_BYTES) {
        setError("That photo is too large to upload. Choose a smaller one.");
        return;
      }
      setAsset(picked);
      onPicked();
    } catch (failure) {
      if (token === generationRef.current) setError(communityErrorMessage(failure));
    } finally {
      if (token === generationRef.current) {
        busyRef.current = false;
        setPicking(false);
      }
    }
  };
  return { asset, picking, reset, pick };
}
