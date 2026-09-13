import { ref, get, set } from "firebase/database";
import { realtimeDb } from "./firebase";

export async function ensureConversation(userId: string, otherUserId: string) {
  if (!userId || !otherUserId || userId === otherUserId) throw new Error("Invalid conversation");
  const id = [userId, otherUserId].sort().join("_");
  const conversationRef = ref(realtimeDb, `conversations/${id}`);
  const snapshot = await get(conversationRef);
  if (!snapshot.exists()) {
    await set(conversationRef, { memberIds: [userId, otherUserId], createdAt: Date.now(), updatedAt: Date.now() });
  }
  return id;
}
