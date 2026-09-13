import { NextResponse } from "next/server";
import { assertOwnedPublicId, createCloudinarySignature, getCloudinaryConfig, verifyFirebaseIdToken } from "../../../../lib/storage-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    const uid = await verifyFirebaseIdToken(token);
    const body = (await request.json()) as { publicId?: string; resourceType?: string };
    const publicId = body.publicId?.trim() ?? "";
    assertOwnedPublicId(uid, publicId);

    const timestamp = Math.floor(Date.now() / 1000);
    const resourceType = body.resourceType === "image" || body.resourceType === "video" || body.resourceType === "raw" ? body.resourceType : "image";
    const signature = createCloudinarySignature({ public_id: publicId, timestamp });
    const { cloudName, apiKey } = getCloudinaryConfig();
    const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/destroy`;
    const form = new URLSearchParams({ public_id: publicId, timestamp: String(timestamp), api_key: apiKey, signature });
    const response = await fetch(endpoint, { method: "POST", body: form, cache: "no-store" });
    const result = (await response.json().catch(() => ({}))) as { result?: string; error?: { message?: string } };
    if (!response.ok || (result.result !== "ok" && result.result !== "not found")) throw new Error(result.error?.message ?? "Cloudinary deletion failed.");
    return NextResponse.json({ ok: true, result: result.result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete media.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
