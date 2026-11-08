import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform, TurboModuleRegistry } from "react-native";

type GoogleSDK = typeof import("react-native-nitro-google-signin");
let configured: Promise<GoogleSDK> | null = null;

function googleError(code: string) {
  return Object.assign(new Error("Google sign-in is unavailable."), { code });
}

async function googleClient(): Promise<GoogleSDK> {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    throw googleError("google/native-build-required");
  }
  if (Platform.OS !== "android" && Platform.OS !== "ios") {
    throw googleError("google/mobile-only");
  }

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  if (!webClientId?.endsWith(".apps.googleusercontent.com")) {
    throw googleError("google/configuration-missing");
  }

  // Check before importing the SDK, which initializes Nitro during module loading.
  if (!TurboModuleRegistry.get("NitroModules")) {
    throw googleError("google/native-build-required");
  }

  if (!configured) {
    configured = import("react-native-nitro-google-signin")
      .then((sdk) => {
        sdk.GoogleOneTapSignIn.configure({
          webClientId,
          offlineAccess: false,
          autoSelectOnSignIn: false,
        });
        return sdk;
      })
      .catch((error: unknown) => {
        configured = null;
        throw error;
      });
  }
  return configured;
}

export async function googleIdToken(): Promise<string | null> {
  const sdk = await googleClient();
  try {
    if (Platform.OS === "android") {
      await sdk.GoogleOneTapSignIn.checkPlayServices(true);
    }
    // An explicit chooser also prevents silent re-entry after app logout.
    const response = await sdk.GoogleOneTapSignIn.presentExplicitSignIn();
    if (sdk.isCancelledResponse(response)) return null;
    if (!sdk.isSuccessResponse(response) || !response.data.idToken) {
      throw googleError("google/no-token");
    }
    return response.data.idToken;
  } catch (error) {
    if (
      sdk.isErrorWithCode(error) &&
      error.code === sdk.statusCodes.SIGN_IN_CANCELLED
    ) {
      return null;
    }
    throw error;
  }
}

export async function clearGoogleSession(): Promise<void> {
  try {
    const sdk = await googleClient();
    await sdk.GoogleOneTapSignIn.signOut();
  } catch {
    // Native cleanup must not block Firebase logout. Sign-in always shows a chooser.
  }
}
