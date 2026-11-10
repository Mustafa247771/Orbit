import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseApp, getFirebaseAuth } from "@/core/firebase/client";

let db: Firestore | undefined;

// One Firestore instance for the whole app.
export function getDb(): Firestore {
  if (db) return db;
  const app = getFirebaseApp();
  // Auth first, so Firestore signs its requests with the persisted session.
  getFirebaseAuth();
  try {
    db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch (error) {
    if (
      typeof error !== "object" ||
      error === null ||
      !("code" in error) ||
      error.code !== "failed-precondition"
    )
      throw error;
    db = getFirestore(app);
  }
  return db;
}
