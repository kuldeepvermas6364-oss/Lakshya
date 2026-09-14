import { get, push, ref, remove, update } from "firebase/database";
import { realtimeDb } from "./firebase";

export type FriendRequestStatus = "pending" | "accepted" | "declined";

type FriendRequestRow = {
  id: string;
  fromId?: string;
  toId?: string;
  status?: FriendRequestStatus;
  createdAt?: number;
  respondedAt?: number;
};

const requestsRef = () => ref(realtimeDb, "friendRequests");
const friendshipsRef = () => ref(realtimeDb, "friendships");

export async function sendFriendRequest(fromId: string, toId: string) {
  if (!fromId || !toId || fromId === toId) throw new Error("Invalid friendship request");
  const request = push(requestsRef());
  await update(ref(realtimeDb), {
    [`friendRequests/${request.key}`]: { fromId, toId, status: "pending" satisfies FriendRequestStatus, createdAt: Date.now() },
  });
  return request;
}

export async function respondToFriendRequest(requestId: string, currentUserId: string, fromId: string, status: Extract<FriendRequestStatus, "accepted" | "declined">) {
  if (!requestId || !currentUserId || !fromId) throw new Error("Invalid friendship request");
  const updates: Record<string, unknown> = {
    [`friendRequests/${requestId}/status`]: status,
    [`friendRequests/${requestId}/respondedAt`]: Date.now(),
  };
  if (status === "accepted") {
    const friendshipId = [currentUserId, fromId].sort().join("_");
    updates[`friendships/${friendshipId}`] = { memberIds: [currentUserId, fromId], createdAt: Date.now() };
  }
  await update(ref(realtimeDb), updates);
}

export async function removeFriend(userId: string, friendId: string) {
  const friendshipId = [userId, friendId].sort().join("_");
  await remove(ref(realtimeDb, `friendships/${friendshipId}`));
}

export async function listFriendRequests(userId: string, maxResults = 50) {
  if (!userId) throw new Error("Sign in required");
  const snap = await get(requestsRef());
  const all = snap.exists() ? (snap.val() as Record<string, Omit<FriendRequestRow, "id">>) : {};
  const rows: FriendRequestRow[] = Object.entries(all).map(([id, value]) => ({ id, ...value }));
  const pendingRows = rows.filter((item) => item.status === "pending");
  const incoming = pendingRows.filter((item) => item.toId === userId).sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0)).slice(0, maxResults);
  const outgoing = pendingRows.filter((item) => item.fromId === userId).sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0)).slice(0, maxResults);
  return { incoming, outgoing };
}
