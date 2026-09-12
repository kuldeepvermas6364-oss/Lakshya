import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";

export function waitForAuth(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export async function requireUser(): Promise<User> {
  const user = auth.currentUser ?? (await waitForAuth());
  if (!user) throw new Error("AUTH_REQUIRED");
  return user;
}

export function isAuthRequiredError(error: unknown): boolean {
  return error instanceof Error && error.message === "AUTH_REQUIRED";
}
