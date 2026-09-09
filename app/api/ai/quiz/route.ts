import { NextResponse } from "next/server";
import { getGeminiModel } from "../../../../lib/ai/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const chapter = typeof body?.chapter === "string" ? body.chapter.trim() : "";
    if (!subject || !chapter) return NextResponse.json({ error: "Subject and chapter are required." }, { status: 400 });

    const model = getGeminiModel("You are Lakshya AI, an academic quiz generator for Class 12 PCM students. Generate accurate, syllabus-aligned questions. Return ONLY valid JSON, no markdown.");
    const prompt = `Create 5 original multiple-choice questions for ${subject}, chapter: ${chapter}. Mix conceptual and numerical/JEE-style questions where appropriate. Each question must have exactly 4 options and one correct option index (0-3). Include a short explanation. Return this exact JSON shape: {"questions":[{"question":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."}]}`;
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const data = JSON.parse(raw);
    if (!Array.isArray(data?.questions) || !data.questions.length) throw new Error("Invalid quiz response");
    const questions = data.questions.slice(0, 5).map((q: any) => ({
      question: String(q.question || ""),
      options: Array.isArray(q.options) ? q.options.slice(0, 4).map(String) : [],
      answer: Math.max(0, Math.min(3, Number(q.answer) || 0)),
      explanation: String(q.explanation || "")
    })).filter((q: any) => q.question && q.options.length === 4);
    return NextResponse.json({ subject, chapter, questions });
  } catch (error) {
    console.error("Lakshya quiz generation error", error);
    return NextResponse.json({ error: "Could not generate this quiz right now. Please try again." }, { status: 500 });
  }
}
