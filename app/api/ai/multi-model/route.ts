import { getConfiguredModels, getModelMap, streamOpenRouterModel, type MultiModelMessage } from "@/lib/ai/multi-model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RunBody = {
  task?: unknown;
  models?: unknown;
  context?: unknown;
  language?: unknown;
};

const encoder = new TextEncoder();

function event(type: string, payload: Record<string, unknown>) {
  return encoder.encode(JSON.stringify({ type, ...payload }) + "\n");
}

export async function GET() {
  return Response.json({
    models: getConfiguredModels(),
    maxSelected: 5,
    provider: "OpenRouter",
  });
}

export async function POST(request: Request) {
  const started = Date.now();
  let body: RunBody;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON request." }, { status: 400 });
  }

  const task = typeof body.task === "string" ? body.task.trim() : "";
  const requestedModels = Array.isArray(body.models)
    ? body.models.filter((x): x is string => typeof x === "string")
    : [];
  const context = typeof body.context === "string" ? body.context.trim() : "";
  const language = typeof body.language === "string" ? body.language : "hi-en";

  if (!task) return Response.json({ error: "Task is required." }, { status: 400 });
  if (task.length > 20000) return Response.json({ error: "Task is too long." }, { status: 413 });
  if (requestedModels.length < 1 || requestedModels.length > 5) {
    return Response.json({ error: "Select between 1 and 5 models." }, { status: 400 });
  }

  const modelMap = getModelMap();
  const models = [...new Set(requestedModels)];
  const unknown = models.filter((id) => !modelMap.has(id));
  if (unknown.length) {
    return Response.json({ error: `Unsupported model selection: ${unknown.join(", ")}` }, { status: 400 });
  }

  if (!process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_TOKEN) {
    return Response.json({ error: "Multi-Model AI is not configured. Add OPENROUTER_API_KEY in Vercel." }, { status: 503 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  const messages: MultiModelMessage[] = [{
    role: "system",
    content: [
      "You are part of Lakshya Multi-Model AI.",
      `Preferred language: ${language}.`,
      context ? `Student context:\n${context}` : "",
      "Give a useful, accurate answer. Do not mention internal routing unless asked.",
    ].filter(Boolean).join("\n\n"),
  }, { role: "user", content: task }];

  const stream = new ReadableStream<Uint8Array>({
    start(streamController) {
      const queue: Uint8Array[] = [];
      let closed = false;
      let active = models.length;

      const push = (chunk: Uint8Array) => {
        if (!closed) streamController.enqueue(chunk);
      };

      push(event("run_started", {
        total: models.length,
        models: models.map((id) => modelMap.get(id)),
        startedAt: new Date().toISOString(),
      }));

      const runOne = async (modelId: string) => {
        const model = modelMap.get(modelId)!;
        const modelStarted = Date.now();
        push(event("model_started", { modelId, startedAt: new Date().toISOString() }));

        try {
          let fullText = "";
          await streamOpenRouterModel(modelId, messages, controller.signal, (text) => {
            fullText += text;
            push(event("model_delta", { modelId, text }));
          });

          push(event("model_completed", {
            modelId,
            text: fullText,
            latencyMs: Date.now() - modelStarted,
          }));
        } catch (error) {
          const message = controller.signal.aborted ? "Model timed out or was cancelled." : (error instanceof Error ? error.message : "Model request failed.");
          push(event("model_failed", {
            modelId,
            error: message,
            latencyMs: Date.now() - modelStarted,
          }));
        } finally {
          active -= 1;
          if (active === 0) {
            clearTimeout(timeout);
            push(event("run_completed", {
              latencyMs: Date.now() - started,
            }));
            if (!closed) {
              closed = true;
              streamController.close();
            }
          }
        }
      };

      void Promise.allSettled(models.map(runOne)).catch(() => {
        clearTimeout(timeout);
        if (!closed) {
          closed = true;
          streamController.error(new Error("Multi-model execution failed."));
        }
      });
    },
    cancel() {
      clearTimeout(timeout);
      controller.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
