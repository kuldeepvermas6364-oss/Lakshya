import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MODEL = "qwen/qwen-image-3";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter AI is not connected. Add OPENROUTER_API_KEY in Vercel." },
        { status: 503 },
      );
    }

    const body = await request.json().catch(() => null) as { prompt?: unknown } | null;
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) {
      return NextResponse.json({ error: "Please enter an image prompt." }, { status: 400 });
    }
    if (prompt.length > 2000) {
      return NextResponse.json({ error: "Image prompt is too long. Keep it under 2000 characters." }, { status: 400 });
    }

    const model = process.env.OPENROUTER_IMAGE_MODEL?.trim() || DEFAULT_MODEL;
    const response = await fetch("https://openrouter.ai/api/v1/images", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lakshya.vercel.app",
        "X-Title": "Lakshya Qwen Image AI",
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        aspect_ratio: "1:1",
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null) as {
      data?: Array<{ b64_json?: string; media_type?: string; url?: string }>;
      error?: { message?: string };
    } | null;

    if (!response.ok) {
      const message = data?.error?.message || "Qwen Image AI could not generate an image right now.";
      const status = response.status === 401 || response.status === 403 ? 401 : response.status === 429 ? 429 : 502;
      return NextResponse.json({ error: message }, { status });
    }

    const item = data?.data?.[0];
    if (!item?.b64_json && !item?.url) {
      return NextResponse.json({ error: "Qwen Image AI returned no image. Try a different prompt." }, { status: 502 });
    }

    if (item.url) return NextResponse.json({ image: item.url, model });

    return NextResponse.json({
      image: `data:${item.media_type || "image/png"};base64,${item.b64_json}`,
      mimeType: item.media_type || "image/png",
      model,
    });
  } catch (error) {
    console.error("Qwen image route error", error);
    return NextResponse.json(
      { error: "Qwen Image AI is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
