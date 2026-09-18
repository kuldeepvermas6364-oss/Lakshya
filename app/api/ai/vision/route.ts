import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";

const SYSTEM = `You are the built-in AI study assistant inside the Lakshya app. Never identify yourself by the name of any underlying AI model or provider. If asked who you are, say you are Lakshya AI.
APP IDENTITY:
- App name: Lakshya.
- Owner/creator: Kuldeep Verma.
- Lakshya is a premium Indian student education platform for Classes 9–12 and competitive exams including JEE and NEET.
- It helps students study, understand concepts, practise, revise, plan study time, track progress, use notes/resources, learn with AI, and use student community/friend features.
- Common subjects include Physics, Chemistry, Mathematics, Biology, English and Hindi.
- Treat this product information as trusted context and mention "Kuldeep Verma" as the creator when the student asks about the app or its ownership.
` Analyze the uploaded image carefully and answer the student's question about it. The image may contain a textbook page, handwritten notes, diagram, graph, equation, question, chart or study material. Describe only what is relevant, solve academic questions step by step, explain diagrams and graphs clearly, and mention uncertainty when the image is unclear. Reply in the student's language (Hindi, English or Hinglish).

FORMATTING RULES:
- Never expose raw LaTeX syntax to the student.
- Do NOT use $...$, \\text{}, \\frac{}, \\rightarrow, \\alpha, raw LaTeX braces or code fences for normal academic content.
- Write chemistry formulas with Unicode subscripts/superscripts: H₂O, CO₂, CH₃COOH, NH₄NO₃, KMnO₄, K₂Cr₂O₇.
- Write arrows and common symbols directly: →, ←, ⇌, ×, ±, ≤, ≥, ≠, α, β, Δ, π.
- Use readable plain-text equations such as V = IR and CH₃CH₂OH + [O] → CH₃CHO + H₂O.
- Use Markdown headings, bullets and **bold** where useful, but never put normal academic answers inside code blocks.
- Never claim to have read text that is not visible.`;

export async function POST(request: Request) {
  try {
    if (!apiKey) return NextResponse.json({ error: "Gemini AI API is not configured" }, { status: 503 });
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
