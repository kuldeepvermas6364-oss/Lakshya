import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

export type FriendRequestStatus = "pending" | "accepted" | "declined";

export async function sendFriendRequest(fromId: string, toId: string) {
  if (!fromId || !toId || fromId === toId) throw new Error("Invalid friendship request");
  return addDoc(collection(db, "friendRequests"), {
    fromId,
    toId,
    status: "pending" satisfies FriendRequestStatus,
    createdAt: serverTimestamp(),
  });
}

export async function respondToFriendRequest(
  requestId: string,
  currentUserId: string,
  fromId: string,
  status: Extract<FriendRequestStatus, "accepted" | "declined">,
) {
  const batch = writeBatch(db);
  batch.update(doc(db, "friendRequests", requestId), {
    status,
    respondedAt: serverTimestamp(),
  });

  if (status === "accepted") {
    const friendshipId = [currentUserId, fromId].sort().join("_");
    batch.set(doc(db, "friendships", friendshipId), {
      memberIds: [currentUserId, fromId],
      createdAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function removeFriend(userId: string, friendId: string) {
  const friendshipId = [userId, friendId].sort().join("_");
  await deleteDoc(doc(db, "friendships", friendshipId));
}

export async function listFriendRequests(userId: string, maxResults = 50) {
  const incoming = query(
    collection(db, "friendRequests"),
    where("toId", "==", userId),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc"),
    limit(maxResults),
  );
  const outgoing = query(
    collection(db, "friendRequests"),
    where("fromId", "==", userId),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc"),
    limit(maxResults),
  );
  const [incomingSnap, outgoingSnap] = await Promise.all([getDocs(incoming), getDocs(outgoing)]);
  return {
    incoming: incomingSnap.docs.map((item) => ({ id: item.id, ...item.data() })),
    outgoing: outgoingSnap.docs.map((item) => ({ id: item.id, ...item.data() })),
  };
}
