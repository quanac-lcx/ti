import { apiBaseUrl } from "../api";

export interface AiGeneratePayload {
  mode: "hint" | "solution";
  question: string;
}

interface AiGenerateResponse {
  content: string;
}

export async function generateAiContent(payload: AiGeneratePayload): Promise<string> {
  const response = await fetch(`${apiBaseUrl}/api/ai/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String((data as { error?: string })?.error ?? `HTTP ${response.status}`));
  }
  return String((data as AiGenerateResponse).content ?? "");
}
