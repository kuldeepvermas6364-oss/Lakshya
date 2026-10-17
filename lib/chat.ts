import { addDoc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { conversationMessages } from "./firestore";

export function subscribeToMessages(conversationId: string, onChange: (messages: unknown[]) => void) {
  const q = query(conversationMessages(conversationId), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  });
}

export async function sendMessage(conversationId: string, senderId: string, text: string) {
  const clean = text.trim();
  if (!clean) return;
  await addDoc(conversationMessages(conversationId), {
    senderId,
    text: clean,
    createdAt: serverTimestamp(),
  });
}
