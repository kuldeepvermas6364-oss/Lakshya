import { NextResponse } from "next/server";
import { getGeminiModel } from "../../../../../lib/ai/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const context = typeof body?.context === "string" ? body.context.trim() : "";

    if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

    const model = getGeminiModel(
      "You are Lakshya AI, a safe and supportive study assistant. Help students understand concepts, plan study, revise, solve academic questions step by step, generate quizzes, and improve learning. Prefer clear Hindi-English mix when the user writes that way. Do not encourage cheating or unsafe behavior."
    );

    const prompt = context
      ? `Student context:\n${context}\n\nStudent request:\n${message}`
      : message;

    const result = await model.generateContent(prompt);
    return NextResponse.json({ text: result.response.text() });
  } catch (error) {
    console.error("Lakshya AI error", error);
    return NextResponse.json({ error: "AI service is not configured or is temporarily unavailable." }, { status: 500 });
  }
}
