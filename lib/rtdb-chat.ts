import {
  onValue,
  push,
  ref,
  serverTimestamp,
  set,
  update,
  type DataSnapshot,
} from "firebase/database";
import { realtimeDb } from "./firebase";

export type RealtimeMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: number | object | null;
  editedAt?: number | object | null;
};

const messagesPath = (conversationId: string) =>
  `conversations/${conversationId}/messages`;

export function subscribeToRealtimeMessages(
  conversationId: string,
  onChange: (messages: RealtimeMessage[]) => void,
) {
  const messagesRef = ref(realtimeDb, messagesPath(conversationId));
  return onValue(messagesRef, (snapshot: DataSnapshot) => {
    const value = snapshot.val() as Record<string, Omit<RealtimeMessage, "id">> | null;
    const messages = Object.entries(value ?? {})
      .map(([id, message]) => ({ id, ...message }))
      .sort((a, b) => Number(a.createdAt ?? 0) - Number(b.createdAt ?? 0));
    onChange(messages);
  });
}

export async function sendRealtimeMessage(
  conversationId: string,
  senderId: string,
  text: string,
) {
  const clean = text.trim();
  if (!clean) return null;

  const messageRef = push(ref(realtimeDb, messagesPath(conversationId)));
  await set(messageRef, {
    senderId,
    text: clean,
    createdAt: serverTimestamp(),
  });

  return messageRef.key;
}

export async function editRealtimeMessage(
  conversationId: string,
  messageId: string,
  text: string,
) {
  const clean = text.trim();
  if (!clean) return;
  await update(ref(realtimeDb, `${messagesPath(conversationId)}/${messageId}`), {
    text: clean,
    editedAt: serverTimestamp(),
  });
}
