import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { validateEmail, validateUsername } from "./validation";

async function syncUserProfile(uid: string, data: Record<string, unknown>) {
  try {
    await setDoc(doc(db, "users", uid), data, { merge: true });
  } catch (error) {
    console.warn("Lakshya profile sync skipped:", error);
  }
}

function assertCredentials(name: string | undefined, email: string, password: string, registering: boolean) {
  const emailResult = validateEmail(email);
  if (!emailResult.ok) throw new Error(emailResult.error);
  if (registering) {
    const nameResult = validateUsername(name ?? "");
    if (!nameResult.ok) throw new Error("Name is required and must be 3–30 characters.");
  }
  if (typeof password !== "string" || password.length < 6 || password.length > 128) {
    throw new Error("Password must be between 6 and 128 characters.");
  }
}

export async function registerUser(name: string, email: string, password: string) {
  assertCredentials(name, email, password, true);
  const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  try {
    await updateProfile(credential.user, { displayName: name.trim() });
  } catch (error) {
    console.warn("Lakshya display-name sync skipped:", error);
  }
  await syncUserProfile(credential.user.uid, {
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
  assertCredentials(undefined, email, password, false);
  const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  void syncUserProfile(credential.user.uid, { isOnline: true, updatedAt: serverTimestamp() });
  return credential.user;
}

export async function resetPassword(email: string) {
  const result = validateEmail(email);
  if (!result.ok) throw new Error(result.error);
  await sendPasswordResetEmail(auth, result.value.toLowerCase());
}

export async function logoutUser() {
  const user = auth.currentUser;
  if (user) void syncUserProfile(user.uid, { isOnline: false, updatedAt: serverTimestamp() });
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
