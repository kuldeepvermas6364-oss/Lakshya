import { GoogleGenerativeAI } from "@google/generative-ai";

// Support both names so existing Vercel configuration keeps working.
const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

export const gemini = apiKey ? new GoogleGenerativeAI(apiKey) : null;
// Gemini 2.5 Flash is no longer available to new users; use the current model.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

export function getGeminiModel(systemInstruction?: string) {
  if (!gemini) throw new Error("GEMINI_API_KEY or AI_API_KEY is not configured");
  return gemini.getGenerativeModel({
    model: GEMINI_MODEL,
    ...(systemInstruction ? { systemInstruction } : {}),
  });
}
