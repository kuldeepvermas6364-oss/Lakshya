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

function createFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  try {
    const required = [firebaseConfig.apiKey, firebaseConfig.authDomain, firebaseConfig.projectId, firebaseConfig.appId];
    if (required.some((value) => !value)) {
      console.warn("Lakshya Firebase: browser configuration is incomplete.");
      return null;
    }
    return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  } catch (error) {
    console.warn("Lakshya Firebase initialization skipped:", error);
    return null;
  }
}

export const firebaseApp = createFirebaseApp() as FirebaseApp;

function createBrowserAuth(): Auth {
  if (!firebaseApp) return null as unknown as Auth;
  try {
    return initializeAuth(firebaseApp, { persistence: browserLocalPersistence });
  } catch {
    try {
      return getAuth(firebaseApp);
    } catch (error) {
      console.warn("Lakshya Firebase Auth unavailable:", error);
      return null as unknown as Auth;
    }
  }
}

export const auth: Auth = createBrowserAuth();

function createService<T>(factory: () => T): T {
  try {
    if (!firebaseApp) return null as unknown as T;
    return factory();
  } catch (error) {
    console.warn("Lakshya Firebase service unavailable:", error);
    return null as unknown as T;
  }
}

export const db: Firestore = createService(() => getFirestore(firebaseApp));
export const storage: FirebaseStorage = createService(() => getStorage(firebaseApp));
export const realtimeDb: Database = createService(() => getDatabase(firebaseApp));
