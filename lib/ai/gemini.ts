import { GoogleGenerativeAI } from "@google/generative-ai";

// Support both names so existing Vercel configuration keeps working.
const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

export const gemini = apiKey ? new GoogleGenerativeAI(apiKey) : null;
// Gemini 3.8 Flash is the primary model. Fallbacks keep the app resilient to temporary capacity spikes.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_MODELS = [GEMINI_MODEL, "gemini-3.7-flash", "gemini-3.5-flash-lite"].filter((value, index, all) => all.indexOf(value) === index);

export function getGeminiModel(systemInstruction?: string, modelName = GEMINI_MODEL) {
  if (!gemini) throw new Error("GEMINI_API_KEY or AI_API_KEY is not configured");
  return gemini.getGenerativeModel({
    model: modelName,
    ...(systemInstruction ? { systemInstruction } : {}),
  });
}

function isTransientGeminiError(error: unknown) {
  const text = error instanceof Error ? error.message : String(error);
  return /(?:\b429\b|\b500\b|\b502\b|\b503\b|\b504\b|high demand|overloaded|temporarily unavailable|deadline exceeded)/i.test(text);
}

export async function generateGeminiContent(prompt: string, systemInstruction?: string) {
  if (!gemini) throw new Error("GEMINI_API_KEY or AI_API_KEY is not configured");
  let lastError: unknown;
  for (let index = 0; index < FALLBACK_MODELS.length; index += 1) {
    const model = getGeminiModel(systemInstruction, FALLBACK_MODELS[index]);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        lastError = error;
        if (!isTransientGeminiError(error)) throw error;
        if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Gemini is temporarily unavailable");
}
