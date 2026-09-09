import { GoogleGenerativeAI } from "@google/generative-ai";

// Support both names so existing Vercel configuration keeps working.
const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

export const gemini = apiKey ? new GoogleGenerativeAI(apiKey) : null;
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function getGeminiModel(systemInstruction?: string) {
  if (!gemini) throw new Error("GEMINI_API_KEY or AI_API_KEY is not configured");
  return gemini.getGenerativeModel({
    model: GEMINI_MODEL,
    ...(systemInstruction ? { systemInstruction } : {}),
  });
}
