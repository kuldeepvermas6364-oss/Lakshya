import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
export const gemini = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Fast everyday-study model. Override in Vercel with GEMINI_MODEL when needed.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const REQUEST_TIMEOUT_MS = 15000;

export function getGeminiModel(systemInstruction?: string, modelName = GEMINI_MODEL) {
  if (!gemini) throw new Error("GEMINI_API_KEY or AI_API_KEY is not configured");
  return gemini.getGenerativeModel({
    model: modelName,
    ...(systemInstruction ? { systemInstruction } : {}),
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Gemini request timed out after ${ms / 1000}s`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export async function generateGeminiContent(prompt: string, systemInstruction?: string) {
  if (!gemini) throw new Error("GEMINI_API_KEY or AI_API_KEY is not configured");
  const model = getGeminiModel(systemInstruction);
  const result = await withTimeout(model.generateContent(prompt), REQUEST_TIMEOUT_MS);
  return result.response.text();
}

/** Stream Gemini output immediately so the UI can render the answer while it is being generated. */
export async function streamGeminiContent(prompt: string, systemInstruction?: string) {
  if (!gemini) throw new Error("GEMINI_API_KEY or AI_API_KEY is not configured");
  const model = getGeminiModel(systemInstruction);
  return model.generateContentStream(prompt);
}
