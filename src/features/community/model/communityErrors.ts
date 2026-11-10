const MESSAGES: Record<string, string> = {
  "permission-denied": "You do not have permission to do that.",
  unavailable:
    "We could not reach the community. Check your connection and try again.",
  "deadline-exceeded": "That took too long. Please try again.",
  "resource-exhausted":
    "The community is busy right now. Please wait a little and try again.",
  unauthenticated: "Please sign in to use the community.",
  "not-found": "That post is no longer available.",
  "failed-precondition":
    "The community is still getting ready. Please try again in a few minutes.",
};

function errorCode(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return "";
  }
  const code = error.code;
  return typeof code === "string" ? code.replace(/^firestore\//, "") : "";
}

export function communityErrorMessage(error: unknown): string {
  return (
    MESSAGES[errorCode(error)] ??
    "We could not complete that request. Please try again."
  );
}
