export type MultiModelConfig = {
  id: string;
  name: string;
  provider: "OpenRouter";
  category: string;
  capabilities: string[];
};

const DEFAULT_MODELS = [
  "openrouter/free",
];

function prettyName(id: string) {
  const last = id.split("/").pop() || id;
  return last.split(/[-_]/).map((part) => part ? part[0].toUpperCase() + part.slice(1) : part).join(" ");
}

function categoryFor(id: string) {
  const x = id.toLowerCase();
  if (/(coder|code|qwen.*coder|devstral|deepseek.*r1|reason)/.test(x)) return "Coding & Reasoning";
  if (/(vision|vl|gemma.*vision|qwen.*vl|pixtral|gpt-4o|gemini)/.test(x)) return "Vision";
  if (/(image|flux|stable-diffusion|dall)/.test(x)) return "Image";
  if (/(math|scientific|science)/.test(x)) return "Math & Science";
  if (/(search|sonar|research)/.test(x)) return "Research";
  if (/(mini|flash|haiku|small|lite)/.test(x)) return "Fast";
  return "General Reasoning";
}

export function getConfiguredModels(): MultiModelConfig[] {
  const raw = process.env.OPENROUTER_MODELS || process.env.OPENROUTER_MODEL || "";
  const ids = [...raw.split(",").map((x) => x.trim()).filter(Boolean), ...DEFAULT_MODELS];
  const unique = [...new Set(ids)];
  return unique.map((id) => ({
    id,
    name: prettyName(id),
    provider: "OpenRouter",
    category: categoryFor(id),
    capabilities: ["text", "stream"],
  }));
}

export function getModelMap() {
  return new Map(getConfiguredModels().map((m) => [m.id, m]));
}

export function getOpenRouterKey() {
  return process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_TOKEN || "";
}

export function openRouterHeaders() {
  return {
    Authorization: `Bearer ${getOpenRouterKey()}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "https://vercel.app",
    "X-Title": process.env.OPENROUTER_APP_NAME || "Lakshya Multi-Model AI",
  };
}

export type MultiModelMessage = { role: "user" | "system" | "assistant"; content: string };

export async function streamOpenRouterModel(
  model: string,
  messages: MultiModelMessage[],
  signal: AbortSignal,
  onText: (text: string) => void,
) {
  const key = getOpenRouterKey();
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured.");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: openRouterHeaders(),
    signal,
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    let message = `Provider returned HTTP ${response.status}.`;
    try {
      const parsed = JSON.parse(body);
      message = parsed?.error?.message || message;
    } catch {}
    throw new Error(message);
  }

  if (!response.body) throw new Error("Provider did not return a stream.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const json = JSON.parse(payload);
          const delta = json?.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta) onText(delta);
        } catch {
          // Ignore incomplete/non-JSON SSE frames.
        }
      }
    }

    buffer += decoder.decode();
    for (const line of buffer.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        const delta = json?.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta) onText(delta);
      } catch {}
    }
  } finally {
    reader.releaseLock();
  }
}
