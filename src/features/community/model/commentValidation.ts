export const COMMENT_MAX = 300;

export function validateComment(text: string): string | null {
  const length = text.trim().length;

  if (length === 0) return "Write a comment first.";
  if (length > COMMENT_MAX) {
    return `Keep your comment to ${COMMENT_MAX} characters.`;
  }
  return null;
}
