import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const POLLINATIONS_ENDPOINT = "https://gen.pollinations.ai/v1/chat/completions";
const POLLINATIONS_IMAGE_ENDPOINT = "https://image.pollinations.ai/prompt";
const POLLINATIONS_SECRET_KEY =
  process.env.POLLINATIONS_SECRET_KEY?.trim() ||
  process.env.POLLINATIONS_API_KEY?.trim();

type FeatureType = "chat" | "code" | "reasoning" | "image";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      message?: unknown;
      messages?: unknown;
      context?: unknown;
      language?: unknown;
      featureType?: unknown;\n      model?: unknown;
    } | null;

    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const featureType: FeatureType =
      body?.featureType === "code" ||
      body?.featureType === "reasoning" ||
      body?.featureType === "image"
        ? body.featureType
        : "chat";

    const context = typeof body?.context === "string" ? body.context.trim() : "";
    const language = typeof body?.language === "string" ? body.language : "hi-en";

    const languageName: Record<string, string> = {
      "hi-en": "Hindi + English (natural Hinglish)",
      hi: "Hindi",
      en: "English",
      bn: "Bengali",
      mr: "Marathi",
      te: "Telugu",
      ta: "Tamil",
      gu: "Gujarati",
      kn: "Kannada",
      ml: "Malayalam",
      pa: "Punjabi",
      or: "Odia",
      as: "Assamese",
      ur: "Urdu",
    };

    const history = Array.isArray(body?.messages) ? body.messages : [];
    const cleanHistory = history
      .filter(
        (item): item is { role: string; content: string } =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as { role?: unknown }).role === "string" &&
          typeof (item as { content?: unknown }).content === "string",
      )
      .slice(-12)
      .map((item) => ({
        role: item.role === "assistant" ? "assistant" : "user",
        content: item.content,
      }));

    // Keep the exact Pollinations model slugs requested for each UI mode.
    const modelByFeature: Record<FeatureType, string> = {
      chat: "openai",
      code: "laguna",
      reasoning: "deepseek-pro",
      image: "flux",
    };

    const selectedModel = requestedModel || modelByFeature[featureType];

    if (featureType === "image") {
      // Keep Pollinations' original direct image server flow.
      // The browser receives the image.pollinations.ai URL directly instead of
      // proxying the image through the Lakshya server as base64.
      const imageUrl =
        POLLINATIONS_IMAGE_ENDPOINT +
        "/" +
        encodeURIComponent(message) +
        "?width=1024&height=1024&nologo=true";

      return NextResponse.json({
        image: imageUrl,
        output: imageUrl,
        type: "image",
        provider: "Pollinations AI",
        model: selectedModel,
        featureType,
      });
    }

    const modeInstruction =
      featureType === "code"
        ? "You are a Senior Code Expert using Laguna. Write clean, production-quality code and briefly explain important choices."
        : featureType === "reasoning"
          ? "You are a reasoning expert using DeepSeek Pro. Solve difficult problems carefully and present the useful reasoning summary and conclusion without exposing private chain-of-thought."
          : "You are Pollinations AI Chat using OpenAI. Give clear, friendly and accurate educational answers.";

    const system = [
      "You are Pollinations AI inside the Lakshya student education app.",
      "Help students with learning, explanations, practice, revision and study planning.",
      "Be accurate, concise, friendly and student-safe. Never pretend to have performed an action you did not perform.",
      "Preferred response language: " + (languageName[language] || languageName["hi-en"]) + ".",
      context ? "Current Lakshya study context: " + context : "",
      modeInstruction,
    ]
      .filter(Boolean)
      .join("\n");

    const response = await fetch(POLLINATIONS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + POLLINATIONS_SECRET_KEY,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: system },
          ...cleanHistory,
          { role: "user", content: message },
        ],
        stream: false,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(55000),
    });

    const raw = await response.text();

    if (!response.ok) {
      console.error(
        "Pollinations chat failed:",
        response.status,
        raw.slice(0, 1000),
      );
      return NextResponse.json(
        {
          error: `Pollinations AI request failed (HTTP ${response.status}). Please try again.`,
        },
        { status: 502 },
      );
    }

    let data: {
      choices?: Array<{ message?: { content?: unknown } }>;
    };

    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json({
        text: raw.trim(),
        output: raw.trim(),
        provider: "Pollinations AI",
        model: selectedModel,
        featureType,
      });
    }

    const text = data.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Pollinations AI returned an empty response." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      text,
      output: text,
      provider: "Pollinations AI",
      model: selectedModel,
      featureType,
    });
  } catch (error) {
    console.error("Pollinations chat route error", error);
    return NextResponse.json(
      { error: "Pollinations AI is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
