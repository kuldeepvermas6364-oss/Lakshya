import { createHash } from "node:crypto";

const ALLOWED_FOLDERS = new Set([
  "profile",
  "posts",
  "chat",
  "study-materials",
  "ai",
]);

const MAX_FOLDER_LENGTH = 40;

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function normalizeStorageFolder(value: unknown) {
  const folder = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!ALLOWED_FOLDERS.has(folder)) throw new Error("Invalid storage folder.");
  return folder.slice(0, MAX_FOLDER_LENGTH);
}

export async function verifyFirebaseIdToken(idToken: string) {
  if (!idToken) throw new Error("Authentication required.");
  const apiKey = requireEnv("NEXT_PUBLIC_FIREBASE_API_KEY");
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    },
  );

  if (!response.ok) throw new Error("Authentication token is invalid or expired.");
  const payload = (await response.json()) as { users?: Array<{ localId?: string }> };
  const uid = payload.users?.[0]?.localId;
  if (!uid) throw new Error("Authenticated user could not be resolved.");
  return uid;
}

export function getUserStorageFolder(uid: string, category: string) {
  const safeUid = uid.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
  if (!safeUid) throw new Error("Invalid user identifier.");
  const safeCategory = normalizeStorageFolder(category);
  return `lakshya/users/${safeUid}/${safeCategory}`;
}

export function createCloudinarySignature(params: Record<string, string | number>) {
  const apiSecret = requireEnv("CLOUDINARY_API_SECRET");
  const serialized = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(serialized + apiSecret).digest("hex");
}

export function assertOwnedPublicId(uid: string, publicId: string) {
  const expectedPrefix = `lakshya/users/${uid}/`;
  if (!publicId || !publicId.startsWith(expectedPrefix)) {
    throw new Error("You do not have permission to manage this media.");
  }
}

export function getCloudinaryConfig() {
  return {
    cloudName: requireEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"),
    apiKey: requireEnv("CLOUDINARY_API_KEY"),
  };
}
