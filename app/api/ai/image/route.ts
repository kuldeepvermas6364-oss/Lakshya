import { NextResponse } from "next/server";
import { generateStudyImage } from "@/lib/ai/image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { prompt?: unknown } | null;
    const prompt = typeof body?.prompt === "string" ? body.prompt : "";

    if (!prompt.trim()) {
      return NextResponse.json({ error: "Please enter an image prompt." }, { status: 400 });
    }

    const image = await generateStudyImage(prompt);
    return NextResponse.json({ image: `data:${image.mimeType};base64,${image.data}`, mimeType: image.mimeType });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image generation is temporarily unavailable.";
    const status = /not configured/i.test(message) ? 503 : /invalid|not authorized/i.test(message) ? 401 : /quota|rate limit/i.test(message) ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
