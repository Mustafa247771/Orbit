import { File } from "expo-file-system";

type CloudinaryResponse = {
  secure_url?: string;
};

function config() {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const preset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();
  return cloudName && preset ? { cloudName, preset } : null;
}

export function photoUploadAvailable(): boolean {
  return config() !== null;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
};

function mimeFor(uri: string): string {
  const extension = uri.split(/[?#]/)[0].split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[extension] ?? "image/jpeg";
}

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const UPLOAD_TIMEOUT_MS = 60000;
const UNREADABLE = "Could not read that photo. Choose it again and retry.";
const TIMEOUT_FAILURE = "The photo upload timed out. Try again on a better connection.";
const GENERIC_FAILURE = "Photo upload failed. Try again.";
const NETWORK_FAILURE = "Could not upload the photo. Check your connection and try again.";
const TOO_LARGE = "That photo is too large to upload. Choose one under 10 MB.";

// Fixed, friendly wording only: Cloudinary's own error text is never shown.
function cloudinaryProblem(status: number): string {
  if (status === 400) return "Photo upload was rejected. Try a different photo.";
  if (status === 401 || status === 403) {
    return "Photo upload is not set up correctly. Try again later.";
  }
  if (status === 413) return TOO_LARGE;
  if (status === 420 || status === 429) {
    return "Too many photo uploads right now. Wait a moment and try again.";
  }
  if (status >= 500) return "The photo service is having trouble. Try again later.";
  return GENERIC_FAILURE;
}

class TimedOut extends Error {}

function debugWarn(stage: string, failure: unknown) {
  if (!__DEV__) return;
  const error = failure instanceof Error ? failure : new Error(String(failure));
  console.warn(`[PhotoUploader] ${stage}: ${error.name}: ${error.message}`);
}

export type UploadOptions = { folder: string; fileSize?: number };

export async function uploadPhoto(
  localUri: string,
  { folder, fileSize }: UploadOptions,
): Promise<string> {
  const settings = config();
  if (!settings) throw new Error("Photo upload is not set up in this build.");
  if (typeof fileSize === "number" && fileSize > MAX_PHOTO_BYTES) throw new Error(TOO_LARGE);

  // One deadline covers reading the file, sending it and reading the reply.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  const expired = new Promise<never>((_, reject) => {
    controller.signal.addEventListener("abort", () => reject(new TimedOut()));
  });
  expired.catch(() => {}); // Avoid an unhandled rejection when the race already settled.

  try {
    let body: string;
    try {
      // Sent as JSON with a data URI: React Native file parts in FormData are not
      // supported by the fetch that Expo installs globally, so no file part is used.
      const file = new File(localUri);
      if (file.size > MAX_PHOTO_BYTES) throw new Error(TOO_LARGE);
      if (file.size === 0) throw new Error(UNREADABLE);
      const base64 = await Promise.race([file.base64(), expired]);
      body = JSON.stringify({
        file: `data:${mimeFor(localUri)};base64,${base64}`,
        upload_preset: settings.preset,
        folder,
      });
    } catch (failure) {
      if (failure instanceof TimedOut) throw new Error(TIMEOUT_FAILURE);
      if (failure instanceof Error && (failure.message === TOO_LARGE || failure.message === UNREADABLE)) {
        throw failure;
      }
      debugWarn("read", failure);
      throw new Error(UNREADABLE);
    }

    let response: Response;
    let data: CloudinaryResponse = {};
    try {
      response = await fetch(
        `https://api.cloudinary.com/v1_1/${settings.cloudName}/image/upload`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body,
          signal: controller.signal,
        },
      );
      data = (await response.json().catch(() => {
        if (controller.signal.aborted) throw new TimedOut();
        return {}; // Non-JSON replies fall through to the status mapping below.
      })) as CloudinaryResponse;
    } catch (failure) {
      if (failure instanceof TimedOut || controller.signal.aborted) {
        throw new Error(TIMEOUT_FAILURE);
      }
      debugWarn("request", failure);
      throw new Error(NETWORK_FAILURE);
    }
    if (!response.ok) {
      if (__DEV__) console.warn(`[PhotoUploader] Cloudinary answered HTTP ${response.status}`);
      throw new Error(cloudinaryProblem(response.status));
    }
    if (typeof data?.secure_url !== "string" || !/^https:\/\//i.test(data.secure_url)) throw new Error(GENERIC_FAILURE);
    return data.secure_url;
  } finally {
    clearTimeout(timer);
  }
}
