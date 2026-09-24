import { InferenceClient } from "@huggingface/inference";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "stabilityai/stable-diffusion-3.5-large";

export async function POST(request: Request) {
  try {
    const token = process.env.HUGGING_FACE_TOKEN?.trim();

    if (!token) {
      return NextResponse.json(
        { error: "Stable Diffusion AI is not connected. Add HUGGING_FACE_TOKEN in Vercel." },
        { status: 503 },
      );
    }

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

    const hf = new InferenceClient(token);

    const imageDataUrl = await hf.textToImage(
      {
        model: MODEL,
        inputs: prompt,
        provider: "auto",
        parameters: {
          target_size: {
            width: 1024,
            height: 1024,
          },
        },
      },
      {
        outputType: "dataUrl",
      },
    );

    return NextResponse.json({
      image: imageDataUrl,
      model: MODEL,
    });
  } catch (error) {
    console.error("Hugging Face Stable Diffusion image route error", error);

    const message = error instanceof Error ? error.message : "";
    const lower = message.toLowerCase();

    if (
      lower.includes("401") ||
      lower.includes("403") ||
      lower.includes("unauthorized") ||
      lower.includes("token") ||
      lower.includes("gated") ||
      lower.includes("access")
    ) {
      return NextResponse.json(
        {
          error:
            "Stable Diffusion 3.5 needs Hugging Face model access. Check that your HUGGING_FACE_TOKEN can access the model.",
        },
        { status: 401 },
      );
    }

    if (lower.includes("429") || lower.includes("rate limit")) {
      return NextResponse.json(
        { error: "Stable Diffusion image generation is rate-limited right now. Please try again shortly." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: "Stable Diffusion 3.5 image generation is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
