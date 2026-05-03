import { apiGet, apiPost } from "../api";

export interface AiGeneratePayload {
  mode: "hint" | "solution";
  question: string;
}

interface AiGenerateResponse {
  content: string;
}

export interface AiPublicModel {
  id: string;
  name: string;
  model: string;
  dailyLimit: number;
  usedCount?: number;
  remainingCount?: number | null;
  enabled: boolean;
}

interface AiModelsResponse {
  models: AiPublicModel[];
  defaultModelId: string;
}

export async function generateAiContent(payload: AiGeneratePayload): Promise<string> {
  const data = await apiPost<AiGenerateResponse>("/api/ai/generate", payload);
  return String(data.content ?? "");
}

export async function fetchAiModels(): Promise<AiModelsResponse> {
  return apiGet<AiModelsResponse>("/api/ai/models");
}
