import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MUSIC_WORKER_URL = "https://lakshya-spotif.kuldeepvermas6364.workers.dev";
const ALLOWED_CATEGORIES = new Set([
  "bollywood", "punjabi", "romantic", "lofi", "devotional",
  "party", "sad", "focus", "english", "trending",
]);

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = (params.get("q") || "").trim().slice(0, 120);
  const requestedCategory = (params.get("category") || "").trim().toLowerCase();
  const category = ALLOWED_CATEGORIES.has(requestedCategory) ? requestedCategory : "";
  const page = Math.max(1, Math.min(100, Number.parseInt(params.get("page") || "1", 10) || 1));
  const limit = Math.max(1, Math.min(30, Number.parseInt(params.get("limit") || "24", 10) || 24));
  const upstream = new URL("/", MUSIC_WORKER_URL);
  if (query) upstream.searchParams.set("q", query);
  if (category) upstream.searchParams.set("category", category);
  upstream.searchParams.set("page", String(page));
  upstream.searchParams.set("limit", String(limit));

  try {
    const response = await fetch(upstream.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      return NextResponse.json({ error: "Music service is temporarily unavailable. Please try again." }, { status: 502 });
    }
    const data = await response.json();
    const tracks = Array.isArray(data?.tracks) ? data.tracks.filter((track: unknown) => {
      if (!track || typeof track !== "object") return false;
      const item = track as Record<string, unknown>;
      return typeof item.id === "string" && typeof item.name === "string" &&
        typeof item.artist === "string" && typeof item.previewUrl === "string";
    }) : [];
    return NextResponse.json({
      query: typeof data.query === "string" ? data.query : query,
      category: typeof data.category === "string" ? data.category : category || null,
      page: Number(data.page) || page,
      limit: Number(data.limit) || limit,
      total: Number(data.total) || tracks.length,
      hasMore: Boolean(data.hasMore),
      tracks,
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json(
      { error: "Music service could not be reached. Check your connection and try again." },
      { status: 503 },
    );
  }
}
