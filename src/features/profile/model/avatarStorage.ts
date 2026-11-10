import { Directory, File, Paths } from "expo-file-system";

const avatarDirectory = new Directory(Paths.document, "avatars");

/** Copies a picked photo into the app's own storage and returns its new uri. */
export async function saveAvatar(
  uid: string,
  sourceUri: string,
): Promise<string> {
  if (!avatarDirectory.exists) {
    avatarDirectory.create({ idempotent: true, intermediates: true });
  }
  const stored = new File(avatarDirectory, `${uid}-${Date.now()}.jpg`);
  await new File(sourceUri).copy(stored);
  return stored.uri;
}

/** Removes an old avatar file. Never throws. */
export function deleteAvatar(uri: string | null) {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // An old file that cannot be removed is harmless.
  }
}
