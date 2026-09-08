import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export const usersCollection = collection(db, "users");
export const postsCollection = collection(db, "posts");
export const conversationsCollection = collection(db, "conversations");
export const notificationsCollection = collection(db, "notifications");
export const reportsCollection = collection(db, "reports");

export const conversationMessages = (conversationId: string) =>
  collection(db, "conversations", conversationId, "messages");

export async function ensureUserProfile(uid: string, data: Record<string, unknown>) {
  await setDoc(
    doc(db, "users", uid),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
