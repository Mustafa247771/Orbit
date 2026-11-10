const FOLDER = "orbit/community";

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

function photoPart(uri: string) {
  const extension = uri.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
  const ext = extension && /^[a-z0-9]{3,4}$/.test(extension) ? extension : "jpg";
  const type = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  return { uri, name: `photo.${ext}`, type };
}

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

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

export async function uploadPostPhoto(localUri: string, fileSize?: number): Promise<string> {
  const settings = config();
  if (!settings) throw new Error("Photo upload is not set up in this build.");
  if (typeof fileSize === "number" && fileSize > MAX_PHOTO_BYTES) throw new Error(TOO_LARGE);

  const form = new FormData();
  form.append("file", photoPart(localUri) as unknown as Blob);
  form.append("upload_preset", settings.preset);
  form.append("folder", FOLDER);

  // The timer covers the body too, so a stalled response cannot hang forever.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    let response: Response;
    let data: CloudinaryResponse = {};
    try {
      response = await fetch(
        `https://api.cloudinary.com/v1_1/${settings.cloudName}/image/upload`,
        { method: "POST", body: form, signal: controller.signal },
      );
      data = (await response.json().catch(() => {
        if (controller.signal.aborted) throw new Error(NETWORK_FAILURE);
        return {}; // Non-JSON replies fall through to the status mapping below.
      })) as CloudinaryResponse;
    } catch {
      throw new Error(NETWORK_FAILURE);
    }
    if (!response.ok) throw new Error(cloudinaryProblem(response.status));
    if (typeof data?.secure_url !== "string" || !data.secure_url) throw new Error(GENERIC_FAILURE);
    return data.secure_url;
  } finally {
    clearTimeout(timer);
  }
}
