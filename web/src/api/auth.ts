import { apiPost } from "../api";
import { apiGet } from "../api";

export interface AuthUser {
  id: number;
  uid: string;
  username: string;
  email: string;
  avatarUrl: string;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: string;
}

interface RegisterResponse {
  user: AuthUser;
}

interface SessionResponse {
  session: {
    user: AuthUser;
    returnTo?: string;
  };
}

interface UserResponse {
  user: AuthUser;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

interface CpoauthSessionResponse {
  session: {
    user: AuthUser;
    returnTo: string;
  };
}

const LOCAL_USER_KEY = "ti.user";

export async function registerUser(payload: RegisterPayload): Promise<AuthUser> {
  const result = await apiPost<RegisterResponse>("/api/users", payload);
  return result.user;
}

export async function loginUser(payload: LoginPayload): Promise<AuthUser> {
  const result = await apiPost<SessionResponse>("/api/sessions", payload);
  return result.session.user;
}

export function buildCpoauthAuthorizeUrl(returnTo = "/problemset"): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
  const url = new URL("/api/oauth/cpoauth/authorize", apiBase);
  url.searchParams.set("returnTo", returnTo);
  return url.toString();
}

export async function redeemCpoauthTicket(ticket: string): Promise<{ user: AuthUser; returnTo: string }> {
  const result = await apiPost<CpoauthSessionResponse>("/api/oauth/cpoauth/session", { ticket });
  return {
    user: result.session.user,
    returnTo: result.session.returnTo || "/problemset"
  };
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
}

export async function getUserByUid(uid: string): Promise<AuthUser> {
  const result = await apiGet<UserResponse>(`/api/users/${encodeURIComponent(uid)}`);
  return result.user;
}
