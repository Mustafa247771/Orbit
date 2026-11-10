import type { PostDraft } from "./communityTypes.ts";

export const CAPTION_MIN = 3;
export const CAPTION_MAX = 500;
export const OBJECT_NAME_MIN = 2;
export const OBJECT_NAME_MAX = 40;
export const POST_COOLDOWN_MS = 10_000;

export type PostErrors = Partial<Record<"caption" | "objectName", string>>;

export function validatePostDraft(draft: PostDraft): PostErrors {
  const errors: PostErrors = {};
  const caption = draft.caption.trim().length;
  const objectName = draft.objectName.trim().length;

  if (caption === 0) {
    errors.caption = "Write a few words about what you saw.";
  } else if (caption < CAPTION_MIN) {
    errors.caption = `Use at least ${CAPTION_MIN} characters.`;
  } else if (caption > CAPTION_MAX) {
    errors.caption = `Keep your caption to ${CAPTION_MAX} characters.`;
  }

  if (objectName === 0) {
    errors.objectName = "Name what you observed.";
  } else if (objectName < OBJECT_NAME_MIN) {
    errors.objectName = `Use at least ${OBJECT_NAME_MIN} characters.`;
  } else if (objectName > OBJECT_NAME_MAX) {
    errors.objectName = `Keep the name to ${OBJECT_NAME_MAX} characters.`;
  }

  return errors;
}

export function canPostAgain(lastPostAt: number | null, now: number): boolean {
  return lastPostAt === null || now - lastPostAt >= POST_COOLDOWN_MS;
}
