import { NextResponse } from "next/server";
import { generateGeminiContentWithWebSearch } from "../../../../lib/ai/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const languages = new Set(["English", "Hindi", "Hinglish"]);

function parseJson(text: string) {
  const cleaned = text.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const start = cleaned.indexOf("{"), end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
  throw new Error("Invalid AI response");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const chapter = typeof body?.chapter === "string" ? body.chapter.trim() : "All chapters";
    const exam = typeof body?.exam === "string" ? body.exam.trim() : "JEE";
    const language = languages.has(body?.language) ? body.language : "English";
    const count = Math.max(10, Math.min(30, Number(body?.questionCount) || 20));

    if (!subject) return NextResponse.json({ error: "Subject is required." }, { status: 400 });

    const query = [
      subject, exam, chapter === "All chapters" ? "" : chapter,
      "previous year question paper PYQ official question paper PDF India"
    ].filter(Boolean).join(" ");    const groundedPrompt = [
      query,
      "",
      "You are Lakshya's PYQ Intelligence Engine. Find and use real previous-year question papers and official exam/question-paper sources on the web.",
      "Prefer official NTA, JEE, CBSE/board or other authoritative sources.",
      "Focus specifically on Class 12 Physics Chapter 4 when that is the requested chapter.",
      "Do not invent a paper, trend, URL, date, weightage or question.",
      "Analyze only evidence you can actually find. Generate original questions based on verified patterns; never copy source questions verbatim.",
      "If web evidence is insufficient, return an empty questions array and explain why in sourceNotes.",
      "Language: " + language + ". Generate exactly " + count + " MCQs.",
      "Return ONLY valid JSON: {\"analysis\":{\"recurringTopics\":[],\"highPriorityConcepts\":[],\"patternSummary\":\"\",\"difficultyMix\":\"\",\"sourceNotes\":[]},\"questions\":[{\"question\":\"\",\"options\":[\"\",\"\",\"\",\"\"],\"answer\":0,\"explanation\":\"\",\"importance\":\"High\",\"topic\":\"\"}]}"
    ].join("\n");

    const grounded = await generateGeminiContentWithWebSearch(groundedPrompt);
    const raw = grounded.text;
    const sources = grounded.sources;);
    const data = parseJson(raw);
    const questions = Array.isArray(data?.questions) ? data.questions.slice(0, count).map((q: any) => ({
      question: String(q?.question || "").trim(),
      options: Array.isArray(q?.options) ? q.options.slice(0, 4).map((x: any) => String(x).trim()) : [],
      answer: Math.max(0, Math.min(3, Number(q?.answer) || 0)),
      explanation: String(q?.explanation || "").trim(),
      importance: String(q?.importance || "High"),
      topic: String(q?.topic || "").trim()
    })).filter((q: any) => q.question && q.options.length === 4 && q.options.every(Boolean)) : [];

    return NextResponse.json({
      ok: true,
      exam, subject, chapter, language,
      analysis: data?.analysis || {},
      questions,
      sources: sources.slice(0, 10).map(s => ({ title: s.title, url: s.url })),
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("PYQ analysis error", error);
    return NextResponse.json({ error: "PYQ analysis is temporarily unavailable. Please try again." }, { status: 500 });
  }
}
