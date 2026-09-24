import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

    // Proxy the generated image through Lakshya so the browser does not depend
    // on Pollinations' external image response/headers after generation.
    const imageResponse = await fetch(imageUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "image/*",
        "User-Agent": "Lakshya-AI/1.0",
      },
      signal: AbortSignal.timeout(55000),
    });

    if (!imageResponse.ok) {
      console.error("Pollinations image request failed:", imageResponse.status, imageResponse.statusText);
      return NextResponse.json(
        { error: `Pollinations AI could not generate the image right now (HTTP ${imageResponse.status}). Please try again.` },
        { status: 502 },
      );
    }

    const contentType = imageResponse.headers.get("content-type") || "image/png";
    if (!contentType.startsWith("image/")) {
      const responseText = await imageResponse.text().catch(() => "");
      console.error("Pollinations returned non-image response:", responseText.slice(0, 500));
      return NextResponse.json(
        { error: "Pollinations AI returned an invalid image response. Please try again." },
        { status: 502 },
      );
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    return NextResponse.json({
      image: `data:${contentType};base64,${imageBuffer.toString("base64")}`,
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
