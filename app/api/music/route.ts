import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MUSIC_WORKER_URL = "https://lakshya-spotif.kuldeepvermas6364.workers.dev";
const ALLOWED_CATEGORIES = new Set([
  "bollywood", "punjabi", "romantic", "lofi", "devotional", "party", "sad",
  "focus", "english", "trending", "bhojpuri", "haryanvi", "south-indian",
  "india-trending", "international",
]);
const SEARCH_CATEGORIES: Record<string, string> = {
  bhojpuri: "Bhojpuri songs",
  haryanvi: "Haryanvi songs",
  "south-indian": "Tamil Telugu South Indian songs",
  international: "international English pop hits",
};

type Track = {
  id: string; name: string; artist: string; album?: string; albumArt?: string;
  previewUrl: string; spotifyUrl?: string; duration?: number; rank?: number;
};
type WorkerData = {
  query?: string; category?: string; page?: number; limit?: number;
  total?: number; hasMore?: boolean; tracks?: Track[]; source?: string;
};
const validTracks = (data: WorkerData): Track[] => Array.isArray(data?.tracks)
  ? data.tracks.filter((track) => track && typeof track.id === "string" &&
      typeof track.name === "string" && typeof track.artist === "string" &&
      typeof track.previewUrl === "string")
  : [];

async function fetchWorker(params: { q?: string; category?: string; page: number; limit: number }) {
  const upstream = new URL("/", MUSIC_WORKER_URL);
  if (params.q) upstream.searchParams.set("q", params.q);
  if (params.category) upstream.searchParams.set("category", params.category);
  upstream.searchParams.set("page", String(params.page));
  upstream.searchParams.set("limit", String(params.limit));
  const response = await fetch(upstream.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Music service unavailable");
  return await response.json() as WorkerData;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = (params.get("q") || "").trim().slice(0, 120);
  const requestedCategory = (params.get("category") || "").trim().toLowerCase();
  const category = ALLOWED_CATEGORIES.has(requestedCategory) ? requestedCategory : "";
  const page = Math.max(1, Math.min(100, Number.parseInt(params.get("page") || "1", 10) || 1));
  const limit = Math.max(1, Math.min(30, Number.parseInt(params.get("limit") || "24", 10) || 24));

  try {
    // Search terms must be passed unchanged; never replace them with a category default.
    if (!query && !requestedCategory) {
      const requests = [
        fetchWorker({ category: "india-trending", page: 1, limit: 30 }),
        fetchWorker({ category: "bollywood", page: 1, limit: 30 }),
        fetchWorker({ category: "punjabi", page: 1, limit: 30 }),
        fetchWorker({ q: "Bhojpuri songs", page: 1, limit: 30 }),
        fetchWorker({ q: "Haryanvi songs", page: 1, limit: 30 }),
      ];
      const results = await Promise.allSettled(requests);
      const successful = results.filter((item): item is PromiseFulfilledResult<WorkerData> => item.status === "fulfilled");
      if (!successful.length) throw new Error("No music sources available");
      const merged: Track[] = [];
      const seen = new Set<string>();
      for (const result of successful) {
        for (const track of validTracks(result.value)) {
          if (!seen.has(track.id)) { seen.add(track.id); merged.push(track); }
        }
      }
      const start = (page - 1) * limit;
      const tracks = merged.slice(start, start + limit);
      return NextResponse.json({
        query: "", category: null, page, limit,
        total: merged.length,
        hasMore: successful.some((item) => item.value.hasMore) || merged.length > start + limit,
        source: "India chart + regional discovery",
        tracks,
      }, { headers: { "Cache-Control": "no-store, max-age=0" } });
    }

    const customSearch = SEARCH_CATEGORIES[requestedCategory];
    const data = await fetchWorker({
      q: customSearch || query || undefined,
      category: customSearch ? undefined : category || undefined,
      page, limit,
    });
    const tracks = validTracks(data);
    return NextResponse.json({
      query: typeof data.query === "string" ? data.query : query || customSearch || "",
      category: typeof data.category === "string" ? data.category : category || (requestedCategory || null),
      page: Number(data.page) || page,
      limit: Number(data.limit) || limit,
      total: Number(data.total) || tracks.length,
      hasMore: Boolean(data.hasMore),
      source: data.source || "Music service",
      tracks,
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json(
      { error: "Music service could not be reached. Check your connection and try again." },
      { status: 503 },
    );
  }
}
