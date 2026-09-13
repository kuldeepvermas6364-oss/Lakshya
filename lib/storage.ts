"use client";

import { get, push, ref, remove, set, serverTimestamp } from "firebase/database";
import { auth, realtimeDb } from "./firebase";

export type StorageCategory = "profile" | "posts" | "chat" | "study-materials" | "ai";
export type StorageResourceType = "image" | "video" | "raw";

export type MediaMetadata = {
  id: string;
  ownerId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  resourceType: StorageResourceType;
  publicId: string;
  secureUrl: string;
  thumbnailUrl?: string;
  folder: StorageCategory;
  createdAt: unknown;
  status: "ready";
};

export type UploadProgress = { loaded: number; total: number; percent: number };

const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 100 * 1024 * 1024;
const MAX_RAW = 25 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const RAW_TYPES = new Set(["application/pdf", "text/plain"]);

export function getResourceType(file: File): StorageResourceType {
  if (IMAGE_TYPES.has(file.type)) return "image";
  if (VIDEO_TYPES.has(file.type)) return "video";
  if (RAW_TYPES.has(file.type)) return "raw";
  throw new Error("This file type is not supported.");
}

export function validateMediaFile(file: File) {
  const resourceType = getResourceType(file);
  const limit = resourceType === "image" ? MAX_IMAGE : resourceType === "video" ? MAX_VIDEO : MAX_RAW;
  if (file.size <= 0) throw new Error("The selected file is empty.");
  if (file.size > limit) {
    const max = Math.round(limit / (1024 * 1024));
    throw new Error(`This file is too large. Maximum size is ${max} MB.`);
  }
  return resourceType;
}

function getBearerToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in before uploading media.");
  return user.getIdToken();
}

async function requestSignature(category: StorageCategory) {
  const token = await getBearerToken();
  const response = await fetch("/api/storage/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ category }),
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string; cloudName?: string; apiKey?: string; folder?: string; timestamp?: number; signature?: string };
  if (!response.ok || !payload.signature || !payload.folder || !payload.timestamp || !payload.cloudName || !payload.apiKey) {
    throw new Error(payload.error ?? "Could not prepare secure upload.");
  }
  return payload as { cloudName: string; apiKey: string; folder: string; timestamp: number; signature: string };
}

function cloudinaryUpload(file: File, signature: Awaited<ReturnType<typeof requestSignature>>, resourceType: StorageResourceType, onProgress?: (progress: UploadProgress) => void) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/auto/upload`;
    xhr.open("POST", endpoint);
    xhr.responseType = "json";
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.({ loaded: event.loaded, total: event.total, percent: Math.round((event.loaded / event.total) * 100) });
    };
    xhr.onerror = () => reject(new Error("Network error while uploading. Check your connection and retry."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.onload = () => {
      const data = xhr.response as Record<string, unknown> | null;
      if (xhr.status >= 200 && xhr.status < 300 && data) resolve(data);
      else reject(new Error(typeof data?.error === "object" && data.error && "message" in data.error ? String(data.error.message) : "Cloudinary upload failed."));
    };
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", signature.apiKey);
    form.append("timestamp", String(signature.timestamp));
    form.append("folder", signature.folder);
    form.append("signature", signature.signature);
    form.append("resource_type", resourceType);
    xhr.send(form);
  });
}

function thumbnailFromCloudinary(url: string, resourceType: StorageResourceType) {
  if (resourceType === "raw") return undefined;
  return url.replace("/upload/", "/upload/w_480,h_320,c_fill,q_auto,f_auto/");
}

export async function uploadMedia(file: File, category: StorageCategory, onProgress?: (progress: UploadProgress) => void) {
  const resourceType = validateMediaFile(file);
  const signature = await requestSignature(category);
  const result = await cloudinaryUpload(file, signature, resourceType, onProgress);
  const user = auth.currentUser;
  if (!user) throw new Error("Authentication expired during upload.");

  const mediaRef = push(ref(realtimeDb, `users/${user.uid}/media`));
  const metadata: MediaMetadata = {
    id: mediaRef.key!,
    ownerId: user.uid,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    resourceType,
    publicId: String(result.public_id ?? ""),
    secureUrl: String(result.secure_url ?? ""),
    thumbnailUrl: thumbnailFromCloudinary(String(result.secure_url ?? ""), resourceType),
    folder: category,
    createdAt: serverTimestamp(),
    status: "ready",
  };
  if (!metadata.publicId || !metadata.secureUrl) throw new Error("Upload completed but media metadata was incomplete.");
  await set(mediaRef, metadata);
  return metadata;
}

export async function deleteMedia(media: Pick<MediaMetadata, "id" | "publicId" | "resourceType">) {
  const token = await getBearerToken();
  const response = await fetch("/api/storage/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ publicId: media.publicId, resourceType: media.resourceType }),
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Could not delete media.");
  const user = auth.currentUser;
  if (user) await remove(ref(realtimeDb, `users/${user.uid}/media/${media.id}`));
}

export async function listMyMedia() {
  const user = auth.currentUser;
  if (!user) return [] as MediaMetadata[];
  const snapshot = await get(ref(realtimeDb, `users/${user.uid}/media`));
  if (!snapshot.exists()) return [] as MediaMetadata[];
  return Object.values(snapshot.val() as Record<string, MediaMetadata>).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function optimizeCloudinaryUrl(url: string, width = 1200) {
  return url.replace("/upload/", `/upload/w_${Math.max(100, Math.min(width, 2400))},q_auto,f_auto/`);
}
