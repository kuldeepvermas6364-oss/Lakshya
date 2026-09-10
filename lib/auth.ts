import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

async function syncUserProfile(uid: string, data: Record<string, unknown>) {
  try {
    await setDoc(doc(db, "users", uid), data, { merge: true });
  } catch (error) {
    // Authentication must not fail just because the optional profile sync is unavailable.
    console.warn("Lakshya profile sync skipped:", error);
  }
}

export async function registerUser(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  try {
    await updateProfile(credential.user, { displayName: name.trim() });
  } catch (error) {
    console.warn("Lakshya display-name sync skipped:", error);
  }
  void syncUserProfile(credential.user.uid, {
    uid: credential.user.uid,
    displayName: name.trim(),
    email: email.trim().toLowerCase(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    role: "student",
    isOnline: true,
  });
  return credential.user;
}

export async function loginUser(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  void syncUserProfile(credential.user.uid, {
    isOnline: true,
    updatedAt: serverTimestamp(),
  });
  return credential.user;
}

export async function logoutUser() {
  const user = auth.currentUser;
  if (user) {
    void syncUserProfile(user.uid, { isOnline: false, updatedAt: serverTimestamp() });
  }
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
