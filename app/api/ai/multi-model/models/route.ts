import { getConfiguredModels } from "@/lib/ai/multi-model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    models: getConfiguredModels(),
    maxSelected: 5,
    provider: "OpenRouter",
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
