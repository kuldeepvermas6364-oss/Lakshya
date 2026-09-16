import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
export const gemini = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Faster everyday-study default. GEMINI_MODEL can still override this in Vercel.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const FALLBACK_MODELS = [
  GEMINI_MODEL,
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
].filter((value, index, all) => all.indexOf(value) === index);

const REQUEST_TIMEOUT_MS = 12000;

export function getGeminiModel(systemInstruction?: string, modelName = GEMINI_MODEL) {
  if (!gemini) throw new Error("GEMINI_API_KEY or AI_API_KEY is not configured");
  return gemini.getGenerativeModel({
    model: modelName,
    ...(systemInstruction ? { systemInstruction } : {}),
  });
}

function isTransientGeminiError(error: unknown) {
  const text = error instanceof Error ? error.message : String(error);
  return /(?:\b408\b|\b429\b|\b500\b|\b502\b|\b503\b|\b504\b|high demand|overloaded|temporarily unavailable|deadline exceeded|timeout|timed out)/i.test(text);
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
  let lastError: unknown;

  // No repeated retries: a failed/slow model moves quickly to the next current Flash model.
  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = getGeminiModel(systemInstruction, modelName);
      const result = await withTimeout(model.generateContent(prompt), REQUEST_TIMEOUT_MS);
      return result.response.text();
    } catch (error) {
      lastError = error;
      if (!isTransientGeminiError(error)) throw error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini is temporarily unavailable. Please try again.");
}
