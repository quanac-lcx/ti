import { handleForbiddenNavigation } from "./utils/authRedirect";
import { translate } from "./i18n";

function normalizeBaseUrl(value: string) {
  return value.replace(/\/$/, "");
}

function isLocalHostname(hostname: string) {
  return hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname === "0.0.0.0"
    || hostname === "::1"
    || hostname === "[::1]";
}

function resolveApiBaseUrl() {
  const configured = String(import.meta.env.VITE_API_BASE_URL ?? "").trim();
  if (configured) return normalizeBaseUrl(configured);

  if (typeof window !== "undefined") {
    const { origin, protocol, hostname } = window.location;
    if (isLocalHostname(hostname)) {
      return `${protocol}//${hostname}:3000`;
    }
    return normalizeBaseUrl(origin);
  }

  return "";
}

export const apiBaseUrl = resolveApiBaseUrl();

interface LocalUser {
  uid?: string;
}

function readLocalUser(): LocalUser | null {
  const raw = localStorage.getItem("ti.user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalUser;
  } catch {
    localStorage.removeItem("ti.user");
    return null;
  }
}

function toNetworkError(err: unknown): Error {
  const message = String((err as Error)?.message ?? err);
  if (message.includes("Failed to fetch") || message.includes("ERR_CONNECTION_REFUSED")) {
    return new Error(translate("api.backendUnavailable", { url: apiBaseUrl }));
  }
  return new Error(message);
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const user = readLocalUser();
  const headers = {
    ...(init?.headers ?? {}),
    ...(user?.uid ? { "x-user-uid": user.uid } : {})
  };
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers });
  } catch (err) {
    throw toNetworkError(err);
  }

  if (response.status === 403) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(handleForbiddenNavigation(payload?.error));
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const user = readLocalUser();
  const headers = {
    "Content-Type": "application/json",
    ...(init?.headers ?? {}),
    ...(user?.uid ? { "x-user-uid": user.uid } : {})
  };
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: "POST",
      ...init,
      headers,
      body: JSON.stringify(body)
    });
  } catch (err) {
    throw toNetworkError(err);
  }
  const payload = await response.json().catch(() => ({}));

  if (response.status === 403) {
    throw new Error(handleForbiddenNavigation(payload?.error));
  }

  if (!response.ok) {
    const message = String(payload?.error ?? `HTTP ${response.status}`);
    throw new Error(message);
  }
  return payload as T;
}
