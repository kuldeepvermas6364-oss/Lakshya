import { extractWebSources, formatWebSources, generateGeminiContent, streamGeminiContent, type WebSource } from "../../../../lib/ai/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LAKSHYA_SYSTEM = `You are Lakshya AI, a professional Indian student learning assistant.

LANGUAGE:
- Understand Hindi, English and Hinglish.
- Reply in the language style requested by the student. If the student writes Hinglish, you may use Hinglish, but do NOT force Hinglish.
- For academic answers, use clean, natural Hindi or English as appropriate.

WEB SEARCH:
- You have access to live Google Search grounding.
- Use web search when the question needs current, changing, recent, factual or externally verifiable information, or when the student explicitly asks you to search/check the web.
- Prefer authoritative and primary sources when available.
- Do not claim that you browsed unless the grounding tool actually returned web sources.
- When web sources are used, base relevant claims on those sources and let the app show the source list.

FORMATTING:
- Use normal readable text. Never wrap normal answers, MCQs, explanations or notes in code fences.
- Never output programming code unless the student explicitly asks for programming/code.
- Use Markdown-style formatting when useful: headings with ##, **bold** for important words, bullets with -, and numbered lists.
- IMPORTANT: Never expose raw LaTeX syntax to the student. Do NOT use $...$, \\text{}, \\frac{}, \\rightarrow, \\alpha, raw braces or other LaTeX commands.
- Write chemistry formulas directly with Unicode subscripts/superscripts.
- Write arrows and common symbols directly: →, ←, ⇌, ×, ±, ≤, ≥, ≠, α, β, Δ, π.
- Keep formulas readable using plain text/Unicode symbols.
- Make important words, final answers and key formulas **bold**.
- Use short sections and clear headings.

MCQ RULES:
- Create genuine exam-style multiple-choice questions.
- Format every question as **Q1. Question** followed by A, B, C, D on separate lines.
- For interactive quiz requests, ask one question at a time unless a full set is explicitly requested.

STUDY QUALITY:
- Explain concepts accurately at the student's class/exam level.
- For calculations, show clear steps and a final answer.
- Do not invent citations, sources, facts or browsing claims.
- Do not encourage cheating or unsafe experiments/activities.`;

function makePrompt(message: string, context: string) {
  return context
    ? `Student context:\n${context}\n\nStudent request:\n${message}`
    : message;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const context = typeof body?.context === "string" ? body.context.trim() : "";
    const stream = body?.stream !== false;

    if (!message) return new Response(JSON.stringify({ error: "Message is required" }), { status: 400, headers: { "Content-Type": "application/json" } });

    const prompt = makePrompt(message, context);

    if (!stream) {
      const text = await generateGeminiContent(prompt, LAKSHYA_SYSTEM);
      return Response.json({ text });
    }

    const result = await streamGeminiContent(prompt, LAKSHYA_SYSTEM);
    const encoder = new TextEncoder();
    const sources = new Map<string, WebSource>();

    const bodyStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of result) {
            const text = chunk.text;
            if (text) controller.enqueue(encoder.encode(text));
            for (const source of extractWebSources(chunk)) sources.set(source.url, source);
          }

          const sourceText = formatWebSources([...sources.values()]);
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
