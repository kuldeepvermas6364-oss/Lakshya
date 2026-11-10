import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLLINATIONS_MODELS_ENDPOINT = "https://gen.pollinations.ai/v1/models";
const MODEL_CACHE_TTL_MS = 60_000;
const MODEL_CACHE_STALE_TTL_MS = 10 * 60_000;
const MODEL_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
};
const STALE_MODEL_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=15, stale-while-revalidate=60",
  "X-Model-Cache": "stale",
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

let cachedModels: { models: PollinationsModel[]; expiresAt: number; staleUntil: number } | null = null;
let pendingModelsRequest: Promise<PollinationsModel[]> | null = null;

function inferType(id: string, rawType?: unknown): "text" | "image" {
  if (rawType === "image") return "image";
  if (rawType === "text") return "text";

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

  const payload: unknown = JSON.parse(raw);
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("data" in payload) ||
    !Array.isArray(payload.data)
  ) {
    throw new UpstreamModelListError(
      "Pollinations model list returned an invalid payload.",
    );
  }

  const seenIds = new Set<string>();
  const models: PollinationsModel[] = [];

  for (const item of payload.data) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      continue;
    }

    const model = item as Record<string, unknown>;
    const id = typeof model.id === "string" ? model.id.trim() : "";
    if (!id || seenIds.has(id)) continue;

    seenIds.add(id);

    const rawName =
      typeof model.name === "string"
        ? model.name
        : typeof model.title === "string"
          ? model.title
          : "";
    const name = rawName.trim() || id;

    models.push({
      id,
      name,
      type: inferType(id, model.type),
    });
  }

  if (models.length === 0) {
    throw new UpstreamModelListError(
      "Pollinations model list returned no usable models.",
    );
  }

  return models;
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
    const cachedAt = Date.now();
    cachedModels = {
      models,
      expiresAt: cachedAt + MODEL_CACHE_TTL_MS,
      staleUntil: cachedAt + MODEL_CACHE_STALE_TTL_MS,
    };
    return NextResponse.json(
      { models },
      { headers: MODEL_CACHE_HEADERS },
    );
  } catch (error) {
    if (cachedModels && cachedModels.staleUntil > Date.now()) {
      console.warn("Pollinations model list refresh failed; serving stale catalogue.");
      return NextResponse.json(
        { models: cachedModels.models },
        { headers: STALE_MODEL_CACHE_HEADERS },
      );
    }

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
