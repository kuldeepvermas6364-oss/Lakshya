import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLLINATIONS_IMAGE_ENDPOINT = "https://image.pollinations.ai/prompt";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { prompt?: unknown } | null;
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return NextResponse.json({ error: "Please enter an image prompt." }, { status: 400 });
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: "Image prompt is too long. Keep it under 2000 characters." },
        { status: 400 },
      );
    }

    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl =
      `${POLLINATIONS_IMAGE_ENDPOINT}/${encodedPrompt}?width=1024&height=1024&nologo=true`;

    return NextResponse.json({
      image: imageUrl,
      provider: "Pollinations AI",
    });
  } catch (error) {
    console.error("Pollinations image route error", error);
    return NextResponse.json(
      { error: "Pollinations AI image generation is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
