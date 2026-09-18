import { NextResponse } from "next/server";
import { generateStudyAIContent } from "../../../../lib/ai/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `You are Lakshya AI's study-planning engine.
You create realistic academic schedules for the authenticated student. Never mention any underlying AI provider/model.

Return ONLY valid JSON. No Markdown, no code fences.

Schema:
{
  "ready": boolean,
  "questions": string[],
  "planTitle": string,
  "tasks": [
    {
      "title": string,
      "subjectId": string,
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "durationMinutes": number
    }
  ],
  "summary": string
}

Rules:
- If essential information is missing, set ready=false, return 1-4 concise questions, and tasks=[].
- If enough information is available, set ready=true and create the plan.
- Never invent unavailable student commitments. Ask for missing schedule constraints when they materially affect the plan.
- Respect the student's requested date/range and available hours.
- Use realistic blocks, normally 25-120 minutes each, with reasonable spacing.
- Keep subjectId compatible with: Physics, Chemistry, Mathematics, Practice, Revision, Other.
- If a requested subject is Biology or English/Hindi, use Other unless the existing planner is later expanded.
- Do not create tasks outside the requested date range.
- Do not schedule overlapping sessions.
- Keep plans achievable rather than filling every minute.
- The student can later confirm the plan; do not assume confirmation.`;

function extractJson(text: string) {
  const cleaned = text.trim().replace(/^\`\`\`(?:json)?\s*/i, "").replace(/\s*\`\`\`$/i, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Planner returned invalid data");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const context = typeof body?.context === "string" ? body.context.trim() : "";
    const today = typeof body?.today === "string" ? body.today : new Date().toISOString().slice(0, 10);

    if (!message) return NextResponse.json({ error: "Plan request is required" }, { status: 400 });

    const prompt = `Today's local date: ${today}

Student context:
${context || "No extra student context supplied."}

Planning request:
${message}

Decide whether you have enough information. If not, ask only for the missing information. If yes, produce a complete schedule.`;

    const raw = await generateStudyAIContent(prompt, SYSTEM);
    const data = extractJson(raw);

    if (!Array.isArray(data.questions)) data.questions = [];
    if (!Array.isArray(data.tasks)) data.tasks = [];
    data.ready = Boolean(data.ready && data.tasks.length);
    data.tasks = data.tasks.slice(0, 60).map((task: Record<string, unknown>) => ({
      title: String(task.title || "Study session").trim(),
      subjectId: String(task.subjectId || "Other").trim(),
      date: String(task.date || today).trim(),
      time: String(task.time || "18:00").trim(),
      durationMinutes: Math.max(5, Math.min(180, Number(task.durationMinutes) || 60)),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Lakshya planner AI error", error);
    return NextResponse.json(
      { error: "I could not build the plan right now. Please try again." },
      { status: 503 },
    );
  }
}
