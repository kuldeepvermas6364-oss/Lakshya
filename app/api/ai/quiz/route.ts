import { NextResponse } from "next/server";
import { generateGeminiContent } from "../../../../lib/ai/gemini";
import { cleanAIText } from "../../../../lib/ai/format";
import { LAKSHYA_AI_SYSTEM_PROMPT } from "../../../../lib/ai/prompts";

const allowedLevels = new Set(["Foundation", "JEE", "Challenge"]);
const allowedLanguages = new Set(["English", "Hindi", "Hinglish"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const chapter = typeof body?.chapter === "string" ? body.chapter.trim() : "";
    const topic = typeof body?.topic === "string" && body.topic.trim() ? body.topic.trim() : "Whole chapter";
    const language = typeof body?.language === "string" && allowedLanguages.has(body.language) ? body.language : "English";
    const difficulty = typeof body?.difficulty === "string" && allowedLevels.has(body.difficulty) ? body.difficulty : "JEE";
    const questionCount = Math.max(5, Math.min(25, Number(body?.questionCount) || 5));
    const durationMinutes = Math.max(5, Math.min(60, Number(body?.durationMinutes) || 15));
    if (!subject || !chapter) return NextResponse.json({ error: "Subject and chapter are required." }, { status: 400 });

    const languageRule = language === "Hindi"
      ? "Write the questions, options and explanations primarily in natural Hindi. Keep standard academic terms and formulas in English/Unicode when clearer."
      : language === "Hinglish"
        ? "Write naturally in Hinglish: Hindi sentence structure with familiar English academic terms. Do not force Hinglish into formulas or scientific names."
        : "Write entirely in clear, natural English.";

    const prompt = `Create exactly ${questionCount} original multiple-choice questions for ${subject}, chapter: ${chapter}, topic: ${topic}. Difficulty: ${difficulty}. Quiz language: ${language}. Time limit: ${durationMinutes} minutes. ${languageRule} Foundation = board/fundamentals, JEE = competitive exam level with strong concepts and calculations, Challenge = advanced multi-step JEE-style reasoning. Mix conceptual and numerical questions where appropriate. Every question must have exactly 4 options and one correct option index (0-3). Include a short teaching explanation. Stay aligned with the requested chapter/topic. Avoid ambiguous questions, duplicate options, unsupported facts and questions outside the topic. IMPORTANT: Never use LaTeX, Markdown math delimiters, or programming/code syntax. Write formulas with Unicode subscripts/superscripts and symbols, e.g. H₂O, CH₃COOH, x², √2, →, α. Return this exact JSON shape and nothing else: {"questions":[{"question":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."}]}`;
    const raw = (await generateGeminiContent(prompt, `${LAKSHYA_AI_SYSTEM_PROMPT}\n\nQUIZ-SPECIFIC: Generate accurate original academic MCQs, respect the requested language, never output LaTeX, and return ONLY valid JSON.`)).trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const data = JSON.parse(raw);
    if (!Array.isArray(data?.questions) || !data.questions.length) throw new Error("Invalid quiz response");
    const questions = data.questions.slice(0, questionCount).map((q: any) => ({
      question: cleanAIText(String(q.question || "").trim()),
      options: Array.isArray(q.options) ? q.options.slice(0, 4).map(String).map((x:string)=>cleanAIText(x.trim())) : [],
      answer: Math.max(0, Math.min(3, Number(q.answer) || 0)),
      explanation: cleanAIText(String(q.explanation || "").trim())
    })).filter((q: any) => q.question && q.options.length === 4 && q.options.every(Boolean));
    if (!questions.length) throw new Error("No valid quiz questions");
    return NextResponse.json({ subject, chapter, topic, language, difficulty, questionCount: questions.length, durationMinutes, questions });
  } catch (error) {
    console.error("Lakshya quiz generation error", error);
    const message = error instanceof Error ? error.message : String(error);
    const status = /API_KEY|not configured/i.test(message) ? 503 : 500;
    return NextResponse.json({ error: status === 503 ? "Lakshya AI is not connected on this deployment yet." : "Could not generate this quiz right now. Please try again." }, { status });
  }
}
