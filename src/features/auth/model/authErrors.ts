const MESSAGES: Record<string, string> = {
  "google/configuration-missing":
    "Google sign-in is not configured yet. Please use email sign-in for now.",
  "google/native-build-required":
    "Google sign-in needs the updated app build. You can use email and password for now.",
  "google/mobile-only": "Google sign-in is available in the mobile app.",
  "google/no-token": "Google sign-in did not finish. Please try again.",
  PLAY_SERVICES_NOT_AVAILABLE: "Update Google Play services and try again.",
  DEVELOPER_ERROR:
    "Google sign-in is not configured correctly. Please try email sign-in.",
  ONE_TAP_START_FAILED: "Google sign-in could not start. Please try again.",
  IN_PROGRESS: "A sign-in request is already running. Please wait a moment.",
  "auth/account-exists-with-different-credential":
    "This email already uses another sign-in method. Please log in using that method.",
  "app/configuration-missing":
    "Sign-in is not configured yet. Add the Firebase app settings and reload the app.",
  "auth/invalid-api-key":
    "Sign-in is not configured correctly. Check the Firebase app settings.",
  "auth/app-not-authorized":
    "Sign-in is not available for this app yet. Check the Firebase project settings.",
  "auth/operation-not-allowed":
    "Email and password sign-in is not enabled yet. Enable it in Firebase Authentication.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/missing-password": "Enter your password.",
  "auth/invalid-credential": "The email or password is incorrect.",
  "auth/wrong-password": "The email or password is incorrect.",
  "auth/user-not-found": "The email or password is incorrect.",
  "auth/email-already-in-use":
    "An account already uses this email. Try signing in instead.",
  "auth/weak-password":
    "Choose a password that meets the password requirements.",
  "auth/network-request-failed":
    "We could not connect. Check your internet connection and try again.",
  "auth/too-many-requests":
    "There have been too many attempts. Please wait a little and try again.",
  "auth/user-disabled":
    "This account has been disabled. Please contact support.",
  "auth/requires-recent-login": "Please sign in again to continue.",
};

export function authErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : "";

  const message = MESSAGES[code];

  return typeof message === "string"
    ? message
    : "We could not complete that request. Please try again.";
}
