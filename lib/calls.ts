import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type CallKind = "audio" | "video";
export type CallStatus = "initiated" | "accepted" | "declined" | "missed" | "ended";

export type CallRecord = {
  id: string;
  roomName: string;
  callerId: string;
  receiverId: string;
  kind: CallKind;
  status: CallStatus;
  createdAt?: unknown;
  endedAt?: unknown;
};

export async function createCall(callerId: string, receiverId: string, kind: CallKind) {
  if (!callerId || !receiverId || callerId === receiverId) throw new Error("Invalid call participants");
  const roomName = `lakshya-${[callerId, receiverId].sort().join("-")}-${Date.now()}`;
  const callRef = await addDoc(collection(db, "calls"), {
    roomName,
    callerId,
    receiverId,
    kind,
    status: "initiated" satisfies CallStatus,
    createdAt: serverTimestamp(),
  });
  return { id: callRef.id, roomName, callerId, receiverId, kind, status: "initiated" as const };
}

export async function getRecentCalls(userId: string, maxResults = 30) {
  if (!userId) return [] as CallRecord[];
  const snap = await getDocs(query(collection(db, "calls"), orderBy("createdAt", "desc"), limit(maxResults)));
  return snap.docs
    .map((item) => ({ id: item.id, ...item.data() }) as CallRecord)
    .filter((call) => call.callerId === userId || call.receiverId === userId);
}

export async function requestCallToken(roomName: string, participantName: string, identity: string) {
  const response = await fetch("/api/calling/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomName, participantName, identity }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Unable to create call token");
  }
  return response.json() as Promise<{ token: string; wsUrl: string }>;
}
