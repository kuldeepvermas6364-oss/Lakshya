import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const POLLINATIONS_IMAGE_ENDPOINT = "https://gen.pollinations.ai/image";
const POLLINATIONS_SECRET_KEY =
  process.env.POLLINATIONS_SECRET_KEY?.trim() ||
  process.env.POLLINATIONS_API_KEY?.trim();

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { prompt?: unknown; model?: unknown } | null;
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const model = typeof body?.model === "string" ? body.model.trim() : "";

    if (!prompt) {
      return NextResponse.json({ error: "Please enter an image prompt." }, { status: 400 });
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: "Image prompt is too long. Keep it under 2000 characters." },
        { status: 400 },
      );
    }

    if (!POLLINATIONS_SECRET_KEY) {
      return NextResponse.json(
        { error: "Pollinations secret key is not configured." },
        { status: 503 },
      );
    }

    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl =
      `${POLLINATIONS_IMAGE_ENDPOINT}/${encodedPrompt}?width=1024&height=1024&nologo=true${model ? `&model=${encodeURIComponent(model)}` : ""}`;

    // Keep the provider credential server-side; the browser only receives the
    // generated image data returned by this Lakshya route.
    const imageResponse = await fetch(imageUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "image/*",
        Authorization: `Bearer ${POLLINATIONS_SECRET_KEY}`,
        "User-Agent": "Lakshya-AI/1.0",
      },
      signal: AbortSignal.timeout(55000),
    });

    if (!imageResponse.ok) {
      console.error("Pollinations image request failed:", imageResponse.status, imageResponse.statusText);

      const errorMessage =
        imageResponse.status === 401
          ? "Pollinations image service could not authenticate. Please contact the app administrator."
          : imageResponse.status === 402
            ? "Pollinations image service has no remaining generation budget. Please contact the app administrator."
            : `Pollinations AI could not generate the image right now (HTTP ${imageResponse.status}). Please try again.`;

      return NextResponse.json({ error: errorMessage }, { status: 502 });
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
