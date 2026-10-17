import { getApps, getApp, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, browserLocalPersistence, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getDatabase, type Database } from "firebase/database";
import { getFirestore, type Firestore } from "firebase/firestore";

const configuredFirebase = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

export const firebaseConfigured = [
  configuredFirebase.apiKey,
  configuredFirebase.authDomain,
  configuredFirebase.projectId,
  configuredFirebase.appId,
  configuredFirebase.databaseURL,
].every(Boolean);

const firebaseConfig = firebaseConfigured ? configuredFirebase : {
  apiKey: "missing-firebase-config",
  authDomain: "localhost",
  projectId: "lakshya-unconfigured",
  storageBucket: "lakshya-unconfigured.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000",
  databaseURL: "https://lakshya-unconfigured-default-rtdb.firebaseio.com",
};

function createFirebaseApp(): FirebaseApp {
  try {
    return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Lakshya Firebase initialization failed:", error);
    throw error;
  }
}

export const firebaseApp = createFirebaseApp();

function createAuth(): Auth {
  if (typeof window !== "undefined") {
    try {
      return initializeAuth(firebaseApp, { persistence: browserLocalPersistence });
    } catch {
      return getAuth(firebaseApp);
    }
  }
  return getAuth(firebaseApp);
}

export const auth: Auth = createAuth();
export const storage: FirebaseStorage = getStorage(firebaseApp);
export const realtimeDb: Database = getDatabase(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);
