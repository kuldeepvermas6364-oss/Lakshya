import { getApps, getApp, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase client services must not be initialized while Next.js is prerendering
// server components. This keeps builds safe while still initializing the real
// Firebase services in the browser where authentication is used.
export const firebaseApp: FirebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

export const auth: Auth =
  typeof window !== "undefined"
    ? getAuth(firebaseApp)
    : (null as unknown as Auth);

export const db: Firestore =
  typeof window !== "undefined"
    ? getFirestore(firebaseApp)
    : (null as unknown as Firestore);

export const storage: FirebaseStorage =
  typeof window !== "undefined"
    ? getStorage(firebaseApp)
    : (null as unknown as FirebaseStorage);
