import { apiGet, apiPost, apiBaseUrl } from "../api";
import { loadLocalUser, type AuthUser } from "./auth";
import type { ChoiceOption } from "./problemset";

interface UsersResponse {
  users: AuthUser[];
}

interface UserResponse {
  user: AuthUser;
}

interface CpoauthConfigResponse {
  config: CpoauthConfig;
}

export interface CpoauthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  scope: string;
}

function adminHeaders() {
  const user = loadLocalUser();
  return {
    "x-admin-uid": user?.uid ?? ""
  };
}

export async function fetchAdminUsers(): Promise<AuthUser[]> {
  const result = await apiGet<UsersResponse>("/api/admin/users", {
    headers: adminHeaders()
  });
  return result.users;
}

export async function promoteUser(uid: string) {
  await apiPost<{ ok: boolean }>(
    `/api/admin/users/${encodeURIComponent(uid)}/promote`,
    {},
    { headers: adminHeaders() }
  );
}

export async function banUser(uid: string, banned: boolean) {
  await apiPost<{ ok: boolean }>(
    `/api/admin/users/${encodeURIComponent(uid)}/ban`,
    { banned },
    { headers: adminHeaders() }
  );
}

export async function deleteUser(uid: string) {
  const response = await fetch(`${apiBaseUrl}/api/admin/users/${encodeURIComponent(uid)}`, {
    method: "DELETE",
    headers: adminHeaders()
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(String(payload?.error ?? `HTTP ${response.status}`));
  }
}

export async function updateUser(
  uid: string,
  payload: Partial<{
    uid: string;
    username: string;
    email: string;
    password: string;
    isAdmin: boolean;
    isBanned: boolean;
  }>
): Promise<AuthUser> {
  const response = await fetch(`${apiBaseUrl}/api/admin/users/${encodeURIComponent(uid)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...adminHeaders()
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String(data?.error ?? `HTTP ${response.status}`));
  }
  return (data as UserResponse).user;
}

export async function createUser(payload: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthUser> {
  const result = await apiPost<UserResponse>("/api/admin/users", payload, {
    headers: adminHeaders()
  });
  return result.user;
}

export async function createQuestion(
  problemsetId: number,
  payload: {
    stem: string;
    options: ChoiceOption[];
    score: number;
    answer: string;
    analysis: string;
  }
) {
  await apiPost(
    `/api/admin/problemsets/${problemsetId}/questions`,
    payload,
    { headers: adminHeaders() }
  );
}

export async function fetchCpoauthConfig(): Promise<CpoauthConfig> {
  const result = await apiGet<CpoauthConfigResponse>("/api/admin/oauth/cpoauth", {
    headers: adminHeaders()
  });
  return result.config;
}

export async function updateCpoauthConfig(payload: CpoauthConfig): Promise<CpoauthConfig> {
  const response = await fetch(`${apiBaseUrl}/api/admin/oauth/cpoauth`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...adminHeaders()
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String(data?.error ?? `HTTP ${response.status}`));
  }
  return (data as CpoauthConfigResponse).config;
}
