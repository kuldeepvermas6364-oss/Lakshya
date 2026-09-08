import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function ensureConversation(userId: string, otherUserId: string) {
  if (!userId || !otherUserId || userId === otherUserId) throw new Error("Invalid conversation");
  const id = [userId, otherUserId].sort().join("_");
  const conversationRef = doc(db, "conversations", id);
  const snapshot = await getDoc(conversationRef);
  if (!snapshot.exists()) {
    await setDoc(conversationRef, {
      memberIds: [userId, otherUserId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  return id;
}
