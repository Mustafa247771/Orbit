import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  signInWithCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
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
  photoURL: string | null;
  createdAt: string | null;
};

function creationDate(user: User): string | null {
  const created = user.metadata.creationTime;
  if (!created) return null;
  const date = new Date(created);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    photoURL: user.photoURL,
    createdAt: creationDate(user),
  };
}

// The signed-in user as Firebase holds it right now, or null.
export function currentAuthUser(): AuthUser | null {
  const user = getFirebaseAuth().currentUser;

  return user ? toAuthUser(user) : null;
}

export async function updateDisplayName(name: string): Promise<AuthUser> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("No signed-in user.");
  await updateProfile(user, { displayName: name.trim() });

  return toAuthUser(user);
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
    missing.push(`at least ${rules.minPasswordLength ?? 6} characters`);
  }
  if (status.meetsMaxPasswordLength === false) {
    missing.push(
      `no more than ${rules.maxPasswordLength ?? 4096} characters`,
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
    ? `Use ${missing.join(", ")}.`
    : "Choose a password that meets the password requirements.";
}

export async function logInWithGoogle(): Promise<AuthUser | null> {
  const token = await googleIdToken();
  if (!token) return null;
  const credential = GoogleAuthProvider.credential(token);
  const result = await signInWithCredential(getFirebaseAuth(), credential);
  return toAuthUser(result.user);
}

function hasProvider(user: User | null, providerId: string): boolean {
  return !!user?.providerData.some((item) => item.providerId === providerId);
}

// How the signed-in user proves who they are again: password, Google, or unknown.
export function signInMethod(): "password" | "google" | null {
  const user = getFirebaseAuth().currentUser;
  if (hasProvider(user, "password")) return "password";
  if (hasProvider(user, "google.com")) return "google";

  return null;
}

export async function reauthenticateWithPassword(
  password: string,
): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user?.email) throw new Error("No signed-in user.");
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
}

// Returns false when the person closes the Google chooser.
export async function reauthenticateWithGoogle(): Promise<boolean> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("No signed-in user.");
  const token = await googleIdToken();
  if (!token) return false;
  await reauthenticateWithCredential(user, GoogleAuthProvider.credential(token));

  return true;
}

export async function deleteAccount(): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("No signed-in user.");
  const usedGoogle = hasProvider(user, "google.com");
  await deleteUser(user);
  if (!usedGoogle) return;
  try {
    await clearGoogleSession();
  } catch {
    // The account is already deleted, so a leftover Google session is harmless.
  }
}
