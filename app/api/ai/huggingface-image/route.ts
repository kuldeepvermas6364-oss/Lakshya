import { InferenceClient } from "@huggingface/inference";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "black-forest-labs/FLUX.1-schnell";

export async function POST(request: Request) {
  try {
    const token = process.env.HUGGING_FACE_TOKEN?.trim();

    if (!token) {
      return NextResponse.json(
        { error: "Hugging Face Image AI is not connected. Add HUGGING_FACE_TOKEN in Vercel." },
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

    const response = await hf.textToImage({
      model: MODEL,
      inputs: prompt,
      provider: "auto",
      parameters: {
        width: 1024,
        height: 1024,
      },
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.type || "image/png";

    return NextResponse.json({
      image: `data:${contentType};base64,${buffer.toString("base64")}`,
      model: MODEL,
    });
  } catch (error) {
    console.error("Hugging Face FLUX image route error", error);

    const message = error instanceof Error ? error.message : "";
    const lower = message.toLowerCase();

    if (lower.includes("401") || lower.includes("403") || lower.includes("unauthorized") || lower.includes("token")) {
      return NextResponse.json(
        { error: "Hugging Face token is invalid or does not have access to the selected image provider/model." },
        { status: 401 },
      );
    }

    if (lower.includes("429") || lower.includes("rate limit")) {
      return NextResponse.json(
        { error: "Hugging Face image generation is rate-limited right now. Please try again shortly." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: "Hugging Face FLUX image generation is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
