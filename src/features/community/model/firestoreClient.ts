import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseApp } from "@/core/firebase/client";

let db: Firestore | undefined;

export function getDb(): Firestore {
  if (db) return db;
  const app = getFirebaseApp();
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
