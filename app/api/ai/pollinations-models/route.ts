import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLLINATIONS_MODELS_ENDPOINT = "https://gen.pollinations.ai/v1/models";
const KEY =
  process.env.POLLINATIONS_SECRET_KEY?.trim() ||
  process.env.POLLINATIONS_API_KEY?.trim();

function inferType(id: string, rawType?: unknown): "text" | "image" {
  if (rawType === "image") return "image";
  const value = id.toLowerCase();
  return /image|flux|ideogram|grok-imagine|nano-banana|seedream|sdxl|leonardo|kling|lucid|photon|pruna|recraft|dreamshaper|lightning-image|qwen-image|sana|bonsai/.test(value)
    ? "image"
    : "text";
}

export async function GET() {
  if (!KEY) {
    return NextResponse.json(
      { error: "Pollinations secret key is not configured." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(POLLINATIONS_MODELS_ENDPOINT, {
      headers: { Authorization: "Bearer " + KEY },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    const raw = await response.text();
    if (!response.ok) {
      return NextResponse.json(
        { error: `Pollinations model list failed (HTTP ${response.status}).` },
        { status: 502 },
      );
    }

    const payload = JSON.parse(raw) as {
      data?: Array<Record<string, unknown>>;
    };

    const models = (Array.isArray(payload.data) ? payload.data : [])
      .map((item) => {
        const id = typeof item.id === "string" ? item.id : "";
        const name =
          typeof item.name === "string"
            ? item.name
            : typeof item.title === "string"
              ? item.title
              : id;
        return {
          id,
          name: name || id,
          type: inferType(id, item.type),
        };
      })
      .filter((item) => item.id)
      .filter((item, index, array) => array.findIndex((x) => x.id === item.id) === index);

    return NextResponse.json({ models });
  } catch (error) {
    console.error("Pollinations model list error", error);
    return NextResponse.json(
      { error: "Pollinations model list is temporarily unavailable." },
      { status: 503 },
    );
  }
}
