import { LAKSHYA_AI_SYSTEM_PROMPT } from "../../../../lib/ai/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function makePrompt(message: string, context: string, webContext = "") {
  const parts = [context ? `Student context:\\n${context}` : "", `Student request:\\n${message}`];
  if (webContext) {
    parts.push(`Live web sources retrieved by Lakshya:\\n${webContext}\\n\\nUse these sources only when relevant and do not invent details beyond them.`);
  }
  return parts.filter(Boolean).join("\n\n");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const context = typeof body?.context === "string" ? body.context.trim() : "";
    const stream = body?.stream !== false;

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const sources = await searchWeb(message);
    const prompt = makePrompt(message, context, buildWebContext(sources));

    if (!stream) {
      const text = await generateStudyAIContent(prompt, LAKSHYA_AI_SYSTEM_PROMPT);
      return Response.json({ text: `${text}${formatWebSources(sources)}` });
    }

    const result = await streamStudyAIContent(prompt, LAKSHYA_AI_SYSTEM_PROMPT);
    const encoder = new TextEncoder();
    const bodyStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of result) {
            const text = chunk.text;
            if (text) controller.enqueue(encoder.encode(text));
          }

          const sourceText = formatWebSources(sources);
          if (sourceText) controller.enqueue(encoder.encode(sourceText));
          controller.close();
        } catch (error) {
          console.error("Lakshya AI stream error", error);
          controller.error(error);
        }
      },
    });

    return new Response(bodyStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Lakshya AI error", error);
    return Response.json(
      { error: "AI service is temporarily unavailable. Please try again in a moment." },
      { status: 503 },
    );
  }
}
