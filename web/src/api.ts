function resolveApiBaseUrl() {
  const configured = String(import.meta.env.VITE_API_BASE_URL ?? "").trim();
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3001`;
  }
  return "http://localhost:3001";
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
    return new Error(`后端服务不可用：${apiBaseUrl}（请先启动 server）`);
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
    try {
      localStorage.removeItem("ti.user");
    } catch { }
    // 尝试读取后端的错误描述，随后跳转登录页
    const payload = await response.json().catch(() => ({}));
    window.location.href = "/auth/login";
    throw new Error(String(payload?.error ?? "forbidden"));
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
    try {
      localStorage.removeItem("ti.user");
    } catch { }
    window.location.href = "/auth/login";
    throw new Error(String(payload?.error ?? "forbidden"));
  }

  if (!response.ok) {
    const message = String(payload?.error ?? `HTTP ${response.status}`);
    throw new Error(message);
  }
  return payload as T;
}
