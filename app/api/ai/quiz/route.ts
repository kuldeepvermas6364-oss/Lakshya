import { NextResponse } from "next/server";
import { generateGeminiContent } from "../../../../lib/ai/gemini";
import { cleanAIText } from "../../../../lib/ai/format";

const allowedLevels = new Set(["Foundation", "JEE", "Challenge"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const chapter = typeof body?.chapter === "string" ? body.chapter.trim() : "";
    const difficulty = typeof body?.difficulty === "string" && allowedLevels.has(body.difficulty) ? body.difficulty : "JEE";
    if (!subject || !chapter) return NextResponse.json({ error: "Subject and chapter are required." }, { status: 400 });

    const prompt = `Create 5 original multiple-choice questions for ${subject}, chapter: ${chapter}. Difficulty: ${difficulty}. Foundation = board/fundamentals, JEE = competitive exam level with strong concepts and calculations, Challenge = advanced multi-step JEE-style reasoning. Mix conceptual and numerical questions where appropriate. Each question must have exactly 4 options and one correct option index (0-3). Include a short explanation that teaches the concept. Avoid ambiguous questions, duplicate options, and unsupported facts. IMPORTANT: Never use LaTeX syntax. Write formulas with Unicode subscripts/superscripts and symbols. Return this exact JSON shape: {"questions":[{"question":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."}]}`;
    const raw = (await generateGeminiContent(prompt, "You are Lakshya AI, an academic quiz generator for Class 12 PCM students. Generate accurate, syllabus-aligned questions. Never output LaTeX. Return ONLY valid JSON, no markdown.")).trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const data = JSON.parse(raw);
    if (!Array.isArray(data?.questions) || !data.questions.length) throw new Error("Invalid quiz response");
    const questions = data.questions.slice(0, 5).map((q: any) => ({
      question: cleanAIText(String(q.question || "").trim()),
      options: Array.isArray(q.options) ? q.options.slice(0, 4).map(String).map((x:string)=>cleanAIText(x.trim())) : [],
      answer: Math.max(0, Math.min(3, Number(q.answer) || 0)),
      explanation: cleanAIText(String(q.explanation || "").trim())
    })).filter((q: any) => q.question && q.options.length === 4 && q.options.every(Boolean));
    if (!questions.length) throw new Error("No valid quiz questions");
    return NextResponse.json({ subject, chapter, difficulty, questions });
  } catch (error) {
    console.error("Lakshya quiz generation error", error);
    const message = error instanceof Error ? error.message : String(error);
    const status = /API_KEY|not configured/i.test(message) ? 503 : 500;
    return NextResponse.json({ error: status === 503 ? "Lakshya AI is not connected on this deployment yet." : "Could not generate this quiz right now. Please try again." }, { status });
  }
}
