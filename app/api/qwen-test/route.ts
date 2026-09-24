import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type IncomingChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Qwen test AI is not connected on this deployment yet. Add OPENROUTER_API_KEY in Vercel." },
        { status: 503 },
      );
    }

    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const incoming = Array.isArray(body?.messages) ? body.messages : [];

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const history: ChatMessage[] = incoming
      .filter((item: unknown): item is IncomingChatMessage => {
        if (typeof item !== "object" || item === null) return false;
        const candidate = item as { role?: unknown; content?: unknown };
        return (
          (candidate.role === "user" || candidate.role === "assistant") &&
          typeof candidate.content === "string"
        );
      })
      .slice(-10)
      .map((item: IncomingChatMessage): ChatMessage => ({
        role: item.role,
        content: item.content.slice(0, 6000),
      }));

    const messages = [
      {
        role: "system",
        content:
          "You are the Qwen test assistant inside Lakshya. Answer clearly and concisely. Match the student's language (Hindi, Hinglish, or English). This page is only for testing the connected Qwen model.",
      },
      ...history,
      { role: "user", content: message.slice(0, 8000) },
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lakshya.vercel.app",
        "X-Title": "Lakshya Qwen Test",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.4,
        max_tokens: 1200,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("Qwen/OpenRouter error", response.status, data);
      return NextResponse.json(
        { error: "Qwen test AI could not respond right now. Check the OpenRouter key/model connection." },
        { status: 502 },
      );
    }

    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Qwen returned an empty response. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ text: text.trim(), model: MODEL });
  } catch (error) {
    console.error("Qwen test route error", error);
    return NextResponse.json(
      { error: "Qwen test AI is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
