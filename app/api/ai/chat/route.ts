import { NextResponse } from "next/server";
import { getGeminiModel } from "../../../../lib/ai/gemini";
import { buildSystemPrompt } from "../../../../lib/ai/prompts";
import type { AIAction, AIContext } from "../../../../lib/ai/types";

export const runtime = "nodejs";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_CONTEXT_LENGTH = 1800;
const VALID_ACTIONS: AIAction[] = [
  "explain", "hint", "solve", "practice", "quiz", "summary", "revision",
  "mistake_analysis", "study_plan", "performance_analysis", "question_generation", "doubt_help",
];

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const action: AIAction = VALID_ACTIONS.includes(body?.action) ? body.action : "doubt_help";
    const rawContext = body?.context && typeof body.context === "object" ? body.context : {};
    const context: AIContext = {
      className: typeof rawContext.className === "string" ? rawContext.className.slice(0, 80) : undefined,
      examTarget: typeof rawContext.examTarget === "string" ? rawContext.examTarget.slice(0, 80) : undefined,
      language: ["english", "hindi", "hinglish"].includes(rawContext.language) ? rawContext.language : "english",
      subject: typeof rawContext.subject === "string" ? rawContext.subject.slice(0, 80) : undefined,
      chapter: typeof rawContext.chapter === "string" ? rawContext.chapter.slice(0, 120) : undefined,
    };

    if (!message) return errorResponse("BAD_REQUEST", "Please enter a question or request.", 400);
    if (message.length > MAX_MESSAGE_LENGTH) return errorResponse("BAD_REQUEST", "Your request is too long. Please keep it under 4000 characters.", 400);

    const serializedContext = JSON.stringify(context);
    if (serializedContext.length > MAX_CONTEXT_LENGTH) return errorResponse("BAD_REQUEST", "Study context is too large.", 400);

    const model = getGeminiModel(buildSystemPrompt(action, context));
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: message }] }],
      generationConfig: { maxOutputTokens: 1200, temperature: 0.35 },
    });

    const text = result.response.text().trim();
    if (!text) return errorResponse("AI_RESPONSE_INVALID", "Lakshya AI returned an empty response. Please try again.", 502);

    return NextResponse.json({ success: true, text });
  } catch (error) {
    console.error("Lakshya AI error", error instanceof Error ? error.message : "unknown error");
    return errorResponse("AI_UNAVAILABLE", "Lakshya AI is temporarily unavailable. Please try again.", 503);
  }
}
