import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLLINATIONS_MODELS_ENDPOINT = "https://gen.pollinations.ai/v1/models";
const MODEL_CACHE_TTL_MS = 60_000;
const MODEL_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
};
const KEY =
  process.env.POLLINATIONS_SECRET_KEY?.trim() ||
  process.env.POLLINATIONS_API_KEY?.trim();

type PollinationsModel = {
  id: string;
  name: string;
  type: "text" | "image";
};

class UpstreamModelListError extends Error {}

let cachedModels: { models: PollinationsModel[]; expiresAt: number } | null = null;
let pendingModelsRequest: Promise<PollinationsModel[]> | null = null;

function inferType(id: string, rawType?: unknown): "text" | "image" {
  if (rawType === "image") return "image";
  const value = id.toLowerCase();
  return /image|flux|ideogram|grok-imagine|nano-banana|seedream|sdxl|leonardo|kling|lucid|photon|pruna|recraft|dreamshaper|lightning-image|qwen-image|sana|bonsai/.test(value)
    ? "image"
    : "text";
}

async function loadModels(): Promise<PollinationsModel[]> {
  const response = await fetch(POLLINATIONS_MODELS_ENDPOINT, {
    headers: { Authorization: "Bearer " + KEY },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new UpstreamModelListError(
      `Pollinations model list failed (HTTP ${response.status}).`,
    );
  }

  const payload = JSON.parse(raw) as {
    data?: Array<Record<string, unknown>>;
  };

  return (Array.isArray(payload.data) ? payload.data : [])
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
}

export async function GET() {
  if (!KEY) {
    return NextResponse.json(
      { error: "Pollinations secret key is not configured." },
      { status: 503 },
    );
  }

  const now = Date.now();
  if (cachedModels && cachedModels.expiresAt > now) {
    return NextResponse.json(
      { models: cachedModels.models },
      { headers: MODEL_CACHE_HEADERS },
    );
  }

  const request = pendingModelsRequest ?? loadModels();
  pendingModelsRequest = request;

  try {
    const models = await request;
    cachedModels = {
      models,
      expiresAt: Date.now() + MODEL_CACHE_TTL_MS,
    };
    return NextResponse.json(
      { models },
      { headers: MODEL_CACHE_HEADERS },
    );
  } catch (error) {
    if (error instanceof UpstreamModelListError) {
      return NextResponse.json(
        { error: error.message },
        { status: 502 },
      );
    }

    console.error("Pollinations model list error", error);
    return NextResponse.json(
      { error: "Pollinations model list is temporarily unavailable." },
      { status: 503 },
    );
  } finally {
    if (pendingModelsRequest === request) {
      pendingModelsRequest = null;
    }
  }
}
