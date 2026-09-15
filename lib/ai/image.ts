const DEFAULT_MODEL = "gemini-2.5-flash-image";
const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";

export type GeneratedImage = {
  data: string;
  mimeType: string;
};

function getApiKey() {
  const key = process.env.GEMINI_IMAGE_API_KEY;
  if (!key) throw new Error("GEMINI_IMAGE_API_KEY is not configured on the server.");
  return key;
}

function getModel() {
  return process.env.GEMINI_IMAGE_MODEL || DEFAULT_MODEL;
}

export async function generateStudyImage(prompt: string): Promise<GeneratedImage> {
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) throw new Error("An image prompt is required.");
  if (cleanPrompt.length > 2000) throw new Error("Image prompt is too long. Keep it under 2000 characters.");

  const key = getApiKey();
  const model = getModel();
  const response = await fetch(`${API_ROOT}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [{ text: cleanPrompt }],
      }],
      generationConfig: {
        responseModalities: ["IMAGE"],
      },
    }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null) as any;
  if (!response.ok) {
    const apiMessage = payload?.error?.message;
    if (response.status === 401 || response.status === 403) throw new Error("Gemini Image API key is invalid or not authorized.");
    if (response.status === 429) throw new Error("Gemini Image API quota/rate limit reached. Please try again later.");
    throw new Error(apiMessage || `Gemini Image API request failed (${response.status}).`);
  }

  const parts = payload?.candidates?.flatMap((candidate: any) => candidate?.content?.parts || []) || [];
  const imagePart = parts.find((part: any) => part?.inlineData?.data);
  if (!imagePart?.inlineData?.data) {
    const finishReason = payload?.candidates?.[0]?.finishReason;
    throw new Error(finishReason ? `Gemini did not return an image (${finishReason}). Try a different prompt.` : "Gemini did not return an image. Try a different prompt.");
  }

  return {
    data: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType || "image/png",
  };
}
