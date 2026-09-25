import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.OPENROUTER_MODEL || "cohere/north-mini-code:free";

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
        { error: "OpenRouter AI is not connected on this deployment yet. Add OPENROUTER_API_KEY in Vercel." },
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

    let webContext = "";
    let sources: { title: string; url: string }[] = [];
    type WebResult = { title?: unknown; url?: unknown; content?: unknown };

    const tavilyKey = process.env.TAVILY_API_KEY;
    if (tavilyKey) {
      try {
        const searchResponse = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: message.slice(0, 1200),
            search_depth: "basic",
            max_results: 5,
            include_answer: false,
            include_raw_content: false,
          }),
        });

        const searchData = await searchResponse.json().catch(() => null);
        if (searchResponse.ok && Array.isArray(searchData?.results)) {
          sources = searchData.results
            .filter((item: unknown): item is { title?: unknown; url?: unknown; content?: unknown } => {
              if (typeof item !== "object" || item === null) return false;
              const candidate = item as { title?: unknown; url?: unknown; content?: unknown };
              return typeof candidate.url === "string" && typeof candidate.content === "string";
            })
            .slice(0, 5)
            .map((item: WebResult) => ({
              title: typeof item.title === "string" && item.title.trim() ? item.title.trim() : item.url as string,
              url: item.url as string,
            }));

          webContext = sources
            .map((source, index) => {
              const result = searchData.results[index];
              return `[Web source ${index + 1}] ${source.title}\nURL: ${source.url}\nSnippet: ${String(result?.content || "").slice(0, 2200)}`;
            })
            .join("\n\n");
        }
      } catch (searchError) {
        console.error("OpenRouter web search error", searchError);
      }
    }

    const messages = [
      {
        role: "system",
        content:
          "You are the OpenRouter AI assistant inside Lakshya. Answer clearly and concisely. Match the student's language (Hindi, Hinglish, or English). You have website access through Lakshya's web search layer. When web context is provided, use it for current or factual web questions, do not invent facts, and add a Sources section at the end with the most relevant source title and exact URL. If web context is unavailable, answer from your model knowledge and say when current verification would be needed." +
          (webContext ? `\n\nLIVE WEBSITE CONTEXT:\n${webContext}` : ""),
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
        "X-Title": "Lakshya OpenRouter AI",
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
      console.error("OpenRouter error", response.status, data);
      return NextResponse.json(
        { error: "OpenRouter AI could not respond right now. Check the OpenRouter key/model connection." },
        { status: 502 },
      );
    }

    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "OpenRouter returned an empty response. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ text: text.trim(), model: MODEL, webAccess: Boolean(tavilyKey), sources });
  } catch (error) {
    console.error("OpenRouter test route error", error);
    return NextResponse.json(
      { error: "OpenRouter AI is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
