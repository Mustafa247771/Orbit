import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  validatePassword,
  type Unsubscribe,
  type User,
} from "firebase/auth";

import { getFirebaseAuth } from "@/core/firebase/client";
import { clearGoogleSession, googleIdToken } from "./GoogleSignInService";

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
};

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
  };
}

export function observeAuthState(
  onChange: (user: AuthUser | null) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  return onAuthStateChanged(
    getFirebaseAuth(),
    (user) => onChange(user ? toAuthUser(user) : null),
    onError,
  );
}

export async function createAccount(
  email: string,
  password: string,
): Promise<AuthUser> {
  const result = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  );

  return toAuthUser(result.user);
}

export async function logIn(
  email: string,
  password: string,
): Promise<AuthUser> {
  const result = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  );

  return toAuthUser(result.user);
}

export async function logOut(): Promise<void> {
  const auth = getFirebaseAuth();
  const usedGoogle = auth.currentUser?.providerData.some(
    (provider) => provider.providerId === "google.com",
  );
  if (usedGoogle) await clearGoogleSession();
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
}

export async function newPasswordError(
  password: string,
): Promise<string | null> {
  const status = await validatePassword(getFirebaseAuth(), password);
  if (status.isValid) return null;

  const rules = status.passwordPolicy.customStrengthOptions;
  const missing: string[] = [];
  if (status.meetsMinPasswordLength === false) {
    missing.push("at least " + (rules.minPasswordLength ?? 6) + " characters");
  }
  if (status.meetsMaxPasswordLength === false) {
    missing.push(
      "no more than " + (rules.maxPasswordLength ?? 4096) + " characters",
    );
  }
  if (status.containsLowercaseLetter === false)
    missing.push("a lowercase letter");
  if (status.containsUppercaseLetter === false)
    missing.push("an uppercase letter");
  if (status.containsNumericCharacter === false) missing.push("a number");
  if (status.containsNonAlphanumericCharacter === false)
    missing.push("a symbol");

  return missing.length
    ? "Use " + missing.join(", ") + "."
    : "Choose a password that meets the password requirements.";
}

export async function logInWithGoogle(): Promise<AuthUser | null> {
  const token = await googleIdToken();
  if (!token) return null;
  const credential = GoogleAuthProvider.credential(token);
  const result = await signInWithCredential(getFirebaseAuth(), credential);
  return toAuthUser(result.user);
}
