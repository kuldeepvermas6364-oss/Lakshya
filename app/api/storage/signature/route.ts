import { NextResponse } from "next/server";
import {
  createCloudinarySignature,
  getCloudinaryConfig,
  getUserStorageFolder,
  verifyFirebaseIdToken,
} from "../../../../lib/storage-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    const uid = await verifyFirebaseIdToken(token);
    const body = (await request.json().catch(() => ({}))) as { category?: string };
    const folder = getUserStorageFolder(uid, body.category ?? "posts");
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createCloudinarySignature({ folder, timestamp });
    const { cloudName, apiKey } = getCloudinaryConfig();

    return NextResponse.json({ cloudName, apiKey, folder, timestamp, signature });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not prepare secure upload.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
