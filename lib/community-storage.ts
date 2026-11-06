import { get, onValue, push, ref, remove, runTransaction, set, update } from "firebase/database";
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
  isMember?: boolean;
  createdAt?: number;
};

export async function createCommunity(ownerId: string, input: Omit<CommunityRecord, "id" | "ownerId" | "memberCount">) {
  if (!ownerId || !input.name.trim()) throw new Error("Community name is required");
  const community = push(ref(realtimeDb, "communities"));
  const id = community.key!;
  const now = Date.now();
  await update(ref(realtimeDb), {
    ["communities/" + id]: {
      ...input,
      name: input.name.trim(),
      ownerId,
      memberCount: 1,
      createdAt: now,
      members: {
        [ownerId]: { role: "owner", joinedAt: now },
      },
    },
  });
  return id;
}

export async function listCommunities(category = "All", maxResults = 30, userId?: string) {
  const snap = await get(ref(realtimeDb, "communities"));
  if (!snap.exists()) return [] as CommunityRecord[];
  const data = snap.val() as Record<string, Record<string, unknown>>;
  return Object.entries(data)
    .map(([id, item]) => {
      const members = item.members;
      const hasMemberMap = members !== null && typeof members === "object" && !Array.isArray(members);
      const storedCount = Number(item.memberCount ?? 0);
      const memberCount = hasMemberMap
        ? Object.keys(members as Record<string, unknown>).length
        : Number.isFinite(storedCount) ? storedCount : 0;
      const isMember = Boolean(
        userId &&
        hasMemberMap &&
        Object.prototype.hasOwnProperty.call(members, userId)
      );
      return { id, ...item, memberCount, isMember } as CommunityRecord;
    })
    .filter((item) => category === "All" || item.category === category)
    .sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0))
    .slice(0, maxResults);
}

export async function joinCommunity(communityId: string, userId: string) {
  if (!communityId || !userId) throw new Error("Invalid community membership");
  const community = await get(ref(realtimeDb, "communities/" + communityId));
  if (!community.exists()) throw new Error("Community not found");

  // Membership rules allow a student to write only their own member node.
  // Keep this transaction scoped to that node instead of updating the
  // owner-protected community parent and memberCount in the same request.
  const member = ref(realtimeDb, "communities/" + communityId + "/members/" + userId);
  const joinedAt = Date.now();
  const result = await runTransaction(
    member,
    (current) => current ?? { role: "member", joinedAt },
    { applyLocally: false }
  );

  if (!result.committed) {
    throw new Error("Could not join community. Please try again.");
  }
}

export async function leaveCommunity(communityId: string, userId: string) {
  if (!communityId || !userId) throw new Error("Invalid community membership");
  const community = await get(ref(realtimeDb, "communities/" + communityId));
  if (!community.exists()) return;

  // A student may remove their own membership node; memberCount is derived
  // from the members map when communities are listed.
  await remove(ref(realtimeDb, "communities/" + communityId + "/members/" + userId));
}

export function subscribeToCommunity(communityId: string, callback: (value: CommunityRecord | null) => void) {
  return onValue(ref(realtimeDb, "communities/" + communityId), (snap) => {
    callback(snap.exists() ? ({ id: communityId, ...snap.val() } as CommunityRecord) : null);
  });
}
