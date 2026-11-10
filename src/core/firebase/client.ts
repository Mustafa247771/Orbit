import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";

import { errorCode } from "@/features/auth/model/authErrors";

// Firebase exposes this function in its native bundle, but omits it from
// the shared TypeScript declarations. Keep that typing bridge local.
const { getReactNativePersistence } = FirebaseAuth as typeof FirebaseAuth & {
  getReactNativePersistence(
    storage: typeof AsyncStorage,
  ): FirebaseAuth.Persistence;
};

let app: FirebaseApp | undefined;
let auth: FirebaseAuth.Auth | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;

  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };

  if (Object.values(config).some((value) => !value?.trim())) {
    throw Object.assign(new Error("Firebase app configuration is missing."), {
      code: "app/configuration-missing",
    });
  }

  app = getApps().some((candidate) => candidate.name === "[DEFAULT]")
    ? getApp()
    : initializeApp(config);

  return app;
}

export function getFirebaseAuth(): FirebaseAuth.Auth {
  if (auth) return auth;

  const firebaseApp = getFirebaseApp();

  try {
    auth = FirebaseAuth.initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // Fast Refresh can reuse an Auth instance from the previous module.
    if (errorCode(error) === "auth/already-initialized") {
      auth = FirebaseAuth.getAuth(firebaseApp);
    } else {
      throw error;
    }
  }

  return auth;
}
