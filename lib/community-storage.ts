import { get, onValue, push, ref, remove, set, update } from "firebase/database";
import { realtimeDb } from "./firebase";

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
  createdAt?: number;
};

export async function createCommunity(ownerId: string, input: Omit<CommunityRecord, "id" | "ownerId" | "memberCount">) {
  if (!ownerId || !input.name.trim()) throw new Error("Community name is required");
  const community = push(ref(realtimeDb, "communities"));
  const id = community.key!;
  const now = Date.now();
  await update(ref(realtimeDb), {
    [`communities/${id}`]: { ...input, name: input.name.trim(), ownerId, memberCount: 1, createdAt: now },
    [`communities/${id}/members/${ownerId}`]: { role: "owner", joinedAt: now },
  });
  return id;
}

export async function listCommunities(category = "All", maxResults = 30) {
  const snap = await get(ref(realtimeDb, "communities"));
  if (!snap.exists()) return [] as CommunityRecord[];
  const data = snap.val() as Record<string, Record<string, unknown>>;
  return Object.entries(data)
    .map(([id, item]) => ({ id, ...item } as CommunityRecord))
    .filter((item) => category === "All" || item.category === category)
    .sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0))
    .slice(0, maxResults);
}

export async function joinCommunity(communityId: string, userId: string) {
  if (!communityId || !userId) throw new Error("Invalid community membership");
  const member = ref(realtimeDb, `communities/${communityId}/members/${userId}`);
  if ((await get(member)).exists()) return;
  const community = await get(ref(realtimeDb, `communities/${communityId}`));
  if (!community.exists()) throw new Error("Community not found");
  const current = Number(community.val()?.memberCount ?? 0);
  const now = Date.now();
  await update(ref(realtimeDb), {
    [`communities/${communityId}/members/${userId}`]: { role: "member", joinedAt: now },
    [`communities/${communityId}/memberCount`]: current + 1,
  });
}

export async function leaveCommunity(communityId: string, userId: string) {
  const member = ref(realtimeDb, `communities/${communityId}/members/${userId}`);
  if (!(await get(member)).exists()) return;
  const community = await get(ref(realtimeDb, `communities/${communityId}`));
  if (!community.exists()) return;
  const current = Number(community.val()?.memberCount ?? 0);
  await update(ref(realtimeDb), {
    [`communities/${communityId}/members/${userId}`]: null,
    [`communities/${communityId}/memberCount`]: Math.max(0, current - 1),
  });
}

export function subscribeToCommunity(communityId: string, callback: (value: CommunityRecord | null) => void) {
  return onValue(ref(realtimeDb, `communities/${communityId}`), (snap) => {
    callback(snap.exists() ? ({ id: communityId, ...snap.val() } as CommunityRecord) : null);
  });
}
