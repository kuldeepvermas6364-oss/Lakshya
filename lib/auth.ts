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

export async function registerUser(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(credential.user, { displayName: name.trim() });
  await setDoc(
    doc(db, "users", credential.user.uid),
    {
      uid: credential.user.uid,
      displayName: name.trim(),
      email: email.trim().toLowerCase(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      role: "student",
      isOnline: true,
    },
    { merge: true },
  );
  return credential.user;
}

export async function loginUser(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  await setDoc(doc(db, "users", credential.user.uid), { isOnline: true, updatedAt: serverTimestamp() }, { merge: true });
  return credential.user;
}

export async function logoutUser() {
  if (auth.currentUser) {
    await setDoc(doc(db, "users", auth.currentUser.uid), { isOnline: false, updatedAt: serverTimestamp() }, { merge: true });
  }
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
