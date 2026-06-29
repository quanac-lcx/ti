import { apiBaseUrl, apiGet, apiPost } from "../api";
import { userAuthHeaders } from "../utils/shared";

export interface SubmissionRecord {
  id: number;
  userUid: string;
  problemsetId: number;
  problemsetTitle: string;
  mode: "exam" | "training";
  status: "in_progress" | "paused" | "submitted" | "replaced";
  score: number;
  maxScore: number;
  remainingSeconds: number | null;
  startedAt: string | null;
  submittedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SubmissionResultItem {
  questionId: string;
  questionIndex: number;
  questionType: "option" | "input";
  userAnswer: string;
  standardAnswer: string;
  correct: boolean;
  earned: number;
}

export interface SubmissionDetail extends SubmissionRecord {
  answers: Record<string, string>;
  results: SubmissionResultItem[];
}

interface ProblemsetSubmissionListResponse {
  submissions: SubmissionRecord[];
  activeExam: SubmissionRecord | null;
}

interface SubmissionResponse {
  submission: SubmissionDetail;
}

interface SubmissionSummaryResponse {
  submission: SubmissionRecord | null;
}

interface UserSubmissionListResponse {
  submissions: SubmissionRecord[];
}

export class ActiveExamConflictError extends Error {
  activeExam: SubmissionRecord | null;

  constructor(message: string, activeExam: SubmissionRecord | null) {
    super(message);
    this.name = "ActiveExamConflictError";
    this.activeExam = activeExam;
  }
}

export async function fetchProblemsetSubmissions(problemsetId: number): Promise<ProblemsetSubmissionListResponse> {
  return apiGet<ProblemsetSubmissionListResponse>(`/api/problemsets/${problemsetId}/submissions`);
}

export async function fetchSubmissionDetail(submissionId: number): Promise<SubmissionDetail> {
  const result = await apiGet<SubmissionResponse>(`/api/submissions/${submissionId}`);
  return result.submission;
}

export async function startExamSubmission(problemsetId: number, forceNew = false): Promise<SubmissionDetail> {
  const response = await fetch(`${apiBaseUrl}/api/problemsets/${problemsetId}/exam/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...userAuthHeaders()
    },
    body: JSON.stringify({ forceNew })
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 409) {
    throw new ActiveExamConflictError(
      String(payload?.error ?? "active exam exists"),
      (payload?.activeExam as SubmissionRecord) ?? null
    );
  }
  if (!response.ok) {
    throw new Error(String(payload?.error ?? `HTTP ${response.status}`));
  }
  return (payload as SubmissionResponse).submission;
}

export async function autosaveSubmission(
  submissionId: number,
  payload: { answers: Record<string, string>; remainingSeconds: number }
) {
  await apiPost(`/api/submissions/${submissionId}/autosave`, payload);
}

export async function startTrainingSubmission(problemsetId: number): Promise<SubmissionDetail> {
  const result = await apiPost<SubmissionResponse>(`/api/problemsets/${problemsetId}/training/start`, {});
  return result.submission;
}

export async function pauseExamSubmission(
  submissionId: number,
  payload: { answers: Record<string, string>; remainingSeconds: number }
): Promise<SubmissionDetail> {
  const result = await apiPost<SubmissionResponse>(`/api/submissions/${submissionId}/pause`, payload);
  return result.submission;
}

export async function resumeSubmission(submissionId: number): Promise<SubmissionDetail> {
  const result = await apiPost<SubmissionResponse>(`/api/submissions/${submissionId}/resume`, {});
  return result.submission;
}

export async function submitExamSubmission(
  submissionId: number,
  payload: { answers: Record<string, string>; remainingSeconds: number }
): Promise<SubmissionDetail> {
  const result = await apiPost<SubmissionResponse>(`/api/submissions/${submissionId}/submit`, payload);
  return result.submission;
}

export async function submitTrainingSubmission(
  problemsetId: number,
  payload: { answers: Record<string, string>; submissionId?: number }
): Promise<SubmissionDetail> {
  const result = await apiPost<SubmissionResponse>(`/api/problemsets/${problemsetId}/training/submit`, payload);
  return result.submission;
}

export async function fetchActiveExam(uid: string): Promise<SubmissionRecord | null> {
  const result = await apiGet<SubmissionSummaryResponse>(`/api/users/${encodeURIComponent(uid)}/active-exam`);
  return result.submission;
}

export async function fetchUserSubmissions(uid: string): Promise<SubmissionRecord[]> {
  const result = await apiGet<UserSubmissionListResponse>(`/api/users/${encodeURIComponent(uid)}/submissions`);
  return result.submissions;
}
