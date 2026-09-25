import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const POLLINATIONS_ENDPOINT = "https://gen.pollinations.ai/v1/chat/completions";
const POLLINATIONS_IMAGE_ENDPOINT = "https://image.pollinations.ai/prompt";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { message?: unknown; messages?: unknown; context?: unknown; language?: unknown; featureType?: unknown } | null;
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const context = typeof body?.context === "string" ? body.context.trim() : "";
    const language = typeof body?.language === "string" ? body.language : "hi-en";
    const featureType = body?.featureType === "code" || body?.featureType === "image" ? body.featureType : "chat";
    const history = Array.isArray(body?.messages) ? body.messages : [];
    if (!message) return NextResponse.json({ error: "Message is required." }, { status: 400 });

    const languageName: Record<string, string> = { "hi-en":"Hindi + English (natural Hinglish)", hi:"Hindi", en:"English", bn:"Bengali", mr:"Marathi", te:"Telugu", ta:"Tamil", gu:"Gujarati", kn:"Kannada", ml:"Malayalam", pa:"Punjabi", or:"Odia", as:"Assamese", ur:"Urdu" };
    const system = [
      "You are Pollinations AI inside the Lakshya student education app.",
      "Help students with learning, explanations, practice, revision and study planning.",
      "Be accurate, concise, friendly and student-safe. Never pretend to have performed an action you did not perform.",
      "Preferred response language: " + (languageName[language] || languageName["hi-en"]) + ".",
      context ? "Current Lakshya study context: " + context : "",
    ].filter(Boolean).join("\n");

    const cleanHistory = history
      .filter((item): item is { role: string; content: string } => typeof item === "object" && item !== null && typeof (item as { role?: unknown }).role === "string" && typeof (item as { content?: unknown }).content === "string")
      .slice(-12)
      .map((item) => ({ role: item.role === "assistant" ? "assistant" : "user", content: item.content }));
    if (featureType === "image") {
      const imageUrl = `${POLLINATIONS_IMAGE_ENDPOINT}/${encodeURIComponent(message)}?width=1024&height=1024&nologo=true`;
      const imageResponse = await fetch(imageUrl, { cache: "no-store", headers: { Accept: "image/*", "User-Agent": "Lakshya-AI/1.0" }, signal: AbortSignal.timeout(55000) });
      if (!imageResponse.ok) return NextResponse.json({ error: `Pollinations image generation failed (HTTP ${imageResponse.status}).` }, { status: 502 });
      const contentType = imageResponse.headers.get("content-type") || "image/png";
      if (!contentType.startsWith("image/")) return NextResponse.json({ error: "Pollinations returned an invalid image response." }, { status: 502 });
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      return NextResponse.json({ image: `data:${contentType};base64,${imageBuffer.toString("base64")}`, type: "image", provider: "Pollinations AI" });
    }

    if (!apiKey) return NextResponse.json({ error: "Pollinations AI chat is not configured on the server yet." }, { status: 503 });

    const modeInstruction = featureType === "code"
      ? "You are in Code Expert mode. Give production-quality code, explain important choices briefly, and prefer complete working solutions."
      : "You are in Chat mode. Give clear, friendly educational answers for students.";
    const messages = [{ role: "system", content: system + "\n" + modeInstruction }, ...cleanHistory, { role: "user", content: message }];
    const apiKey = process.env.POLLINATIONS_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: "Pollinations AI is not configured on the server yet." }, { status: 503 });
    }

    const response = await fetch(POLLINATIONS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(apiKey ? { Authorization: "Bearer " + apiKey } : {}) },
      body: JSON.stringify({ model: process.env.POLLINATIONS_MODEL?.trim() || "openai", messages, stream: false }),
      cache: "no-store",
      signal: AbortSignal.timeout(55000),
    });
    const raw = await response.text();
    if (!response.ok) {
      console.error("Pollinations chat failed:", response.status, raw.slice(0, 1000));
      return NextResponse.json({ error: "Pollinations AI request failed (HTTP " + response.status + "). Please try again." }, { status: 502 });
    }
    let data: { choices?: Array<{ message?: { content?: unknown } }> };
    try { data = JSON.parse(raw); } catch { return NextResponse.json({ text: raw.trim(), provider: "Pollinations AI" }); }
    const text = data.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) return NextResponse.json({ error: "Pollinations AI returned an empty response." }, { status: 502 });
    return NextResponse.json({ text, provider: "Pollinations AI", model: process.env.POLLINATIONS_MODEL?.trim() || "openai" });
  } catch (error) {
    console.error("Pollinations chat route error", error);
    return NextResponse.json({ error: "Pollinations AI is temporarily unavailable. Please try again." }, { status: 503 });
  }
}