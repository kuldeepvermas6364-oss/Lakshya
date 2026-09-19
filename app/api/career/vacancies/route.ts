import { generateGeminiContent, searchWeb } from "../../../../lib/ai/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PROMPT = [
  "You are Lakshya daily vacancy researcher for India.",
  "Use the supplied fresh web sources to identify CURRENT, ACTIVE government and public-sector recruitment opportunities.",
  "Prioritize official .gov.in, .nic.in, official commission, railway, banking and government recruitment domains.",
  "Return ONLY a valid JSON array, no markdown.",
  "Each item: title, organization, level, sector, location, status, deadline, pay, description, official, notification.",
  "Exclude passed deadlines. Never invent dates, salary, eligibility, vacancy counts or URLs.",
  "Use exact official URLs from the supplied sources. If unknown, say See official notice.",
  "Prefer 10th, 12th, diploma and graduate opportunities.",
  "Today is " + new Date().toISOString().slice(0, 10),
].join("\n");

function parseJson(value: string): any[] {
  try {
    const parsed = JSON.parse(value.trim());
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const start = value.indexOf("[");
    const end = value.lastIndexOf("]");
    if (start >= 0 && end > start) {
      try {
        const parsed = JSON.parse(value.slice(start, end + 1));
        return Array.isArray(parsed) ? parsed : [];
      } catch {}
    }
    return [];
  }
}

function safeUrl(value: unknown): string {
  return typeof value === "string" && /^https?:\/\//i.test(value) ? value : "";
}

async function refresh() {
  const sources = await searchWeb("India current government recruitment vacancies 10th 12th diploma graduate official notification 2026");
  const sourceContext = sources.map((source, index) =>
    "SOURCE " + (index + 1) + "\nTitle: " + source.title + "\nURL: " + source.url + "\nExcerpt: " + (source.content || "")
  ).join("\n\n");

  const response = await generateGeminiContent(
    PROMPT + "\n\nFRESH WEB SOURCES:\n" +
    (sourceContext || "No external search source was available. Return an empty array rather than inventing vacancies.")
  );

  const verifiedAt = new Date().toISOString();
  const seen = new Set<string>();
  const vacancies = parseJson(response).map((item: any, index: number) => {
    const official = safeUrl(item && item.official);
    const notification = safeUrl(item && item.notification) || official;
    if (!item || !item.title || !official) return null;
    const key = (official + "|" + String(item.title)).toLowerCase();
    if (seen.has(key)) return null;
    seen.add(key);
    return {
      id: "live-" + index + "-" + Buffer.from(key).toString("base64url").slice(0, 18),
      title: String(item.title),
      organization: String(item.organization || "Government / Recruitment Authority"),
      level: String(item.level || "See official notice"),
      sector: String(item.sector || "National"),
      location: String(item.location || "India"),
      status: String(item.status || "Open"),
      deadline: String(item.deadline || "See official notice"),
      pay: String(item.pay || "See official notice"),
      description: String(item.description || "Current opportunity. Verify details in the official notice."),
      official, notification, verifiedAt,
    };
  }).filter(Boolean).slice(0, 60);

  return {
    vacancies,
    sources: sources.map(source => ({ title: source.title, url: source.url })),
    refreshedAt: verifiedAt,
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  const isCron = Boolean(cronSecret) && authorization === "Bearer " + cronSecret;

  if (requestUrl.searchParams.get("refresh") !== "1" && !isCron) {
    return Response.json({
      ok: true,
      mode: "live",
      message: "Career vacancy feed is refreshed automatically every day.",
    });
  }

  try {
    return Response.json({
      ok: true,
      mode: "live",
      ...(await refresh()),
      note: "Fresh web research. Verify every application on the official notification.",
    });
  } catch (error) {
    console.error("Career vacancy refresh failed", error);
    return Response.json(
      { ok: false, error: "Career refresh temporarily unavailable." },
      { status: 503 }
    );
  }
}
