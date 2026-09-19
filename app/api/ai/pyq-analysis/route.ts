import { NextResponse } from "next/server";
import { generateGeminiContent, searchWeb } from "../../../../lib/ai/gemini";

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
    ].filter(Boolean).join(" ");

    const sources = await searchWeb(query);
    const sourceText = sources.slice(0, 10).map((s, i) =>
      "SOURCE " + (i + 1) + "\nTitle: " + s.title + "\nURL: " + s.url + "\nContent: " + (s.content || "")
    ).join("\n\n");

    const prompt = `You are Lakshya's PYQ Intelligence Engine.
Analyze the supplied previous-year-paper sources for ${exam}, subject ${subject}, chapter/topic ${chapter}.
Do NOT claim to know the future paper. Create a high-priority TREND-BASED PRACTICE PAPER from recurring concepts, question styles, chapter weight patterns and difficulty patterns found in the sources.
Use original wording; never copy a source question verbatim.
Language: ${language}. Generate exactly ${count} MCQs.
Each must have 4 options, one answer index 0-3 and a concise teaching explanation.
Also return an analysis with recurringTopics, highPriorityConcepts, patternSummary, difficultyMix and sourceNotes.
If evidence is weak or a source is not an actual paper, say so in sourceNotes rather than inventing trends.
Return ONLY valid JSON:
{"analysis":{"recurringTopics":[],"highPriorityConcepts":[],"patternSummary":"","difficultyMix":"","sourceNotes":[]},"questions":[{"question":"","options":["","","",""],"answer":0,"explanation":"","importance":"High","topic":""}]}
${sourceText ? "\n\nSOURCES:\n" + sourceText : "\n\nNo usable web sources were found. Return a transparent empty analysis and no fabricated paper."}`;

    const raw = await generateGeminiContent(prompt);
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
