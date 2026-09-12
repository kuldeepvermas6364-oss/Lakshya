export type AIResponse = { text?: string; error?: string; model?: string };

export async function askLakshyaAI(prompt: string): Promise<AIResponse> {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  return response.json();
}
