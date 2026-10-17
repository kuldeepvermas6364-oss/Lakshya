import { NextResponse } from "next/server";
import { verifyFirebaseIdToken } from "@/lib/storage-server";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    const idToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    const identity = await verifyFirebaseIdToken(idToken);
    const body = await request.json();
    const roomName = typeof body.roomName === "string" ? body.roomName.trim() : "";
    const participantName = typeof body.participantName === "string" ? body.participantName.trim().slice(0, 80) : "";
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(roomName) || !participantName) {
      return NextResponse.json({ error: "Invalid call details" }, { status: 400 });
    }
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json({ error: "Calling service is not configured" }, { status: 503 });
    }
    const { AccessToken } = await import("livekit-server-sdk");
    const token = new AccessToken(apiKey, apiSecret, { identity, name: participantName });
    token.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
    return NextResponse.json({ token: await token.toJwt(), wsUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create call token";
    const status = message.includes("Authentication") || message.includes("token") ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? "Authentication required" : "Unable to create call token" }, { status });
  }
}
