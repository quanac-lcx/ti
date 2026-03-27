import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export function buildGravatarUrl(email) {
  const normalized = normalizeEmail(email);
  const digest = createHash("md5").update(normalized).digest("hex");
  return `https://www.gravatar.com/avatar/${digest}?d=identicon&s=128`;
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password, storedHash) {
  const [salt, hashHex] = String(storedHash ?? "").split(":");
  if (!salt || !hashHex) return false;
  const derived = scryptSync(String(password), salt, 64);
  const stored = Buffer.from(hashHex, "hex");
  if (stored.length !== derived.length) return false;
  return timingSafeEqual(stored, derived);
}
