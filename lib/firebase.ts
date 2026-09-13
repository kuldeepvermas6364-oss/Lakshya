import { getApps, getApp, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, browserLocalPersistence, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getDatabase, type Database } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

const hasRequiredConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
].every(Boolean);

/**
 * Firebase must be initialized at module level as well as in the browser.
 * The old implementation returned null during SSR and exported that null as
 * FirebaseApp, which could later reach Firebase Auth and cause the runtime
 * error: "Cannot read properties of null (reading 'app')".
 */
function createFirebaseApp(): FirebaseApp {
  if (!hasRequiredConfig) {
    throw new Error(
      "Lakshya Firebase configuration is missing. Check the NEXT_PUBLIC_FIREBASE_* environment variables."
    );
  }

  try {
    return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Lakshya Firebase initialization failed:", error);
    throw error;
  }
}

export const firebaseApp = createFirebaseApp();

function createAuth(): Auth {
  // On the browser, prefer explicit local persistence. On SSR, getAuth is
  // enough and avoids browser-only persistence initialization.
  if (typeof window !== "undefined") {
    try {
      return initializeAuth(firebaseApp, { persistence: browserLocalPersistence });
    } catch {
      // Auth may already have been initialized by another module/HMR cycle.
      return getAuth(firebaseApp);
    }
  }
  return getAuth(firebaseApp);
}

export const auth: Auth = createAuth();
export const db: Firestore = getFirestore(firebaseApp);
export const storage: FirebaseStorage = getStorage(firebaseApp);
export const realtimeDb: Database = getDatabase(firebaseApp);
