import { createHash } from "node:crypto";

export function normalizeEmail(email: string): string {
  return String(email ?? "").trim().toLowerCase();
}

export function buildGravatarUrl(email: string): string {
  const normalized = normalizeEmail(email);
  const digest = createHash("md5").update(normalized).digest("hex");
  return `https://dn-qiniu-avatar.qbox.me/avatar/${digest}?d=identicon&s=128`;
}



