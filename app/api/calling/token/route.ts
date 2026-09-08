import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { roomName, participantName, identity } = await request.json();
    if (!roomName || !participantName || !identity) {
      return NextResponse.json({ error: "Missing call details" }, { status: 400 });
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
  } catch {
    return NextResponse.json({ error: "Unable to create call token" }, { status: 500 });
  }
}
