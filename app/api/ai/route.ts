import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function POST(request: Request) {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({ error: "AI service is not configured." }, { status: 503 });
    const body = await request.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    const ai = new GoogleGenerativeAI(key);
    const model = ai.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(prompt);
    return NextResponse.json({ text: result.response.text(), model: MODEL });
  } catch (error) {
    console.error("Gemini request failed", error);
    return NextResponse.json({ error: "AI is temporarily unavailable. Please try again." }, { status: 500 });
  }
}
