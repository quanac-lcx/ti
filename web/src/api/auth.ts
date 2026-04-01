import { apiPost } from "../api";
import { apiGet, apiBaseUrl } from "../api";

export type AutosaveIntervalSeconds = 0 | 30 | 60 | 120 | 300 | 600;

export interface AuthUser {
  id: number;
  uid: string;
  username: string;
  email: string;
  avatarUrl: string;
  profileCoverUrl: string;
  bio: string;
  isAdmin: boolean;
  isBanned: boolean;
  recordsPublic: boolean;
  submissionAnalysisMode?: "none" | "wrong_only" | "all";
  autosaveIntervalSeconds?: AutosaveIntervalSeconds;
  createdAt: string;
}

interface UserResponse {
  user: AuthUser;
}

interface MySettingsResponse {
  settings: {
    recordsPublic: boolean;
    profileCoverUrl: string;
    submissionAnalysisMode: "none" | "wrong_only" | "all";
    autosaveIntervalSeconds: AutosaveIntervalSeconds;
  };
  user: AuthUser;
}

interface CpoauthSessionResponse {
  session: {
    user: AuthUser;
    returnTo: string;
  };
}

interface AdminTokenSessionResponse {
  session: {
    user: AuthUser;
  };
}

const LOCAL_USER_KEY = "ti.user";
const LOCAL_ADMIN_TOKEN_KEY = "ti.admin.token";

export function buildCpoauthAuthorizeUrl(returnTo = "/problemset"): string {
  const url = new URL("/api/oauth/cpoauth/authorize", apiBaseUrl);
  url.searchParams.set("returnTo", returnTo);
  if (typeof window !== "undefined") {
    url.searchParams.set("webBaseUrl", window.location.origin);
  }
  return url.toString();
}

export async function redeemCpoauthTicket(ticket: string): Promise<{ user: AuthUser; returnTo: string }> {
  const result = await apiPost<CpoauthSessionResponse>("/api/oauth/cpoauth/session", { ticket });
  return {
    user: result.session.user,
    returnTo: result.session.returnTo || "/problemset"
  };
}

export async function loginWithAdminToken(token: string): Promise<AuthUser> {
  const normalized = String(token ?? "").trim();
  const result = await apiPost<AdminTokenSessionResponse>("/api/auth/admin-token/session", {
    token: normalized
  });
  setAdminTokenSession(normalized);
  return result.session.user;
}

export function setAdminTokenSession(token: string) {
  localStorage.setItem(LOCAL_ADMIN_TOKEN_KEY, String(token ?? "").trim());
}

export function loadAdminTokenSession(): string {
  return String(localStorage.getItem(LOCAL_ADMIN_TOKEN_KEY) ?? "").trim();
}

export function clearAdminTokenSession() {
  localStorage.removeItem(LOCAL_ADMIN_TOKEN_KEY);
}

export function saveLocalUser(user: AuthUser) {
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
}

export function loadLocalUser(): AuthUser | null {
  const raw = localStorage.getItem(LOCAL_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearLocalUser() {
  localStorage.removeItem(LOCAL_USER_KEY);
  localStorage.removeItem(LOCAL_ADMIN_TOKEN_KEY);
}

export async function getUserByUid(uid: string): Promise<AuthUser> {
  const result = await apiGet<UserResponse>(`/api/users/${encodeURIComponent(uid)}`);
  return result.user;
}

export async function getMySettings(): Promise<MySettingsResponse["settings"]> {
  const result = await apiGet<MySettingsResponse>("/api/users/_me/settings");
  return result.settings;
}

export async function updateMySettings(payload: {
  recordsPublic: boolean;
  profileCoverUrl: string;
  submissionAnalysisMode: "none" | "wrong_only" | "all";
  autosaveIntervalSeconds: AutosaveIntervalSeconds;
}): Promise<{ settings: MySettingsResponse["settings"]; user: AuthUser }> {
  const me = loadLocalUser();
  const result = await fetch(`${apiBaseUrl}/api/users/_me/settings`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(me?.uid ? { "x-user-uid": me.uid } : {})
    },
    body: JSON.stringify(payload)
  });
  const data = await result.json().catch(() => ({}));
  if (result.status === 403) {
    try {
      localStorage.removeItem(LOCAL_USER_KEY);
    } catch { }
    window.location.href = "/auth/login";
    throw new Error(String((data as { error?: string })?.error ?? "forbidden"));
  }
  if (!result.ok) {
    throw new Error(String((data as { error?: string })?.error ?? `HTTP ${result.status}`));
  }
  const typed = data as MySettingsResponse;
  return {
    settings: typed.settings,
    user: typed.user
  };
}
