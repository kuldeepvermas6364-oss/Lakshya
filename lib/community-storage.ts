import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

export type CommunityRecord = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  tagline?: string;
  category?: string;
  type?: "public" | "private" | "restricted";
  avatarUrl?: string;
  bannerUrl?: string;
  ownerId: string;
  memberCount: number;
  createdAt?: unknown;
};

// Keep Firebase Firestore references lazy so Next.js can prerender client pages
// without trying to construct a Firestore CollectionReference on the server.
function getCommunitiesCollection() {
  if (typeof window === "undefined" || !db) {
    throw new Error("Firestore is only available in the browser");
  }
  return collection(db, "communities");
}

function getCommunityDoc(communityId: string) {
  if (typeof window === "undefined" || !db) {
    throw new Error("Firestore is only available in the browser");
  }
  return doc(db, "communities", communityId);
}

export async function createCommunity(
  ownerId: string,
  input: Omit<CommunityRecord, "id" | "ownerId" | "memberCount">,
) {
  if (!ownerId || !input.name.trim()) throw new Error("Community name is required");
  const communities = getCommunitiesCollection();
  const community = await addDoc(communities, {
    ...input,
    name: input.name.trim(),
    ownerId,
    memberCount: 1,
    createdAt: serverTimestamp(),
  });
  await setDoc(doc(db, "communities", community.id, "members", ownerId), {
    role: "owner",
    joinedAt: serverTimestamp(),
  });
  return community.id;
}

export async function listCommunities(category = "All", maxResults = 30) {
  const communities = getCommunitiesCollection();
  const base = category !== "All"
    ? query(communities, where("category", "==", category), orderBy("createdAt", "desc"), limit(maxResults))
    : query(communities, orderBy("createdAt", "desc"), limit(maxResults));
  const snap = await getDocs(base);
  return snap.docs.map((item) => ({ id: item.id, ...item.data() })) as CommunityRecord[];
}

export async function joinCommunity(communityId: string, userId: string) {
  const member = doc(db, "communities", communityId, "members", userId);
  if ((await getDoc(member)).exists()) return;
  const community = await getDoc(getCommunityDoc(communityId));
  const current = Number(community.data()?.memberCount ?? 0);
  await setDoc(member, { role: "member", joinedAt: serverTimestamp() });
  await updateDoc(getCommunityDoc(communityId), { memberCount: current + 1 });
}

export async function leaveCommunity(communityId: string, userId: string) {
  const member = doc(db, "communities", communityId, "members", userId);
  if (!(await getDoc(member)).exists()) return;
  const community = await getDoc(getCommunityDoc(communityId));
  const current = Number(community.data()?.memberCount ?? 0);
  await deleteDoc(member);
  await updateDoc(getCommunityDoc(communityId), { memberCount: Math.max(0, current - 1) });
}

export function subscribeToCommunity(communityId: string, callback: (value: CommunityRecord | null) => void) {
  return onSnapshot(getCommunityDoc(communityId), (snap) =>
    callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as CommunityRecord) : null),
  );
}
