import { File } from "expo-file-system";

/** True for a photo stored on this phone (older versions kept avatars locally). */
export function isLocalAvatar(uri: string | null): uri is string {
  return !!uri && !/^https?:\/\//i.test(uri);
}

/**
 * Removes an old avatar file from this phone. Never throws, and ignores
 * account photos hosted online (unsigned uploads cannot be deleted from there).
 */
export function deleteAvatar(uri: string | null) {
  if (!isLocalAvatar(uri)) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // An old file that cannot be removed is harmless.
  }
}
