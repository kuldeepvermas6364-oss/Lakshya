import { getGeminiClient, GEMINI_MODEL, extractWebSources } from "../../../../lib/ai/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const RESEARCH_PROMPT = [
  "You are Lakshya daily vacancy researcher for India.",
  "Search the web NOW for CURRENT, ACTIVE government and public-sector recruitment opportunities.",
  "Cover national/central sources and state/UT sources across India.",
  "Prioritize official .gov.in, .nic.in, official commission, railway, banking and government recruitment domains.",
  "Return ONLY a valid JSON array, no markdown.",
  "Each item: title, organization, level, sector, location, status, deadline, pay, description, official, notification.",
  "Include only open/active opportunities or still-relevant official recruitment calendars/notices.",
  "Exclude passed deadlines. Never invent dates, salary, eligibility, vacancy counts or URLs.",
  "Use exact official URLs. If a detail is unavailable, say See official notice.",
  "Prefer 10th, 12th, diploma and graduate opportunities.",
  "Today is " + new Date().toISOString().slice(0,10),
].join("\n");

function parseJson(text: string): any[] {
  const cleaned = text.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start >= 0 && end > start) { try { return JSON.parse(cleaned.slice(start, end + 1)); } catch {} }
  return [];
}

function url(value: unknown) { return typeof value === "string" && /^https?:\/\//i.test(value) ? value : ""; }

async function refresh() {
  const client = getGeminiClient();
  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: RESEARCH_PROMPT,
    config: { tools: [{ googleSearch: {} }], temperature: 0.1 } as any,
  });
  const verifiedAt = new Date().toISOString();
  const seen = new Set<string>();
  const vacancies = parseJson(response.text || []).map((v: any, i: number) => {
    const official = url(v?.official);
    const notification = url(v?.notification) || official;
    if (!v?.title || !official) return null;
    const key = (official + "|" + String(v.title)).toLowerCase();
    if (seen.has(key)) return null;
    seen.add(key);
    return { id: "live-" + i + "-" + Buffer.from(key).toString("base64url").slice(0,18), title: String(v.title), organization: String(v.organization || "Government / Recruitment Authority"), level: String(v.level || "See official notice"), sector: String(v.sector || "National"), location: String(v.location || "India"), status: String(v.status || "Open"), deadline: String(v.deadline || "See official notice"), pay: String(v.pay || "See official notice"), description: String(v.description || "Current opportunity. Verify details in the official notice."), official, notification, verifiedAt };
  }).filter(Boolean).slice(0,60);
  return { vacancies, sources: extractWebSources(response), refreshedAt: verifiedAt };
}

export async function GET(request: Request) {
  const urlObj = new URL(request.url);
  if (urlObj.searchParams.get("refresh") !== "1") return Response.json({ ok: true, mode: "live", message: "Use refresh=1 for a fresh official-source search." });
  try {
    const result = await refresh();
    return Response.json({ ok: true, mode: "live", ...result, note: "Fresh AI web research. Verify every application on the official notification." });
  } catch (error) {
    console.error("Career vacancy refresh failed", error);
    return Response.json({ ok: false, error: "Career refresh temporarily unavailable." }, { status: 503 });
  }
}