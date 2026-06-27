/**
 * Shared utility functions used across multiple components.
 * Extracted to avoid duplication.
 */

/** Normalize option-style answer (e.g. "a, c" → "A,C"). */
export function normalizeOptionAnswer(raw: string): string {
    return Array.from(
        new Set(
            String(raw ?? "")
                .split(",")
                .map((item) => item.trim().toUpperCase())
                .filter((item) => /^[A-Z]$/.test(item))
        )
    )
        .sort()
        .join(",");
}

export function isMultipleQuestion(answer: string): boolean {
    return normalizeOptionAnswer(answer).includes(",");
}

/** Format an ISO date string as "yyyy-MM-dd HH:mm". */
export function formatDate(value: string | null | undefined): string {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mi = String(date.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

/** Read user UID from localStorage, or empty string. Shared by api layer. */
export function readLocalUid(): string {
    const raw = localStorage.getItem("ti.user");
    if (!raw) return "";
    try {
        const parsed = JSON.parse(raw) as { uid?: string };
        return String(parsed.uid ?? "");
    } catch {
        localStorage.removeItem("ti.user");
        return "";
    }
}

/** Build { "x-user-uid": uid } header object for authenticated API calls. */
export function userAuthHeaders(): Record<string, string> {
    const uid = readLocalUid();
    return uid ? { "x-user-uid": uid } : {};
}
