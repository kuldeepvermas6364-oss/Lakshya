import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  RecaptchaVerifier,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile,
  type ConfirmationResult,
  type User,
} from "firebase/auth";
import { get, ref, serverTimestamp, set, update } from "firebase/database";
import { auth, realtimeDb } from "./firebase";
import { validateEmail, validateFullName } from "./validation";

async function syncUserProfile(uid: string, data: Record<string, unknown>) {
  try { await update(ref(realtimeDb, `users/${uid}`), data); }
  catch (error) { console.warn("Lakshya profile sync skipped:", error); }
}

function assertCredentials(name: string | undefined, email: string, password: string, registering: boolean) {
  const emailResult = validateEmail(email);
  if (!emailResult.ok) throw new Error(emailResult.error);
  if (registering) {
    const nameResult = validateFullName(name ?? "");
    if (!nameResult.ok) throw new Error(nameResult.error);
  }
  if (typeof password !== "string" || password.length < 6 || password.length > 128) {
    throw new Error("Password must be between 6 and 128 characters.");
  }
}

export async function registerUser(name: string, email: string, password: string) {
  assertCredentials(name, email, password, true);
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim().replace(/\s+/g, " ");
  const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
  await updateProfile(credential.user, { displayName: normalizedName });
  await set(ref(realtimeDb, `users/${credential.user.uid}`), {
    uid: credential.user.uid, displayName: normalizedName, email: normalizedEmail,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(), role: "student", isOnline: true,
    onboardingComplete: false,
  });
  return credential.user;
}

export async function loginUser(email: string, password: string) {
  assertCredentials(undefined, email, password, false);
  const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  void syncUserProfile(credential.user.uid, { isOnline: true, updatedAt: serverTimestamp() });
  return credential.user;
}

export async function loginWithGoogle() {
  const credential = await signInWithPopup(auth, new GoogleAuthProvider());
  void syncUserProfile(credential.user.uid, {
    uid: credential.user.uid,
    displayName: credential.user.displayName ?? "Lakshya Student",
    email: credential.user.email ?? "",
    photoURL: credential.user.photoURL ?? "",
    role: "student",
    isOnline: true,
    updatedAt: serverTimestamp(),
  });
  return credential.user;
}

export function createPhoneVerifier(containerId: string) {
  return new RecaptchaVerifier(auth, containerId, { size: "invisible" });
}

export async function requestPhoneCode(phone: string, verifier: RecaptchaVerifier): Promise<ConfirmationResult> {
  const normalizedPhone = phone.trim();
  if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
    throw new Error("Enter your phone number with country code, for example +919876543210.");
  }
  return signInWithPhoneNumber(auth, normalizedPhone, verifier);
}

export async function verifyPhoneCode(confirmation: ConfirmationResult, code: string) {
  const normalizedCode = code.trim();
  if (!/^\d{6}$/.test(normalizedCode)) {
    throw new Error("Enter the 6-digit verification code.");
  }
  const credential = await confirmation.confirm(normalizedCode);
  void syncUserProfile(credential.user.uid, {
    uid: credential.user.uid,
    phoneNumber: credential.user.phoneNumber ?? "",
    displayName: credential.user.displayName ?? "Lakshya Student",
    role: "student",
    isOnline: true,
    updatedAt: serverTimestamp(),
  });
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

export async function getUserProfile(uid: string) {
  const snapshot = await get(ref(realtimeDb, `users/${uid}`));
  return snapshot.exists() ? (snapshot.val() as Record<string, unknown>) : null;
}

export function subscribeToAuth(callback: (user: User | null) => void) { return onAuthStateChanged(auth, callback); }
