import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";

const SYSTEM = `You are Lakshya AI, a student learning assistant. Analyze the uploaded image carefully and answer the student's question about it. The image may contain a textbook page, handwritten notes, diagram, graph, equation, question, chart or study material. Describe only what is relevant, solve academic questions step by step, explain diagrams and graphs clearly, and mention uncertainty when the image is unclear. Reply in the student's language (Hindi, English or Hinglish). Never claim to have read text that is not visible.`;

export async function POST(request: Request) {
  try {
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY or AI_API_KEY is not configured" }, { status: 503 });
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "What is shown in this image? Explain it clearly.";
    const image = typeof body?.image === "string" ? body.image : "";
    const mimeType = typeof body?.mimeType === "string" ? body.mimeType : "image/jpeg";
    if (!image) return NextResponse.json({ error: "Image is required" }, { status: 400 });
    const base64 = image.replace(/^data:[^;]+;base64,/, "");
    if (!base64) return NextResponse.json({ error: "Invalid image" }, { status: 400 });
    if (base64.length > 12 * 1024 * 1024) return NextResponse.json({ error: "Image is too large. Please use an image under 9 MB." }, { status: 413 });

    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: modelName, systemInstruction: SYSTEM });
    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      { text: message },
    ]);
    return NextResponse.json({ text: result.response.text() });
  } catch (error) {
    console.error("Lakshya AI vision error", error);
    return NextResponse.json({ error: "I could not analyze that image right now. Please try again." }, { status: 503 });
  }
}
