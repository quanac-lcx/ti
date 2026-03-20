const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export async function apiGet(path) {
  const res = await fetch(`${baseUrl}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

