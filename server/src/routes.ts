// @ts-nocheck
import express from "express";
import { randomBytes } from "node:crypto";
import { dbPool, pingDb } from "./db.js";
import { pingRedis, redis } from "./redis.js";
import { buildGravatarUrl, hashPassword, normalizeEmail, verifyPassword } from "./auth.js";
import { env } from "./env.js";
import { parseQuestionConfig } from "./questionConfigParser.js";

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}

function normalizeUid(value) {
  return String(value ?? "").trim();
}

function isValidUid(value) {
  return /^[A-Za-z0-9_][A-Za-z0-9_-]{1,31}$/.test(normalizeUid(value));
}

function normalizeBio(raw) {
  return String(raw ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, 4000);
}

function toPublicUser(row) {
  return {
    id: Number(row.id),
    uid: String(row.uid ?? ""),
    username: String(row.name ?? ""),
    email: String(row.email ?? ""),
    avatarUrl: String(row.avatar_url ?? ""),
    profileCoverUrl: String(row.profile_cover_url ?? ""),
    bio: normalizeBio(row.bio),
    isAdmin: Boolean(row.is_admin),
    isBanned: Boolean(row.is_banned),
    recordsPublic: Boolean(row.records_public),
    submissionAnalysisMode: normalizeSubmissionAnalysisMode(row.submission_analysis_mode, "wrong_only"),
    autosaveIntervalSeconds: normalizeAutosaveIntervalSeconds(row.autosave_interval_seconds, 30),
    createdAt: row.created_at
  };
}

function normalizeSubmissionAnalysisMode(raw, fallback = "wrong_only") {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value === "none" || value === "wrong_only" || value === "all") return value;
  return fallback;
}

function normalizeAutosaveIntervalSeconds(raw, fallback = 30) {
  const value = Number(raw);
  if (value === 0 || value === 30 || value === 60 || value === 120 || value === 300 || value === 600) {
    return value;
  }
  return fallback;
}

function toQuestion(row) {
  return {
    id: String(row.id),
    index: Number(row.question_index),
    type: String(row.question_type ?? "option"),
    materialGroupIndex: row.material_group_index === null || row.material_group_index === undefined
      ? null
      : Number(row.material_group_index),
    groupQuestionIndex: row.group_question_index === null || row.group_question_index === undefined
      ? null
      : Number(row.group_question_index),
    groupQuestionCount: row.group_question_count === null || row.group_question_count === undefined
      ? null
      : Number(row.group_question_count),
    groupTitle: String(row.group_title ?? ""),
    sharedMaterial: String(row.shared_material ?? ""),
    stem: String(row.stem ?? ""),
    inputPlaceholder: String(row.input_placeholder ?? ""),
    options: Array.isArray(row.options_json)
      ? row.options_json
      : JSON.parse(String(row.options_json ?? "[]")),
    score: Number(row.score),
    answer: String(row.answer ?? ""),
    analysis: String(row.analysis ?? "")
  };
}

function toProblemsetSummary(row) {
  const summary = {
    id: Number(row.id),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    questionCount: Number(row.question_count ?? 0),
    durationHours: Number(row.duration_minutes ?? 120) / 60,
    problemsetType: String(row.problemset_type ?? "official_public")
  };
  if (row.created_by_uid !== undefined) {
    summary.createdByUid = String(row.created_by_uid ?? "");
  }
  if (row.created_at !== undefined) {
    summary.createdAt = row.created_at;
  }
  return summary;
}

const PROBLEMSET_TYPES = {
  official_public: "official_public",
  personal_featured: "personal_featured",
  personal_public: "personal_public",
  personal_private: "personal_private"
};

function normalizeProblemsetType(raw) {
  const value = String(raw ?? "").trim().toLowerCase();
  if (
    value === PROBLEMSET_TYPES.official_public ||
    value === PROBLEMSET_TYPES.personal_featured ||
    value === PROBLEMSET_TYPES.personal_public ||
    value === PROBLEMSET_TYPES.personal_private
  ) {
    return value;
  }
  return "";
}

function canUserEditProblemset(problemsetRow, user) {
  if (!user) return false;
  if (Boolean(user.is_admin)) return true;
  return String(problemsetRow?.created_by_uid ?? "") === String(user.uid ?? "");
}

function canUserViewProblemset(problemsetRow, user) {
  const type = String(problemsetRow?.problemset_type ?? PROBLEMSET_TYPES.official_public);
  if (
    type === PROBLEMSET_TYPES.official_public ||
    type === PROBLEMSET_TYPES.personal_featured ||
    type === PROBLEMSET_TYPES.personal_public
  ) {
    return true;
  }
  return canUserEditProblemset(problemsetRow, user);
}

function parseProblemsetListTab(raw) {
  const tab = String(raw ?? "").trim().toLowerCase();
  if (tab === "all" || tab === "featured" || tab === "official") return tab;
  return "official";
}

function normalizeQuestionType(rawType) {
  const value = String(rawType ?? "").trim().toLowerCase();
  if (value === "option" || value === "input") return value;
  return "";
}

function parseQuestionOptions(rawOptions) {
  if (!Array.isArray(rawOptions)) return [];
  const normalized = [];
  for (let index = 0; index < rawOptions.length && index < 26; index += 1) {
    const item = rawOptions[index] ?? {};
    const text = String(item.text ?? "").trim();
    if (!text) continue;
    const candidateKey = String(item.key ?? "").trim().toUpperCase();
    const key = /^[A-Z]$/.test(candidateKey) ? candidateKey : String.fromCharCode(65 + index);
    if (normalized.some((option) => option.key === key)) continue;
    normalized.push({ key, text });
  }
  return normalized;
}

function normalizeQuestionAnswer(answerRaw) {
  return Array.from(
    new Set(
      String(answerRaw ?? "")
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter((item) => /^[A-Z]$/.test(item))
    )
  ).join(",");
}

const CPOAUTH_SETTING_KEYS = {
  clientId: "cpoauth.client_id",
  clientSecret: "cpoauth.client_secret",
  callbackUrl: "cpoauth.callback_url",
  scope: "cpoauth.scope"
};

function buildDefaultCallbackUrl(req) {
  return `${resolvePublicApiBaseUrl(req).replace(/\/$/, "")}/api/oauth/cpoauth/callback`;
}

function normalizeReturnTo(raw) {
  const value = String(raw ?? "").trim();
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/problemset";
  }
  return value;
}

const ADMIN_TOKEN_LENGTH = 32;
const ADMIN_TOKEN_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function isValidAdminToken(raw) {
  return /^[A-Za-z0-9]{32}$/.test(String(raw ?? "").trim());
}

function generateAdminToken() {
  const bytes = randomBytes(ADMIN_TOKEN_LENGTH);
  let token = "";
  for (let i = 0; i < ADMIN_TOKEN_LENGTH; i += 1) {
    token += ADMIN_TOKEN_ALPHABET[bytes[i] % ADMIN_TOKEN_ALPHABET.length];
  }
  return token;
}

function toRootUser() {
  return {
    id: 0,
    uid: "root",
    username: "root",
    email: "",
    avatarUrl: "",
    profileCoverUrl: "",
    bio: "",
    isAdmin: true,
    isBanned: false,
    recordsPublic: false,
    autosaveIntervalSeconds: 30,
    createdAt: new Date().toISOString()
  };
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(String(value ?? "").trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getRequestOrigin(req) {
  const forwardedProto = String(req.headers["x-forwarded-proto"] ?? "").split(",")[0].trim();
  const forwardedHost = String(req.headers["x-forwarded-host"] ?? "").split(",")[0].trim();
  const protocol = forwardedProto || req.protocol || "http";
  const host = forwardedHost || req.get("host") || `localhost:${env.port}`;
  return `${protocol}://${host}`;
}

function resolvePublicApiBaseUrl(req) {
  return env.publicApiBaseUrl || getRequestOrigin(req);
}

function isAllowedWebHostname(currentHostname, desiredHostname) {
  if (!currentHostname || !desiredHostname) return false;
  if (currentHostname === desiredHostname) return true;
  if (currentHostname.startsWith("api.") && currentHostname.slice(4) === desiredHostname) return true;
  if (desiredHostname.startsWith("api.") && desiredHostname.slice(4) === currentHostname) return true;
  return false;
}

function resolveWebBaseUrl(req, candidate) {
  const fallback = env.webBaseUrl || getRequestOrigin(req);
  const raw = String(candidate ?? "").trim();
  if (!isHttpUrl(raw)) return fallback;
  try {
    const desired = new URL(raw);
    if (env.webBaseUrl && isHttpUrl(env.webBaseUrl)) {
      const configured = new URL(env.webBaseUrl);
      return configured.origin === desired.origin ? desired.origin : configured.origin;
    }
    const current = new URL(getRequestOrigin(req));
    if (!isAllowedWebHostname(current.hostname, desired.hostname)) return fallback;
    return desired.origin;
  } catch {
    return fallback;
  }
}

function normalizeOauthScope(scopeRaw) {
  return String(scopeRaw ?? "")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .join(" ");
}

async function getAppSettings(keys) {
  if (!Array.isArray(keys) || keys.length === 0) return {};
  const placeholders = keys.map(() => "?").join(", ");
  const [rows] = await dbPool.query(
    `SELECT \`key\`, \`value\` FROM app_settings WHERE \`key\` IN (${placeholders})`,
    keys
  );
  const map = {};
  for (const row of rows) {
    map[row.key] = row.value ?? "";
  }
  return map;
}

async function setAppSetting(key, value) {
  await dbPool.query(
    "INSERT INTO app_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
    [key, value]
  );
}

async function getCpoauthConfig(req) {
  const settings = await getAppSettings(Object.values(CPOAUTH_SETTING_KEYS));
  return {
    clientId: String(settings[CPOAUTH_SETTING_KEYS.clientId] ?? "").trim(),
    clientSecret: String(settings[CPOAUTH_SETTING_KEYS.clientSecret] ?? "").trim(),
    callbackUrl: String(settings[CPOAUTH_SETTING_KEYS.callbackUrl] ?? "").trim() || buildDefaultCallbackUrl(req),
    scope: normalizeOauthScope(String(settings[CPOAUTH_SETTING_KEYS.scope] ?? "").trim() || "openid profile email")
  };
}

function buildCpoauthAuthorizeUrl(config, state) {
  const authorizeUrl = new URL("/oauth/authorize", env.cpoauthBaseUrl);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set("redirect_uri", config.callbackUrl);
  authorizeUrl.searchParams.set("scope", config.scope);
  authorizeUrl.searchParams.set("state", state);
  return authorizeUrl.toString();
}

function pickOauthErrorMessage(payload, fallback) {
  const errorDescription = String(payload?.error_description ?? "").trim();
  if (errorDescription) return errorDescription;

  const message = String(payload?.message ?? "").trim();
  if (message) return message;

  const error = payload?.error;
  if (typeof error === "string" && error.trim()) return error.trim();

  return fallback;
}

async function exchangeCpoauthToken({ code, clientId, clientSecret, callbackUrl }) {
  const response = await fetch(new URL("/api/oauth/token", env.cpoauthBaseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl,
      client_id: clientId,
      client_secret: clientSecret
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(pickOauthErrorMessage(payload, `token exchange failed (HTTP ${response.status})`));
  }
  const accessToken = String(payload?.access_token ?? "").trim();
  if (!accessToken) {
    throw new Error("token exchange failed: empty access_token");
  }
  return accessToken;
}

async function fetchCpoauthUserInfo(accessToken) {
  const response = await fetch(new URL("/api/oauth/userinfo", env.cpoauthBaseUrl), {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(pickOauthErrorMessage(payload, `userinfo failed (HTTP ${response.status})`));
  }
  return payload;
}

function sanitizeUsername(rawName) {
  const normalized = String(rawName ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 64);
  if (normalized.length >= 2) return normalized;
  return "cpo-user";
}

function pickDisplayName(profile) {
  const displayName = sanitizeUsername(profile?.display_name);
  if (displayName !== "cpo-user") return displayName;
  const username = sanitizeUsername(profile?.username);
  if (username !== "cpo-user") return username;
  return "CPOAuth 鐢ㄦ埛";
}

async function buildUniqueDisplayName(baseUsername) {
  const base = sanitizeUsername(baseUsername);
  for (let idx = 0; idx < 10000; idx += 1) {
    const suffix = idx === 0 ? "" : `_${idx + 1}`;
    const maxBaseLength = 64 - suffix.length;
    const candidate = `${base.slice(0, maxBaseLength)}${suffix}`;
    const [rows] = await dbPool.query("SELECT id FROM users WHERE name = ? LIMIT 1", [candidate]);
    if (!Array.isArray(rows) || rows.length === 0) return candidate;
  }
  throw new Error("failed to allocate username");
}

async function findOrCreateCpoauthUser(profile) {
  const subject = String(profile?.sub ?? "").trim();
  if (!subject) {
    throw new Error("userinfo missing sub");
  }

  const displayName = pickDisplayName(profile);
  const rawEmail = String(profile?.email ?? "").trim();
  const emailFromOauth = rawEmail && isEmail(rawEmail) ? normalizeEmail(rawEmail) : null;
  const avatarFromOauth = String(profile?.avatar_url ?? "").trim();
  const bioFromOauth = normalizeBio(profile?.bio);
  const fallbackAvatarBySubject = buildGravatarUrl(`cpo-${subject}@auth.luogu.me`);

  const [boundRows] = await dbPool.query(
    "SELECT id, uid, name, email, avatar_url, profile_cover_url, bio, submission_analysis_mode, autosave_interval_seconds, is_admin, is_banned, records_public, created_at FROM users WHERE oauth_provider = ? AND oauth_subject = ? LIMIT 1",
    ["cpoauth", subject]
  );
  if (Array.isArray(boundRows) && boundRows.length > 0) {
    const boundUser = boundRows[0];

    let mergedEmail = emailFromOauth;
    if (mergedEmail) {
      const [emailRows] = await dbPool.query(
        "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
        [mergedEmail, Number(boundUser.id)]
      );
      if (Array.isArray(emailRows) && emailRows.length > 0) {
        mergedEmail = null;
      }
    }
    if (!mergedEmail) {
      const currentEmail = String(boundUser.email ?? "").trim();
      mergedEmail = currentEmail && isEmail(currentEmail) ? normalizeEmail(currentEmail) : null;
    }

    const mergedAvatar = avatarFromOauth
      || (mergedEmail ? buildGravatarUrl(mergedEmail) : fallbackAvatarBySubject);

    await dbPool.query(
      "UPDATE users SET name = ?, email = ?, avatar_url = ?, bio = ? WHERE id = ?",
      [displayName, mergedEmail, mergedAvatar, bioFromOauth || null, Number(boundUser.id)]
    );

    const [rows] = await dbPool.query(
      "SELECT id, uid, name, email, avatar_url, profile_cover_url, bio, submission_analysis_mode, autosave_interval_seconds, is_admin, is_banned, records_public, created_at FROM users WHERE id = ? LIMIT 1",
      [Number(boundUser.id)]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("bound user not found");
    }
    return toPublicUser(rows[0]);
  }

  const cpoUsername = normalizeUid(profile?.username);
  if (!isValidUid(cpoUsername)) {
    throw new Error("userinfo missing valid username");
  }

  const [uidRows] = await dbPool.query("SELECT id FROM users WHERE uid = ? LIMIT 1", [cpoUsername]);
  if (Array.isArray(uidRows) && uidRows.length > 0) {
    throw new Error(`uid already exists: ${cpoUsername}`);
  }

  const username = await buildUniqueDisplayName(displayName);
  const avatarUrl = avatarFromOauth
    || (emailFromOauth ? buildGravatarUrl(emailFromOauth) : fallbackAvatarBySubject);

  try {
    const [result] = await dbPool.query(
      "INSERT INTO users (uid, name, email, password_hash, avatar_url, bio, oauth_provider, oauth_subject) VALUES (?, ?, ?, NULL, ?, ?, ?, ?)",
      [cpoUsername, username, emailFromOauth, avatarUrl, bioFromOauth || null, "cpoauth", subject]
    );

    const userId = Number(result.insertId);
    const [rows] = await dbPool.query(
      "SELECT id, uid, name, email, avatar_url, profile_cover_url, bio, submission_analysis_mode, autosave_interval_seconds, is_admin, is_banned, records_public, created_at FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("created user not found");
    }
    return toPublicUser(rows[0]);
  } catch (err) {
    const message = String(err?.message ?? "");
    if (!message.includes("Duplicate entry")) throw err;
    const [rows] = await dbPool.query(
      "SELECT id, uid, name, email, avatar_url, profile_cover_url, bio, submission_analysis_mode, autosave_interval_seconds, is_admin, is_banned, records_public, created_at FROM users WHERE oauth_provider = ? AND oauth_subject = ? LIMIT 1",
      ["cpoauth", subject]
    );
    if (!Array.isArray(rows) || rows.length === 0) throw err;
    return toPublicUser(rows[0]);
  }
}

async function getAdminByHeader(req) {
  const adminUid = String(req.header("x-admin-uid") ?? "").trim();
  if (!adminUid) return null;

  if (adminUid === "root") {
    const adminToken = String(req.header("x-admin-token") ?? "").trim();
    if (!isValidAdminToken(adminToken)) return null;
    const [tokenRows] = await dbPool.query(
      "SELECT id FROM admin_tokens WHERE BINARY token = ? LIMIT 1",
      [adminToken]
    );
    if (!Array.isArray(tokenRows) || tokenRows.length === 0) return null;
    return {
      id: 0,
      uid: "root",
      is_admin: 1,
      is_banned: 0
    };
  }

  const [rows] = await dbPool.query(
    "SELECT id, uid, is_admin, is_banned FROM users WHERE uid = ? LIMIT 1",
    [adminUid]
  );
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const admin = rows[0];
  if (!admin.is_admin || admin.is_banned) return null;
  return admin;
}

async function requireAdmin(req, res) {
  const admin = await getAdminByHeader(req);
  if (!admin) {
    res.status(403).json({ error: "admin permission required" });
    return null;
  }
  return admin;
}

async function getUserByHeader(req) {
  const uid = normalizeUid(req.header("x-user-uid"));
  if (!uid) return null;
  const [rows] = await dbPool.query(
    "SELECT id, uid, name, email, avatar_url, profile_cover_url, bio, submission_analysis_mode, autosave_interval_seconds, is_admin, is_banned, records_public, created_at FROM users WHERE uid = ? LIMIT 1",
    [uid]
  );
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0];
}

async function requireUser(req, res) {
  const user = await getUserByHeader(req);
  if (!user) {
    res.status(401).json({ error: "login required" });
    return null;
  }
  if (user.is_banned) {
    res.status(403).json({ error: "该用户已被封禁。" });
    return null;
  }
  return user;
}

async function requireSelfOrAdmin(req, res, targetUid) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (user.uid === targetUid || user.is_admin) return user;
  res.status(403).json({ error: "permission denied" });
  return null;
}

function parseBooleanInput(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on") {
      return true;
    }
    if (normalized === "0" || normalized === "false" || normalized === "no" || normalized === "off") {
      return false;
    }
  }
  return fallback;
}

async function getNextProblemsetIdByType(problemsetType) {
  let minId = 1000;
  let maxId = 99999;
  if (problemsetType === PROBLEMSET_TYPES.personal_featured || problemsetType === PROBLEMSET_TYPES.personal_public) {
    minId = 100000;
    maxId = 999999;
  } else if (problemsetType === PROBLEMSET_TYPES.personal_private) {
    minId = 1000000;
    maxId = 999999999;
  }

  const [rows] = await dbPool.query(
    `
      SELECT GREATEST(
        COALESCE((SELECT MAX(id) FROM problemsets WHERE id BETWEEN ? AND ?), ?),
        COALESCE((SELECT MAX(problemset_id) FROM questions WHERE problemset_id BETWEEN ? AND ?), ?)
      ) AS max_id
    `,
    [minId, maxId, minId - 1, minId, maxId, minId - 1]
  );
  return Number(rows[0]?.max_id ?? minId - 1) + 1;
}

async function getProblemsetById(problemsetId) {
  const [rows] = await dbPool.query(
    "SELECT id, title, description, duration_minutes, question_config, created_by_uid, problemset_type FROM problemsets WHERE id = ? LIMIT 1",
    [problemsetId]
  );
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0];
}

function safeJsonParse(raw, fallback) {
  try {
    if (raw === null || raw === undefined || raw === "") return fallback;
    return JSON.parse(String(raw));
  } catch {
    return fallback;
  }
}

function toSubmissionSummary(row) {
  return {
    id: Number(row.id),
    userUid: String(row.user_uid ?? ""),
    problemsetId: Number(row.problemset_id),
    problemsetTitle: row.problemset_title !== undefined ? String(row.problemset_title ?? "") : "",
    mode: String(row.mode ?? "training"),
    status: String(row.status ?? "submitted"),
    score: Number(row.score ?? 0),
    maxScore: Number(row.max_score ?? 0),
    remainingSeconds: row.remaining_seconds === null || row.remaining_seconds === undefined
      ? null
      : Number(row.remaining_seconds),
    startedAt: row.started_at ?? null,
    submittedAt: row.submitted_at ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null
  };
}

function toSubmissionDetail(row) {
  return {
    ...toSubmissionSummary(row),
    answers: safeJsonParse(row.answers_json, {}),
    results: safeJsonParse(row.results_json, [])
  };
}

function normalizeSubmissionAnswers(rawAnswers) {
  const source = rawAnswers && typeof rawAnswers === "object" ? rawAnswers : {};
  const normalized = {};
  for (const [key, value] of Object.entries(source)) {
    normalized[String(key)] = String(value ?? "").trim();
  }
  return normalized;
}

async function calculateSubmission(problemsetId, answersInput) {
  const [rows] = await dbPool.query(
    "SELECT id, question_index, question_type, score, answer FROM questions WHERE problemset_id = ? ORDER BY question_index ASC",
    [problemsetId]
  );
  const answers = normalizeSubmissionAnswers(answersInput);
  let score = 0;
  let maxScore = 0;
  const results = [];

  for (const row of rows) {
    const questionId = String(row.id);
    const questionType = String(row.question_type ?? "option");
    const standardAnswer = String(row.answer ?? "").trim();
    const userAnswer = String(answers[questionId] ?? "").trim();
    const weight = Number(row.score ?? 0);
    maxScore += weight;

    let correct = false;
    if (questionType === "option") {
      correct = normalizeQuestionAnswer(userAnswer) === normalizeQuestionAnswer(standardAnswer);
    } else {
      correct = userAnswer === standardAnswer;
    }
    const earned = correct ? weight : 0;
    score += earned;
    results.push({
      questionId,
      questionIndex: Number(row.question_index),
      questionType,
      userAnswer,
      standardAnswer,
      correct,
      earned
    });
  }

  return {
    answers,
    results,
    score: Number(score.toFixed(2)),
    maxScore: Number(maxScore.toFixed(2))
  };
}

export function buildRouter() {
  const router = express.Router();

  router.get("/health", async (_req, res) => {
    try {
      await Promise.all([pingDb(), pingRedis()]);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err?.message ?? err) });
    }
  });

  router.get("/problemsets", async (req, res) => {
    const actor = await getUserByHeader(req);
    const tab = parseProblemsetListTab(req.query?.tab);

    let whereClause = "WHERE p.problemset_type = 'official_public'";
    const params = [];

    if (tab === "featured") {
      whereClause = "WHERE p.problemset_type = 'personal_featured'";
    } else if (tab === "all") {
      if (actor?.is_admin) {
        whereClause = "";
      } else if (actor?.uid) {
        whereClause = "WHERE p.problemset_type <> 'personal_private' OR p.created_by_uid = ?";
        params.push(String(actor.uid));
      } else {
        whereClause = "WHERE p.problemset_type <> 'personal_private'";
      }
    }

    const [rows] = await dbPool.query(
      `
      SELECT
        p.id,
        p.title,
        p.description,
        p.duration_minutes,
        p.problemset_type,
        p.created_by_uid,
        COALESCE(COUNT(q.id), 0) AS question_count
      FROM problemsets p
      LEFT JOIN questions q ON q.problemset_id = p.id
      ${whereClause}
      GROUP BY p.id, p.title, p.description, p.duration_minutes, p.problemset_type, p.created_by_uid
      ORDER BY p.id ASC
    `,
      params
    );
    return res.json({
      problemsets: rows.map((row) => toProblemsetSummary(row))
    });
  });

  router.get("/problemsets/search", async (req, res) => {
    const keyword = String(req.query?.q ?? "").trim();
    if (!keyword) {
      return res.json({ problemsets: [] });
    }

    const escapedKeyword = keyword.replace(/[\\%_]/g, "\\$&");
    const fuzzyKeyword = `%${escapedKeyword}%`;
    const titlePrefixKeyword = `${escapedKeyword}%`;
    const exactId = Number.isInteger(Number(keyword)) && Number(keyword) > 0 ? Number(keyword) : 0;

    const [rows] = await dbPool.query(
      `
        SELECT
          p.id,
          p.title,
          p.description,
          p.duration_minutes,
          p.problemset_type,
          p.created_by_uid,
          COALESCE(COUNT(q.id), 0) AS question_count
        FROM problemsets p
        LEFT JOIN questions q ON q.problemset_id = p.id
        WHERE p.problemset_type IN ('official_public', 'personal_featured', 'personal_public')
          AND (
            p.title LIKE ?
            OR p.description LIKE ?
            OR p.created_by_uid LIKE ?
            OR CAST(p.id AS CHAR) LIKE ?
          )
        GROUP BY p.id, p.title, p.description, p.duration_minutes, p.problemset_type, p.created_by_uid
        ORDER BY
          CASE
            WHEN ? > 0 AND p.id = ? THEN 0
            WHEN p.title LIKE ? THEN 1
            WHEN p.created_by_uid LIKE ? THEN 2
            ELSE 3
          END,
          p.id ASC
        LIMIT 100
      `,
      [
        fuzzyKeyword,
        fuzzyKeyword,
        fuzzyKeyword,
        fuzzyKeyword,
        exactId,
        exactId,
        titlePrefixKeyword,
        titlePrefixKeyword
      ]
    );

    return res.json({
      problemsets: rows.map((row) => toProblemsetSummary(row))
    });
  });

  router.get("/problemsets/:id", async (req, res) => {
    const problemsetId = Number(req.params.id);
    if (!Number.isFinite(problemsetId)) {
      return res.status(400).json({ error: "invalid problemset id" });
    }

    const actor = await getUserByHeader(req);
    const [summaryRows] = await dbPool.query(
      "SELECT id, title, description, duration_minutes, problemset_type, created_by_uid FROM problemsets WHERE id = ? LIMIT 1",
      [problemsetId]
    );
    if (!Array.isArray(summaryRows) || summaryRows.length === 0) {
      return res.status(404).json({ error: "problemset not found" });
    }
    const problemsetRow = summaryRows[0];
    if (!canUserViewProblemset(problemsetRow, actor)) {
      return res.status(403).json({ error: "无权访问该题目。" });
    }

    const [questionRows] = await dbPool.query(
      "SELECT id, question_index, question_type, material_group_index, group_question_index, group_question_count, group_title, shared_material, stem, input_placeholder, options_json, score, answer, analysis FROM questions WHERE problemset_id = ? ORDER BY question_index ASC",
      [problemsetId]
    );

    const summary = summaryRows[0];
    return res.json({
      summary: {
        id: Number(summary.id),
        title: summary.title,
        description: summary.description,
        questionCount: questionRows.length,
        durationHours: Number(summary.duration_minutes ?? 120) / 60,
        problemsetType: String(summary.problemset_type ?? "official_public"),
        createdByUid: String(summary.created_by_uid ?? "")
      },
      questions: questionRows.map(toQuestion)
    });
  });

  router.post("/problemsets", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    try {
      const title = String(req.body?.title ?? "").trim();
      const description = String(req.body?.description ?? "").trim();
      const durationMinutes = Number(req.body?.durationMinutes ?? 120);
      const requestedId = req.body?.id;
      const questionConfig = String(req.body?.questionConfig ?? "");
      const typeRaw = req.body?.problemsetType;
      const problemsetType = normalizeProblemsetType(typeRaw) || PROBLEMSET_TYPES.official_public;

      if (!user.is_admin && (problemsetType === PROBLEMSET_TYPES.official_public || problemsetType === PROBLEMSET_TYPES.personal_featured)) {
        return res.status(403).json({ error: "鏅€氱敤鎴蜂粎鍙垱寤轰釜浜哄叕寮€/涓汉绉佹湁棰樼洰" });
      }

      if (!title) {
        return res.status(400).json({ error: "title is required" });
      }
      if (!description) {
        return res.status(400).json({ error: "description is required" });
      }
      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        return res.status(400).json({ error: "durationMinutes must be positive" });
      }

      const parsed = parseQuestionConfig(questionConfig);
      if (parsed.errors.length > 0) {
        return res.status(400).json({ error: parsed.errors[0], errors: parsed.errors });
      }

      let problemsetId = Number(requestedId);
      if (Number.isFinite(problemsetId)) {
        if (!user.is_admin) {
          return res.status(403).json({ error: "only admin can set custom problemset id" });
        }
        if (!Number.isInteger(problemsetId) || problemsetId <= 0) {
          return res.status(400).json({ error: "id must be a positive integer" });
        }
      } else {
        problemsetId = await getNextProblemsetIdByType(problemsetType);
      }

      const [idRows] = await dbPool.query(
        "SELECT id FROM problemsets WHERE id = ? LIMIT 1",
        [problemsetId]
      );
      if (Array.isArray(idRows) && idRows.length > 0) {
        return res.status(409).json({ error: `problemset id ${problemsetId} already exists` });
      }
      const [questionConflictRows] = await dbPool.query(
        "SELECT id FROM questions WHERE problemset_id = ? LIMIT 1",
        [problemsetId]
      );
      if (Array.isArray(questionConflictRows) && questionConflictRows.length > 0) {
        return res.status(409).json({ error: `problemset id ${problemsetId} is occupied by existing questions` });
      }

      const connection = await dbPool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          "INSERT INTO problemsets (id, title, description, duration_minutes, question_config, created_by_uid, problemset_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [problemsetId, title, description, Math.round(durationMinutes), questionConfig, user.uid, problemsetType]
        );

        for (let index = 0; index < parsed.questions.length; index += 1) {
          const question = parsed.questions[index];
          await connection.query(
            "INSERT INTO questions (problemset_id, question_index, question_type, material_group_index, group_question_index, group_question_count, group_title, shared_material, stem, input_placeholder, options_json, score, answer, analysis) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              problemsetId,
              index + 1,
              question.type,
              question.materialGroupIndex,
              question.groupQuestionIndex,
              question.groupQuestionCount,
              question.groupTitle || null,
              question.sharedMaterial || null,
              question.stem,
              question.inputPlaceholder,
              JSON.stringify(question.options),
              question.score,
              question.answer,
              question.analysis
            ]
          );
        }
        await connection.commit();
      } catch (err) {
        await connection.rollback();
        const message = String(err?.message ?? "");
        if (message.includes("Duplicate entry")) {
          return res.status(409).json({ error: "problemset id conflict, please retry" });
        }
        return res.status(500).json({ error: "create problemset failed" });
      } finally {
        connection.release();
      }

      return res.status(201).json({
        problemset: {
          id: problemsetId,
          title,
          description,
          questionCount: parsed.questions.length,
          durationHours: Math.round(durationMinutes) / 60,
          problemsetType,
          createdByUid: String(user.uid)
        }
      });
    } catch {
      return res.status(500).json({ error: "create problemset failed" });
    }
  });

  router.get("/problemsets/:id/edit", async (req, res) => {
    const actor = await requireUser(req, res);
    if (!actor) return;
    const problemsetId = Number(req.params.id);
    if (!Number.isFinite(problemsetId)) {
      return res.status(400).json({ error: "invalid problemset id" });
    }
    const problemset = await getProblemsetById(problemsetId);
    if (!problemset) {
      return res.status(404).json({ error: "problemset not found" });
    }
    if (!canUserEditProblemset(problemset, actor)) {
      return res.status(403).json({ error: "permission denied" });
    }
    return res.json({
      problemset: {
        id: Number(problemset.id),
        title: String(problemset.title ?? ""),
        description: String(problemset.description ?? ""),
        durationMinutes: Number(problemset.duration_minutes ?? 120),
        questionConfig: String(problemset.question_config ?? ""),
        problemsetType: String(problemset.problemset_type ?? PROBLEMSET_TYPES.official_public),
        createdByUid: String(problemset.created_by_uid ?? "")
      }
    });
  });

  router.patch("/problemsets/:id", async (req, res) => {
    const actor = await requireUser(req, res);
    if (!actor) return;

    const sourceId = Number(req.params.id);
    if (!Number.isFinite(sourceId)) {
      return res.status(400).json({ error: "invalid problemset id" });
    }

    const current = await getProblemsetById(sourceId);
    if (!current) {
      return res.status(404).json({ error: "problemset not found" });
    }
    if (!canUserEditProblemset(current, actor)) {
      return res.status(403).json({ error: "permission denied" });
    }

    const title = String(req.body?.title ?? "").trim();
    const description = String(req.body?.description ?? "").trim();
    const durationMinutes = Number(req.body?.durationMinutes ?? 120);
    const questionConfig = String(req.body?.questionConfig ?? "");
    const nextTypeRaw = req.body?.problemsetType;
    const nextType = normalizeProblemsetType(nextTypeRaw) || String(current.problemset_type ?? PROBLEMSET_TYPES.official_public);
    const requestedId = req.body?.id;

    if (!title) return res.status(400).json({ error: "title is required" });
    if (!description) return res.status(400).json({ error: "description is required" });
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return res.status(400).json({ error: "durationMinutes must be positive" });
    }

    if (!actor.is_admin && (nextType === PROBLEMSET_TYPES.official_public || nextType === PROBLEMSET_TYPES.personal_featured)) {
      return res.status(403).json({ error: "鏅€氱敤鎴蜂粎鍙缃釜浜哄叕寮€/涓汉绉佹湁" });
    }

    const parsed = parseQuestionConfig(questionConfig);
    if (parsed.errors.length > 0) {
      return res.status(400).json({ error: parsed.errors[0], errors: parsed.errors });
    }

    let targetId = sourceId;
    if (requestedId !== undefined && requestedId !== null && String(requestedId).trim() !== "") {
      if (!actor.is_admin) {
        return res.status(403).json({ error: "only admin can change problemset id" });
      }
      const nextId = Number(requestedId);
      if (!Number.isInteger(nextId) || nextId <= 0) {
        return res.status(400).json({ error: "id must be a positive integer" });
      }
      targetId = nextId;
    }

    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      if (targetId !== sourceId) {
        const [idRows] = await connection.query("SELECT id FROM problemsets WHERE id = ? LIMIT 1", [targetId]);
        if (Array.isArray(idRows) && idRows.length > 0) {
          await connection.rollback();
          return res.status(409).json({ error: `problemset id ${targetId} already exists` });
        }
      }

      await connection.query(
        "UPDATE problemsets SET id = ?, title = ?, description = ?, duration_minutes = ?, question_config = ?, problemset_type = ? WHERE id = ?",
        [targetId, title, description, Math.round(durationMinutes), questionConfig, nextType, sourceId]
      );

      if (targetId !== sourceId) {
        await connection.query("UPDATE questions SET problemset_id = ? WHERE problemset_id = ?", [targetId, sourceId]);
      }

      await connection.query("DELETE FROM questions WHERE problemset_id = ?", [targetId]);
      for (let index = 0; index < parsed.questions.length; index += 1) {
        const question = parsed.questions[index];
        await connection.query(
          "INSERT INTO questions (problemset_id, question_index, question_type, material_group_index, group_question_index, group_question_count, group_title, shared_material, stem, input_placeholder, options_json, score, answer, analysis) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            targetId,
            index + 1,
            question.type,
            question.materialGroupIndex,
            question.groupQuestionIndex,
            question.groupQuestionCount,
            question.groupTitle || null,
            question.sharedMaterial || null,
            question.stem,
            question.inputPlaceholder,
            JSON.stringify(question.options),
            question.score,
            question.answer,
            question.analysis
          ]
        );
      }

      await connection.commit();
      return res.json({
        problemset: {
          id: targetId,
          title,
          description,
          questionCount: parsed.questions.length,
          durationHours: Math.round(durationMinutes) / 60,
          problemsetType: nextType,
          createdByUid: String(current.created_by_uid ?? "")
        }
      });
    } catch (err) {
      await connection.rollback();
      const message = String(err?.message ?? "");
      if (message.includes("Duplicate entry")) {
        return res.status(409).json({ error: "problemset id conflict" });
      }
      return res.status(500).json({ error: "update problemset failed" });
    } finally {
      connection.release();
    }
  });

  router.delete("/problemsets/:id", async (req, res) => {
    const actor = await requireUser(req, res);
    if (!actor) return;

    const problemsetId = Number(req.params.id);
    if (!Number.isFinite(problemsetId)) {
      return res.status(400).json({ error: "invalid problemset id" });
    }

    const current = await getProblemsetById(problemsetId);
    if (!current) {
      return res.status(404).json({ error: "problemset not found" });
    }
    if (!canUserEditProblemset(current, actor)) {
      return res.status(403).json({ error: "permission denied" });
    }

    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query("DELETE FROM questions WHERE problemset_id = ?", [problemsetId]);
      const [result] = await connection.query("DELETE FROM problemsets WHERE id = ?", [problemsetId]);
      await connection.commit();
      if (!result?.affectedRows) {
        return res.status(404).json({ error: "problemset not found" });
      }
      return res.status(204).send();
    } catch {
      await connection.rollback();
      return res.status(500).json({ error: "delete problemset failed" });
    } finally {
      connection.release();
    }
  });

  router.get("/users", async (_req, res) => {
    const [rows] = await dbPool.query(
      "SELECT id, uid, name, email, avatar_url, profile_cover_url, bio, is_admin, is_banned, records_public, created_at FROM users ORDER BY id ASC LIMIT 100"
    );
    res.json({ users: rows.map(toPublicUser) });
  });

  router.get("/users/_me/settings", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    return res.json({
      settings: {
        recordsPublic: Boolean(user.records_public),
        profileCoverUrl: String(user.profile_cover_url ?? ""),
        submissionAnalysisMode: normalizeSubmissionAnalysisMode(user.submission_analysis_mode, "wrong_only"),
        autosaveIntervalSeconds: normalizeAutosaveIntervalSeconds(user.autosave_interval_seconds, 30)
      },
      user: toPublicUser(user)
    });
  });

  router.patch("/users/_me/settings", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;

    const recordsPublic = parseBooleanInput(req.body?.recordsPublic, Boolean(user.records_public));
    const profileCoverUrl = String(req.body?.profileCoverUrl ?? "").trim();
    const submissionAnalysisMode = normalizeSubmissionAnalysisMode(req.body?.submissionAnalysisMode, normalizeSubmissionAnalysisMode(user.submission_analysis_mode, "wrong_only"));
    const autosaveIntervalSeconds = normalizeAutosaveIntervalSeconds(
      req.body?.autosaveIntervalSeconds,
      normalizeAutosaveIntervalSeconds(user.autosave_interval_seconds, 30)
    );
    if (profileCoverUrl && !isHttpUrl(profileCoverUrl)) {
      return res.status(400).json({ error: "profileCoverUrl 必须是 http(s) 地址，或留空。" });
    }

    await dbPool.query(
      "UPDATE users SET records_public = ?, profile_cover_url = ?, submission_analysis_mode = ?, autosave_interval_seconds = ? WHERE id = ?",
      [recordsPublic ? 1 : 0, profileCoverUrl || null, submissionAnalysisMode, autosaveIntervalSeconds, Number(user.id)]
    );

    const [rows] = await dbPool.query(
      "SELECT id, uid, name, email, avatar_url, profile_cover_url, bio, submission_analysis_mode, autosave_interval_seconds, is_admin, is_banned, records_public, created_at FROM users WHERE id = ? LIMIT 1",
      [Number(user.id)]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: "user not found" });
    }

    return res.json({
      settings: {
        recordsPublic: Boolean(rows[0].records_public),
        profileCoverUrl: String(rows[0].profile_cover_url ?? ""),
        submissionAnalysisMode: normalizeSubmissionAnalysisMode(rows[0].submission_analysis_mode, "wrong_only"),
        autosaveIntervalSeconds: normalizeAutosaveIntervalSeconds(rows[0].autosave_interval_seconds, 30)
      },
      user: toPublicUser(rows[0])
    });
  });

  router.get("/users/:uid", async (req, res) => {
    const uid = normalizeUid(req.params.uid);
    if (!uid) {
      return res.status(400).json({ error: "uid is required" });
    }
    const [rows] = await dbPool.query(
      "SELECT id, uid, name, email, avatar_url, profile_cover_url, bio, submission_analysis_mode, is_admin, is_banned, records_public, created_at FROM users WHERE uid = ? LIMIT 1",
      [uid]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: "user not found" });
    }
    return res.json({ user: toPublicUser(rows[0]) });
  });

  router.get("/users/:uid/problemsets", async (req, res) => {
    const targetUid = normalizeUid(req.params.uid);
    if (!targetUid) {
      return res.status(400).json({ error: "uid is required" });
    }
    const actor = await getUserByHeader(req);
    const canSeePrivate = Boolean(actor?.is_admin) || String(actor?.uid ?? "") === targetUid;
    const [rows] = await dbPool.query(
      `
        SELECT
          p.id,
          p.title,
          p.description,
          p.duration_minutes,
          p.problemset_type,
          p.created_by_uid,
          p.created_at,
          COALESCE(COUNT(q.id), 0) AS question_count
        FROM problemsets p
        LEFT JOIN questions q ON q.problemset_id = p.id
        WHERE p.created_by_uid = ?
          AND (p.problemset_type <> 'personal_private' OR ?)
        GROUP BY p.id, p.title, p.description, p.duration_minutes, p.problemset_type, p.created_by_uid, p.created_at
        ORDER BY p.id DESC
      `,
      [targetUid, canSeePrivate ? 1 : 0]
    );
    return res.json({ problemsets: rows.map((row) => toProblemsetSummary(row)) });
  });

  router.post("/users", async (req, res) => {
    const username = String(req.body?.username ?? "").trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password ?? "");

    if (!username || username.length < 2 || username.length > 64) {
      return res.status(400).json({ error: "username must be 2-64 chars" });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ error: "invalid email" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "password must be at least 6 chars" });
    }

    const [exists] = await dbPool.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (Array.isArray(exists) && exists.length > 0) {
      return res.status(409).json({ error: "email already registered" });
    }

    const [adminCountRows] = await dbPool.query(
      "SELECT COUNT(*) AS cnt FROM users WHERE is_admin = 1 AND password_hash IS NOT NULL"
    );
    const shouldBeAdmin = Number(adminCountRows[0]?.cnt ?? 0) === 0;

    const [result] = await dbPool.query(
      "INSERT INTO users (name, email, password_hash, avatar_url, is_admin) VALUES (?, ?, ?, ?, ?)",
      [username, email, hashPassword(password), buildGravatarUrl(email), shouldBeAdmin ? 1 : 0]
    );
    const userId = Number(result.insertId);
    await dbPool.query("UPDATE users SET uid = ? WHERE id = ?", [`pre${userId}`, userId]);

    const [rows] = await dbPool.query(
      "SELECT id, uid, name, email, avatar_url, profile_cover_url, bio, is_admin, is_banned, records_public, created_at FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    return res.status(201).json({ user: toPublicUser(rows[0]) });
  });

  router.post("/sessions", async (req, res) => {
    const identifier = String(req.body?.identifier ?? "").trim();
    const password = String(req.body?.password ?? "");
    const email = normalizeEmail(identifier);

    if (!identifier || !password) {
      return res.status(400).json({ error: "identifier and password are required" });
    }

    const [rows] = await dbPool.query(
      "SELECT id, uid, name, email, avatar_url, profile_cover_url, bio, is_admin, is_banned, records_public, password_hash, created_at FROM users WHERE email = ? OR name = ? OR uid = ? LIMIT 1",
      [email, identifier, identifier]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const user = rows[0];
    if (user.is_banned) {
      return res.status(403).json({ error: "该用户已被封禁。" });
    }
    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    return res.status(201).json({
      session: {
        user: toPublicUser(user)
      }
    });
  });

  router.post("/auth/admin-token/session", async (req, res) => {
    const token = String(req.body?.token ?? "").trim();
    if (!isValidAdminToken(token)) {
      return res.status(400).json({ error: "token must be 32 chars with A-Z a-z 0-9" });
    }

    const [rows] = await dbPool.query(
      "SELECT id FROM admin_tokens WHERE BINARY token = ? LIMIT 1",
      [token]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(401).json({ error: "鏃犳晥鐨凾oken" });
    }

    return res.status(201).json({
      session: {
        user: toRootUser()
      }
    });
  });

  router.get("/oauth/cpoauth/authorize", async (req, res) => {
    const config = await getCpoauthConfig(req);
    if (!config.clientId || !config.clientSecret) {
      return res.status(503).json({ error: "cpoauth is not configured" });
    }
    if (!isHttpUrl(config.callbackUrl)) {
      return res.status(503).json({ error: "invalid cpoauth callback url" });
    }

    const state = randomBytes(24).toString("hex");
    const returnTo = normalizeReturnTo(req.query?.returnTo);
    const webBaseUrl = resolveWebBaseUrl(req, req.query?.webBaseUrl);
    await pingRedis();
    await redis.set(`oauth:cpoauth:state:${state}`, JSON.stringify({ returnTo, webBaseUrl }), "EX", 600);
    return res.redirect(302, buildCpoauthAuthorizeUrl(config, state));
  });

  router.get("/oauth/cpoauth/callback", async (req, res) => {
    const loginCallbackUrl = new URL("/auth/cpoauth/callback", resolveWebBaseUrl(req));
    const oauthError = String(req.query?.error ?? "").trim();
    const oauthErrorDescription = String(req.query?.error_description ?? req.query?.message ?? "").trim();
    if (oauthError) {
      loginCallbackUrl.searchParams.set(
        "error",
        oauthErrorDescription || (oauthError === "true" ? "cpoauth authorize failed" : oauthError)
      );
      return res.redirect(302, loginCallbackUrl.toString());
    }

    const code = String(req.query?.code ?? "").trim();
    const state = String(req.query?.state ?? "").trim();
    if (!code || !state) {
      loginCallbackUrl.searchParams.set("error", "missing_code_or_state");
      return res.redirect(302, loginCallbackUrl.toString());
    }

    await pingRedis();
    const stateKey = `oauth:cpoauth:state:${state}`;
    const statePayloadRaw = await redis.get(stateKey);
    await redis.del(stateKey);
    if (!statePayloadRaw) {
      loginCallbackUrl.searchParams.set("error", "invalid_state");
      return res.redirect(302, loginCallbackUrl.toString());
    }

    let statePayload = {};
    try {
      statePayload = JSON.parse(statePayloadRaw);
    } catch {
      loginCallbackUrl.searchParams.set("error", "invalid_state_payload");
      return res.redirect(302, loginCallbackUrl.toString());
    }
    const returnTo = normalizeReturnTo(statePayload?.returnTo);
    const webBaseUrl = resolveWebBaseUrl(req, statePayload?.webBaseUrl);
    loginCallbackUrl.href = new URL("/auth/cpoauth/callback", webBaseUrl).toString();

    try {
      const config = await getCpoauthConfig(req);
      if (!config.clientId || !config.clientSecret || !isHttpUrl(config.callbackUrl)) {
        throw new Error("cpoauth is not configured");
      }

      const accessToken = await exchangeCpoauthToken({
        code,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        callbackUrl: config.callbackUrl
      });
      const profile = await fetchCpoauthUserInfo(accessToken);
      const user = await findOrCreateCpoauthUser(profile);
      if (user.isBanned) {
        throw new Error("user is banned");
      }

      const ticket = randomBytes(24).toString("hex");
      await redis.set(`oauth:cpoauth:ticket:${ticket}`, JSON.stringify({ uid: user.uid, returnTo }), "EX", 120);

      loginCallbackUrl.searchParams.set("ticket", ticket);
      loginCallbackUrl.searchParams.set("returnTo", returnTo);
      return res.redirect(302, loginCallbackUrl.toString());
    } catch (err) {
      loginCallbackUrl.searchParams.set("error", String(err?.message ?? err));
      return res.redirect(302, loginCallbackUrl.toString());
    }
  });

  router.post("/oauth/cpoauth/session", async (req, res) => {
    const ticket = String(req.body?.ticket ?? "").trim();
    if (!ticket) {
      return res.status(400).json({ error: "ticket is required" });
    }

    await pingRedis();
    const key = `oauth:cpoauth:ticket:${ticket}`;
    const payloadRaw = await redis.get(key);
    await redis.del(key);
    if (!payloadRaw) {
      return res.status(401).json({ error: "invalid or expired ticket" });
    }

    let payload = {};
    try {
      payload = JSON.parse(payloadRaw);
    } catch {
      return res.status(401).json({ error: "invalid ticket payload" });
    }
    const uid = normalizeUid(payload?.uid);
    const returnTo = normalizeReturnTo(payload?.returnTo);

    const [rows] = await dbPool.query(
      "SELECT id, uid, name, email, avatar_url, profile_cover_url, bio, submission_analysis_mode, autosave_interval_seconds, is_admin, is_banned, records_public, created_at FROM users WHERE uid = ? LIMIT 1",
      [uid]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: "user not found" });
    }
    if (rows[0].is_banned) {
      return res.status(403).json({ error: "user is banned" });
    }

    return res.status(201).json({
      session: {
        user: toPublicUser(rows[0]),
        returnTo
      }
    });
  });

  router.get("/problemsets/:id/questions", async (req, res) => {
    const actor = await getUserByHeader(req);
    const problemsetId = Number(req.params.id);
    if (!Number.isFinite(problemsetId)) {
      return res.status(400).json({ error: "invalid problemset id" });
    }
    const problemset = await getProblemsetById(problemsetId);
    if (!problemset) {
      return res.status(404).json({ error: "problemset not found" });
    }
    if (!canUserViewProblemset(problemset, actor)) {
      return res.status(403).json({ error: "无权访问该题目。" });
    }
    const [rows] = await dbPool.query(
      "SELECT id, question_index, question_type, material_group_index, group_question_index, group_question_count, group_title, shared_material, stem, input_placeholder, options_json, score, answer, analysis FROM questions WHERE problemset_id = ? ORDER BY question_index ASC",
      [problemsetId]
    );
    return res.json({ questions: rows.map(toQuestion) });
  });

  router.get("/problemsets/:id/submissions", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const problemsetId = Number(req.params.id);
    if (!Number.isFinite(problemsetId)) {
      return res.status(400).json({ error: "invalid problemset id" });
    }
    const problemset = await getProblemsetById(problemsetId);
    if (!problemset) {
      return res.status(404).json({ error: "problemset not found" });
    }
    if (!canUserViewProblemset(problemset, user)) {
      return res.status(403).json({ error: "无权访问该题目。" });
    }

    const [historyRows] = await dbPool.query(
      `
        SELECT s.*, p.title AS problemset_title
        FROM submissions s
        LEFT JOIN problemsets p ON p.id = s.problemset_id
        WHERE s.user_uid = ? AND s.problemset_id = ? AND s.status = 'submitted'
        ORDER BY COALESCE(s.submitted_at, s.updated_at, s.created_at) DESC
      `,
      [user.uid, problemsetId]
    );
    const [activeRows] = await dbPool.query(
      `
        SELECT s.*, p.title AS problemset_title
        FROM submissions s
        LEFT JOIN problemsets p ON p.id = s.problemset_id
        WHERE s.user_uid = ? AND s.problemset_id = ? AND s.mode = 'exam' AND s.status IN ('in_progress', 'paused')
        ORDER BY s.updated_at DESC
        LIMIT 1
      `,
      [user.uid, problemsetId]
    );

    return res.json({
      submissions: historyRows.map(toSubmissionSummary),
      activeExam: Array.isArray(activeRows) && activeRows.length > 0 ? toSubmissionSummary(activeRows[0]) : null
    });
  });

  router.get("/submissions/:id", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const submissionId = Number(req.params.id);
    if (!Number.isFinite(submissionId)) {
      return res.status(400).json({ error: "invalid submission id" });
    }

    const [rows] = await dbPool.query(
      `
        SELECT s.*, p.title AS problemset_title
        FROM submissions s
        LEFT JOIN problemsets p ON p.id = s.problemset_id
        WHERE s.id = ?
        LIMIT 1
      `,
      [submissionId]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: "submission not found" });
    }
    const submission = rows[0];
    if (submission.user_uid !== user.uid && !user.is_admin) {
      return res.status(403).json({ error: "permission denied" });
    }
    return res.json({ submission: toSubmissionDetail(submission) });
  });

  router.post("/problemsets/:id/exam/start", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const problemsetId = Number(req.params.id);
    if (!Number.isFinite(problemsetId)) {
      return res.status(400).json({ error: "invalid problemset id" });
    }
    const forceNew = req.body?.forceNew === true;

    const problemset = await getProblemsetById(problemsetId);
    if (!problemset) {
      return res.status(404).json({ error: "problemset not found" });
    }
    if (!canUserViewProblemset(problemset, user)) {
      return res.status(403).json({ error: "无权访问该题目。" });
    }

    const [activeRows] = await dbPool.query(
      "SELECT * FROM submissions WHERE user_uid = ? AND mode = 'exam' AND status IN ('in_progress', 'paused') ORDER BY updated_at DESC LIMIT 1",
      [user.uid]
    );
    if (Array.isArray(activeRows) && activeRows.length > 0 && !forceNew) {
      return res.status(409).json({
        error: "active exam exists",
        activeExam: toSubmissionSummary(activeRows[0])
      });
    }
    if (Array.isArray(activeRows) && activeRows.length > 0 && forceNew) {
      await dbPool.query(
        "UPDATE submissions SET status = 'replaced' WHERE user_uid = ? AND mode = 'exam' AND status IN ('in_progress', 'paused')",
        [user.uid]
      );
    }

    const [scoreRows] = await dbPool.query(
      "SELECT COALESCE(SUM(score), 0) AS max_score FROM questions WHERE problemset_id = ?",
      [problemsetId]
    );
    const maxScore = Number(scoreRows[0]?.max_score ?? 0);
    const remainingSeconds = Math.max(60, Number(problemset?.duration_minutes ?? 120) * 60);

    const [result] = await dbPool.query(
      `
        INSERT INTO submissions (
          user_uid, problemset_id, mode, status, answers_json, results_json,
          score, max_score, remaining_seconds, started_at
        ) VALUES (?, ?, 'exam', 'in_progress', ?, ?, 0, ?, ?, NOW())
      `,
      [user.uid, problemsetId, JSON.stringify({}), JSON.stringify([]), maxScore, remainingSeconds]
    );

    const [rows] = await dbPool.query("SELECT * FROM submissions WHERE id = ? LIMIT 1", [result.insertId]);
    return res.status(201).json({ submission: toSubmissionDetail(rows[0]) });
  });

  router.post("/problemsets/:id/training/submit", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const problemsetId = Number(req.params.id);
    if (!Number.isFinite(problemsetId)) {
      return res.status(400).json({ error: "invalid problemset id" });
    }

    const problemset = await getProblemsetById(problemsetId);
    if (!problemset) {
      return res.status(404).json({ error: "problemset not found" });
    }
    if (!canUserViewProblemset(problemset, user)) {
      return res.status(403).json({ error: "无权访问该题目。" });
    }

    const calc = await calculateSubmission(problemsetId, req.body?.answers ?? {});
    const [result] = await dbPool.query(
      `
        INSERT INTO submissions (
          user_uid, problemset_id, mode, status, answers_json, results_json,
          score, max_score, submitted_at, started_at
        ) VALUES (?, ?, 'training', 'submitted', ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        user.uid,
        problemsetId,
        JSON.stringify(calc.answers),
        JSON.stringify(calc.results),
        calc.score,
        calc.maxScore
      ]
    );
    const [rows] = await dbPool.query("SELECT * FROM submissions WHERE id = ? LIMIT 1", [result.insertId]);
    return res.status(201).json({ submission: toSubmissionDetail(rows[0]) });
  });

  router.post("/submissions/:id/autosave", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const submissionId = Number(req.params.id);
    if (!Number.isFinite(submissionId)) {
      return res.status(400).json({ error: "invalid submission id" });
    }

    const [rows] = await dbPool.query("SELECT * FROM submissions WHERE id = ? LIMIT 1", [submissionId]);
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: "submission not found" });
    }
    const submission = rows[0];
    if (submission.user_uid !== user.uid) {
      return res.status(403).json({ error: "permission denied" });
    }
    if (submission.mode !== "exam" || submission.status !== "in_progress") {
      return res.status(400).json({ error: "submission is not in progress exam" });
    }

    const answers = normalizeSubmissionAnswers(req.body?.answers ?? {});
    const remainingSecondsRaw = req.body?.remainingSeconds;
    const remainingSeconds = Number.isFinite(Number(remainingSecondsRaw))
      ? Math.max(0, Math.floor(Number(remainingSecondsRaw)))
      : submission.remaining_seconds;
    await dbPool.query(
      "UPDATE submissions SET answers_json = ?, remaining_seconds = ? WHERE id = ?",
      [JSON.stringify(answers), remainingSeconds, submissionId]
    );
    return res.json({ ok: true });
  });

  router.post("/submissions/:id/pause", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const submissionId = Number(req.params.id);
    if (!Number.isFinite(submissionId)) {
      return res.status(400).json({ error: "invalid submission id" });
    }
    const [rows] = await dbPool.query("SELECT * FROM submissions WHERE id = ? LIMIT 1", [submissionId]);
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: "submission not found" });
    }
    const submission = rows[0];
    if (submission.user_uid !== user.uid) {
      return res.status(403).json({ error: "permission denied" });
    }
    if (submission.mode !== "exam" || submission.status !== "in_progress") {
      return res.status(400).json({ error: "submission is not pausable" });
    }

    const answers = normalizeSubmissionAnswers(req.body?.answers ?? {});
    const remainingSecondsRaw = req.body?.remainingSeconds;
    const remainingSeconds = Number.isFinite(Number(remainingSecondsRaw))
      ? Math.max(0, Math.floor(Number(remainingSecondsRaw)))
      : submission.remaining_seconds;
    await dbPool.query(
      "UPDATE submissions SET status = 'paused', answers_json = ?, remaining_seconds = ? WHERE id = ?",
      [JSON.stringify(answers), remainingSeconds, submissionId]
    );
    const [updatedRows] = await dbPool.query("SELECT * FROM submissions WHERE id = ? LIMIT 1", [submissionId]);
    return res.json({ submission: toSubmissionDetail(updatedRows[0]) });
  });

  router.post("/submissions/:id/resume", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const submissionId = Number(req.params.id);
    if (!Number.isFinite(submissionId)) {
      return res.status(400).json({ error: "invalid submission id" });
    }
    const [rows] = await dbPool.query("SELECT * FROM submissions WHERE id = ? LIMIT 1", [submissionId]);
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: "submission not found" });
    }
    const submission = rows[0];
    if (submission.user_uid !== user.uid) {
      return res.status(403).json({ error: "permission denied" });
    }
    if (submission.mode !== "exam" || (submission.status !== "paused" && submission.status !== "in_progress")) {
      return res.status(400).json({ error: "submission is not resumable" });
    }

    await dbPool.query(
      "UPDATE submissions SET status = 'in_progress' WHERE id = ?",
      [submissionId]
    );
    const [updatedRows] = await dbPool.query("SELECT * FROM submissions WHERE id = ? LIMIT 1", [submissionId]);
    return res.json({ submission: toSubmissionDetail(updatedRows[0]) });
  });

  router.post("/submissions/:id/submit", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const submissionId = Number(req.params.id);
    if (!Number.isFinite(submissionId)) {
      return res.status(400).json({ error: "invalid submission id" });
    }

    const [rows] = await dbPool.query("SELECT * FROM submissions WHERE id = ? LIMIT 1", [submissionId]);
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: "submission not found" });
    }
    const submission = rows[0];
    if (submission.user_uid !== user.uid) {
      return res.status(403).json({ error: "permission denied" });
    }
    if (submission.status !== "in_progress" && submission.status !== "paused") {
      return res.status(400).json({ error: "submission is not submittable" });
    }

    const mergedAnswers = {
      ...safeJsonParse(submission.answers_json, {}),
      ...normalizeSubmissionAnswers(req.body?.answers ?? {})
    };
    const calc = await calculateSubmission(Number(submission.problemset_id), mergedAnswers);
    const remainingSecondsRaw = req.body?.remainingSeconds;
    const remainingSeconds = Number.isFinite(Number(remainingSecondsRaw))
      ? Math.max(0, Math.floor(Number(remainingSecondsRaw)))
      : submission.remaining_seconds;

    await dbPool.query(
      `
        UPDATE submissions
        SET status = 'submitted',
            answers_json = ?,
            results_json = ?,
            score = ?,
            max_score = ?,
            remaining_seconds = ?,
            submitted_at = NOW()
        WHERE id = ?
      `,
      [
        JSON.stringify(calc.answers),
        JSON.stringify(calc.results),
        calc.score,
        calc.maxScore,
        remainingSeconds,
        submissionId
      ]
    );
    const [updatedRows] = await dbPool.query("SELECT * FROM submissions WHERE id = ? LIMIT 1", [submissionId]);
    return res.json({ submission: toSubmissionDetail(updatedRows[0]) });
  });

  router.get("/users/:uid/active-exam", async (req, res) => {
    const targetUid = normalizeUid(req.params.uid);
    const actor = await requireSelfOrAdmin(req, res, targetUid);
    if (!actor) return;
    const [rows] = await dbPool.query(
      `
        SELECT s.*, p.title AS problemset_title
        FROM submissions s
        LEFT JOIN problemsets p ON p.id = s.problemset_id
        WHERE s.user_uid = ? AND s.mode = 'exam' AND s.status IN ('paused', 'in_progress')
        ORDER BY s.updated_at DESC
        LIMIT 1
      `,
      [targetUid]
    );
    return res.json({
      submission: Array.isArray(rows) && rows.length > 0 ? toSubmissionSummary(rows[0]) : null
    });
  });

  router.get("/users/:uid/submissions", async (req, res) => {
    const targetUid = normalizeUid(req.params.uid);
    const [userRows] = await dbPool.query(
      "SELECT uid, records_public FROM users WHERE uid = ? LIMIT 1",
      [targetUid]
    );
    if (!Array.isArray(userRows) || userRows.length === 0) {
      return res.status(404).json({ error: "user not found" });
    }

    const actor = await getUserByHeader(req);
    const isOwnerOrAdmin = Boolean(actor) && (String(actor.uid) === targetUid || Boolean(actor.is_admin));
    const canView = isOwnerOrAdmin || Boolean(userRows[0].records_public);
    if (!canView) {
      return res.status(403).json({ error: "permission denied" });
    }

    const [rows] = await dbPool.query(
      `
        SELECT s.*, p.title AS problemset_title
        FROM submissions s
        LEFT JOIN problemsets p ON p.id = s.problemset_id
        WHERE s.user_uid = ? AND s.status = 'submitted'
        ORDER BY COALESCE(s.submitted_at, s.updated_at, s.created_at) DESC
        LIMIT 100
      `,
      [targetUid]
    );
    return res.json({ submissions: rows.map(toSubmissionSummary) });
  });

  router.get("/admin/problemsets", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const [rows] = await dbPool.query(`
      SELECT
        p.id,
        p.title,
        p.description,
        p.duration_minutes,
        p.problemset_type,
        p.created_by_uid,
        p.created_at,
        COALESCE(COUNT(q.id), 0) AS question_count
      FROM problemsets p
      LEFT JOIN questions q ON q.problemset_id = p.id
      GROUP BY p.id, p.title, p.description, p.duration_minutes, p.problemset_type, p.created_by_uid, p.created_at
      ORDER BY p.id ASC
    `);
    return res.json({ problemsets: rows.map(toProblemsetSummary) });
  });

  router.get("/admin/problemsets/:id/questions", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const problemsetId = Number(req.params.id);
    if (!Number.isFinite(problemsetId)) {
      return res.status(400).json({ error: "invalid problemset id" });
    }
    const [problemsetRows] = await dbPool.query(
      "SELECT id FROM problemsets WHERE id = ? LIMIT 1",
      [problemsetId]
    );
    if (!Array.isArray(problemsetRows) || problemsetRows.length === 0) {
      return res.status(404).json({ error: "problemset not found" });
    }

    const [rows] = await dbPool.query(
      "SELECT id, question_index, question_type, material_group_index, group_question_index, group_question_count, group_title, shared_material, stem, input_placeholder, options_json, score, answer, analysis FROM questions WHERE problemset_id = ? ORDER BY question_index ASC",
      [problemsetId]
    );
    return res.json({ questions: rows.map(toQuestion) });
  });

  router.delete("/admin/problemsets/:id/questions", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const problemsetId = Number(req.params.id);
    if (!Number.isFinite(problemsetId)) {
      return res.status(400).json({ error: "invalid problemset id" });
    }
    const [problemsetRows] = await dbPool.query(
      "SELECT id FROM problemsets WHERE id = ? LIMIT 1",
      [problemsetId]
    );
    if (!Array.isArray(problemsetRows) || problemsetRows.length === 0) {
      return res.status(404).json({ error: "problemset not found" });
    }

    await dbPool.query("DELETE FROM questions WHERE problemset_id = ?", [problemsetId]);
    return res.status(204).send();
  });

  router.patch("/admin/problemsets/:id", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const sourceId = Number(req.params.id);
    if (!Number.isFinite(sourceId)) {
      return res.status(400).json({ error: "invalid problemset id" });
    }

    const [existsRows] = await dbPool.query(
      "SELECT id FROM problemsets WHERE id = ? LIMIT 1",
      [sourceId]
    );
    if (!Array.isArray(existsRows) || existsRows.length === 0) {
      return res.status(404).json({ error: "problemset not found" });
    }

    const requestedId = req.body?.id;
    const nextId = Number.isFinite(Number(requestedId)) ? Number(requestedId) : sourceId;
    if (!Number.isInteger(nextId) || nextId <= 0) {
      return res.status(400).json({ error: "id must be a positive integer" });
    }

    const titleInput = req.body?.title;
    const descriptionInput = req.body?.description;
    const durationInput = req.body?.durationMinutes;
    const configInput = req.body?.questionConfig;
    const typeInput = req.body?.problemsetType;

    const sets = [];
    const values = [];
    if (nextId !== sourceId) {
      sets.push("id = ?");
      values.push(nextId);
    }
    if (typeof titleInput === "string") {
      const title = titleInput.trim();
      if (!title) return res.status(400).json({ error: "title cannot be empty" });
      sets.push("title = ?");
      values.push(title);
    }
    if (typeof descriptionInput === "string") {
      const description = descriptionInput.trim();
      if (!description) return res.status(400).json({ error: "description cannot be empty" });
      sets.push("description = ?");
      values.push(description);
    }
    if (durationInput !== undefined) {
      const durationMinutes = Number(durationInput);
      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        return res.status(400).json({ error: "durationMinutes must be positive" });
      }
      sets.push("duration_minutes = ?");
      values.push(Math.round(durationMinutes));
    }
    if (typeof configInput === "string") {
      sets.push("question_config = ?");
      values.push(configInput);
    }
    if (typeInput !== undefined) {
      const normalizedType = normalizeProblemsetType(typeInput);
      if (!normalizedType) {
        return res.status(400).json({ error: "invalid problemsetType" });
      }
      sets.push("problemset_type = ?");
      values.push(normalizedType);
    }
    if (sets.length === 0) {
      return res.status(400).json({ error: "nothing to update" });
    }

    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();
      if (nextId !== sourceId) {
        const [idRows] = await connection.query(
          "SELECT id FROM problemsets WHERE id = ? LIMIT 1",
          [nextId]
        );
        if (Array.isArray(idRows) && idRows.length > 0) {
          await connection.rollback();
          return res.status(409).json({ error: `problemset id ${nextId} already exists` });
        }
        const [questionConflictRows] = await connection.query(
          "SELECT id FROM questions WHERE problemset_id = ? LIMIT 1",
          [nextId]
        );
        if (Array.isArray(questionConflictRows) && questionConflictRows.length > 0) {
          await connection.rollback();
          return res.status(409).json({ error: `problemset id ${nextId} is occupied by existing questions` });
        }
      }

      await connection.query(
        `UPDATE problemsets SET ${sets.join(", ")} WHERE id = ?`,
        [...values, sourceId]
      );
      if (nextId !== sourceId) {
        await connection.query(
          "UPDATE questions SET problemset_id = ? WHERE problemset_id = ?",
          [nextId, sourceId]
        );
      }

      const [rows] = await connection.query(
        `
          SELECT
            p.id,
            p.title,
            p.description,
            p.duration_minutes,
            p.problemset_type,
            p.created_by_uid,
            p.created_at,
            COALESCE(COUNT(q.id), 0) AS question_count
          FROM problemsets p
          LEFT JOIN questions q ON q.problemset_id = p.id
          WHERE p.id = ?
          GROUP BY p.id, p.title, p.description, p.duration_minutes, p.problemset_type, p.created_by_uid, p.created_at
          LIMIT 1
        `,
        [nextId]
      );

      await connection.commit();
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(404).json({ error: "problemset not found after update" });
      }
      return res.json({ problemset: toProblemsetSummary(rows[0]) });
    } catch (err) {
      await connection.rollback();
      const message = String(err?.message ?? "");
      if (message.includes("Duplicate entry")) {
        return res.status(409).json({ error: "problemset id conflict" });
      }
      return res.status(500).json({ error: "update problemset failed" });
    } finally {
      connection.release();
    }
  });

  router.delete("/admin/problemsets/:id", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const problemsetId = Number(req.params.id);
    if (!Number.isFinite(problemsetId)) {
      return res.status(400).json({ error: "invalid problemset id" });
    }

    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query("DELETE FROM questions WHERE problemset_id = ?", [problemsetId]);
      const [result] = await connection.query("DELETE FROM problemsets WHERE id = ?", [problemsetId]);
      await connection.commit();
      if (!result?.affectedRows) {
        return res.status(404).json({ error: "problemset not found" });
      }
      return res.status(204).send();
    } catch {
      await connection.rollback();
      return res.status(500).json({ error: "delete problemset failed" });
    } finally {
      connection.release();
    }
  });

  router.patch("/admin/questions/:questionId", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const questionId = Number(req.params.questionId);
    if (!Number.isFinite(questionId)) {
      return res.status(400).json({ error: "invalid question id" });
    }

    const [rows] = await dbPool.query(
      "SELECT id, problemset_id, question_index, question_type, material_group_index, group_question_index, group_question_count, group_title, shared_material, stem, input_placeholder, options_json, score, answer, analysis FROM questions WHERE id = ? LIMIT 1",
      [questionId]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: "question not found" });
    }

    const current = rows[0];
    const mergedType = req.body?.type !== undefined
      ? normalizeQuestionType(req.body?.type)
      : String(current.question_type ?? "option");
    if (!mergedType) {
      return res.status(400).json({ error: "type must be option or input" });
    }

    const mergedIndex = req.body?.index !== undefined ? Number(req.body?.index) : Number(current.question_index);
    if (!Number.isInteger(mergedIndex) || mergedIndex <= 0) {
      return res.status(400).json({ error: "index must be a positive integer" });
    }

    const mergedStem = req.body?.stem !== undefined ? String(req.body?.stem ?? "").trim() : String(current.stem ?? "");
    if (!mergedStem) {
      return res.status(400).json({ error: "stem is required" });
    }

    const mergedScore = req.body?.score !== undefined ? Number(req.body?.score) : Number(current.score);
    if (!Number.isFinite(mergedScore) || mergedScore <= 0) {
      return res.status(400).json({ error: "score must be positive" });
    }

    const mergedAnalysis = req.body?.analysis !== undefined
      ? String(req.body?.analysis ?? "").trim()
      : String(current.analysis ?? "");
    const mergedAnswerRaw = req.body?.answer !== undefined
      ? String(req.body?.answer ?? "").trim()
      : String(current.answer ?? "").trim();

    let mergedOptions = req.body?.options !== undefined
      ? parseQuestionOptions(req.body?.options)
      : parseQuestionOptions(current.options_json);
    let mergedInputPlaceholder = req.body?.inputPlaceholder !== undefined
      ? String(req.body?.inputPlaceholder ?? "").trim()
      : String(current.input_placeholder ?? "").trim();
    let mergedAnswer = mergedAnswerRaw;

    if (mergedType === "option") {
      if (mergedOptions.length < 2 || mergedOptions.length > 26) {
        return res.status(400).json({ error: "option question must have 2-26 options" });
      }
      const allowedKeys = new Set(mergedOptions.map((option) => option.key));
      mergedAnswer = normalizeQuestionAnswer(mergedAnswerRaw)
        .split(",")
        .filter((key) => allowedKeys.has(key))
        .join(",");
      if (!mergedAnswer) {
        return res.status(400).json({ error: "option answer must contain valid option keys" });
      }
      mergedInputPlaceholder = "";
    } else {
      mergedOptions = [];
      if (!mergedAnswer) {
        return res.status(400).json({ error: "input question answer is required" });
      }
    }

    try {
      await dbPool.query(
        "UPDATE questions SET question_index = ?, question_type = ?, stem = ?, input_placeholder = ?, options_json = ?, score = ?, answer = ?, analysis = ? WHERE id = ?",
        [
          mergedIndex,
          mergedType,
          mergedStem,
          mergedInputPlaceholder,
          JSON.stringify(mergedOptions),
          mergedScore,
          mergedAnswer,
          mergedAnalysis,
          questionId
        ]
      );
    } catch (err) {
      const message = String(err?.message ?? "");
      if (message.includes("Duplicate entry")) {
        return res.status(409).json({ error: "question index already exists in this problemset" });
      }
      return res.status(500).json({ error: "update question failed" });
    }

    const [updatedRows] = await dbPool.query(
      "SELECT id, question_index, question_type, material_group_index, group_question_index, group_question_count, group_title, shared_material, stem, input_placeholder, options_json, score, answer, analysis FROM questions WHERE id = ? LIMIT 1",
      [questionId]
    );
    return res.json({ question: toQuestion(updatedRows[0]) });
  });

  router.delete("/admin/questions/:questionId", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const questionId = Number(req.params.questionId);
    if (!Number.isFinite(questionId)) {
      return res.status(400).json({ error: "invalid question id" });
    }

    const [result] = await dbPool.query("DELETE FROM questions WHERE id = ?", [questionId]);
    if (!result?.affectedRows) {
      return res.status(404).json({ error: "question not found" });
    }
    return res.status(204).send();
  });

  router.get("/admin/users", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const [rows] = await dbPool.query(
      "SELECT id, uid, name, email, avatar_url, profile_cover_url, bio, is_admin, is_banned, records_public, created_at FROM users ORDER BY id ASC"
    );
    return res.json({ users: rows.map(toPublicUser) });
  });

  router.get("/admin/oauth/cpoauth", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const config = await getCpoauthConfig(req);
    return res.json({ config });
  });

  router.put("/admin/oauth/cpoauth", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const clientId = String(req.body?.clientId ?? "").trim();
    const clientSecret = String(req.body?.clientSecret ?? "").trim();
    const callbackUrlInput = String(req.body?.callbackUrl ?? "").trim();
    const callbackUrl = callbackUrlInput || buildDefaultCallbackUrl(req);
    const scope = normalizeOauthScope(String(req.body?.scope ?? "").trim() || "openid profile email");

    if (!clientId) return res.status(400).json({ error: "clientId is required" });
    if (!clientSecret) return res.status(400).json({ error: "clientSecret is required" });
    if (!isHttpUrl(callbackUrl)) {
      return res.status(400).json({ error: "callbackUrl must be a valid http/https url" });
    }

    await Promise.all([
      setAppSetting(CPOAUTH_SETTING_KEYS.clientId, clientId),
      setAppSetting(CPOAUTH_SETTING_KEYS.clientSecret, clientSecret),
      setAppSetting(CPOAUTH_SETTING_KEYS.callbackUrl, callbackUrl),
      setAppSetting(CPOAUTH_SETTING_KEYS.scope, scope)
    ]);

    return res.json({
      config: {
        clientId,
        clientSecret,
        callbackUrl,
        scope
      }
    });
  });

  router.get("/admin/admin-tokens", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const [rows] = await dbPool.query(
      "SELECT id, token, created_by_uid, created_at FROM admin_tokens ORDER BY id DESC"
    );
    return res.json({
      tokens: rows.map((row) => ({
        id: Number(row.id),
        token: String(row.token ?? ""),
        createdByUid: String(row.created_by_uid ?? ""),
        createdAt: row.created_at
      }))
    });
  });

  router.post("/admin/admin-tokens", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const [countRows] = await dbPool.query("SELECT COUNT(*) AS cnt FROM admin_tokens");
    const count = Number(countRows?.[0]?.cnt ?? 0);
    if (count >= 2) {
      return res.status(400).json({ error: "鏈€澶氬彧鑳戒繚鐣?2 涓?admin token" });
    }

    let createdToken = "";
    let insertId = 0;
    for (let i = 0; i < 8; i += 1) {
      const candidate = generateAdminToken();
      try {
        const [result] = await dbPool.query(
          "INSERT INTO admin_tokens (token, created_by_uid) VALUES (?, ?)",
          [candidate, String(admin.uid ?? "") || null]
        );
        createdToken = candidate;
        insertId = Number(result?.insertId ?? 0);
        break;
      } catch (err) {
        const message = String(err?.message ?? "");
        if (message.includes("Duplicate entry")) continue;
        throw err;
      }
    }

    if (!createdToken || !insertId) {
      return res.status(500).json({ error: "failed to generate admin token" });
    }

    const [rows] = await dbPool.query(
      "SELECT id, token, created_by_uid, created_at FROM admin_tokens WHERE id = ? LIMIT 1",
      [insertId]
    );
    const row = rows[0];
    return res.status(201).json({
      token: {
        id: Number(row.id),
        token: String(row.token ?? ""),
        createdByUid: String(row.created_by_uid ?? ""),
        createdAt: row.created_at
      }
    });
  });

  router.delete("/admin/admin-tokens/:id", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "invalid token id" });
    }
    const [result] = await dbPool.query("DELETE FROM admin_tokens WHERE id = ?", [id]);
    if (!result?.affectedRows) {
      return res.status(404).json({ error: "token not found" });
    }
    return res.status(204).send();
  });

  router.patch("/admin/users/:uid", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const targetUid = normalizeUid(req.params.uid);
    const uidInput = req.body?.uid;
    const username = req.body?.username;
    const emailRaw = req.body?.email;
    const isAdmin = req.body?.isAdmin;
    const isBanned = req.body?.isBanned;
    const password = req.body?.password;

    const sets = [];
    const values = [];
    let nextUid = targetUid;

    if (typeof uidInput === "string" && uidInput.trim()) {
      const uid = normalizeUid(uidInput);
      if (!isValidUid(uid)) {
        return res.status(400).json({ error: "invalid uid" });
      }
      sets.push("uid = ?");
      values.push(uid);
      nextUid = uid;
    }
    if (typeof username === "string" && username.trim()) {
      sets.push("name = ?");
      values.push(username.trim());
    }
    if (typeof emailRaw === "string" && emailRaw.trim()) {
      const email = normalizeEmail(emailRaw);
      if (!isEmail(email)) {
        return res.status(400).json({ error: "invalid email" });
      }
      sets.push("email = ?");
      values.push(email);
      sets.push("avatar_url = ?");
      values.push(buildGravatarUrl(email));
    }
    if (typeof isAdmin === "boolean") {
      if (targetUid === admin.uid && !isAdmin) {
        return res.status(400).json({ error: "admin cannot remove self admin permission" });
      }
      sets.push("is_admin = ?");
      values.push(isAdmin ? 1 : 0);
    }
    if (typeof isBanned === "boolean") {
      if (targetUid === admin.uid && isBanned) {
        return res.status(400).json({ error: "admin cannot ban self" });
      }
      sets.push("is_banned = ?");
      values.push(isBanned ? 1 : 0);
    }
    if (typeof password === "string" && password.length >= 6) {
      sets.push("password_hash = ?");
      values.push(hashPassword(password));
    }
    if (sets.length === 0) {
      return res.status(400).json({ error: "nothing to update" });
    }

    values.push(targetUid);
    try {
      await dbPool.query(`UPDATE users SET ${sets.join(", ")} WHERE uid = ?`, values);
    } catch (err) {
      if (String(err?.message ?? "").includes("Duplicate entry")) {
        return res.status(409).json({ error: "uid or email already exists" });
      }
      throw err;
    }

    const [rows] = await dbPool.query(
      "SELECT id, uid, name, email, avatar_url, profile_cover_url, bio, submission_analysis_mode, autosave_interval_seconds, is_admin, is_banned, records_public, created_at FROM users WHERE uid = ? LIMIT 1",
      [nextUid]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: "user not found" });
    }
    return res.json({ user: toPublicUser(rows[0]) });
  });

  router.post("/admin/users/:uid/promote", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const targetUid = normalizeUid(req.params.uid);
    await dbPool.query("UPDATE users SET is_admin = 1 WHERE uid = ?", [targetUid]);
    return res.json({ ok: true });
  });

  router.post("/admin/users/:uid/ban", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const targetUid = normalizeUid(req.params.uid);
    const banned = req.body?.banned !== false;
    if (targetUid === admin.uid && banned) {
      return res.status(400).json({ error: "admin cannot ban self" });
    }
    await dbPool.query("UPDATE users SET is_banned = ? WHERE uid = ?", [banned ? 1 : 0, targetUid]);
    return res.json({ ok: true });
  });

  router.delete("/admin/users/:uid", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const targetUid = normalizeUid(req.params.uid);
    await dbPool.query("DELETE FROM users WHERE uid = ?", [targetUid]);
    return res.status(204).send();
  });

  router.post("/admin/problemsets/:id/questions", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const problemsetId = Number(req.params.id);
    if (!Number.isFinite(problemsetId)) {
      return res.status(400).json({ error: "invalid problemset id" });
    }

    const [problemsetRows] = await dbPool.query(
      "SELECT id FROM problemsets WHERE id = ? LIMIT 1",
      [problemsetId]
    );
    if (!Array.isArray(problemsetRows) || problemsetRows.length === 0) {
      return res.status(404).json({ error: "problemset not found" });
    }

    const type = normalizeQuestionType(req.body?.type ?? "option");
    if (!type) {
      return res.status(400).json({ error: "type must be option or input" });
    }
    const stem = String(req.body?.stem ?? "").trim();
    const analysis = String(req.body?.analysis ?? "").trim();
    const score = Number(req.body?.score ?? 1.5);
    const indexRaw = req.body?.index;
    const answerRaw = String(req.body?.answer ?? "").trim();
    if (!stem) {
      return res.status(400).json({ error: "stem is required" });
    }
    if (!Number.isFinite(score) || score <= 0) {
      return res.status(400).json({ error: "score must be positive" });
    }

    let nextIndex = Number(indexRaw);
    if (!Number.isInteger(nextIndex) || nextIndex <= 0) {
      const [maxRows] = await dbPool.query(
        "SELECT COALESCE(MAX(question_index), 0) AS max_index FROM questions WHERE problemset_id = ?",
        [problemsetId]
      );
      nextIndex = Number(maxRows[0]?.max_index ?? 0) + 1;
    }

    let options = parseQuestionOptions(req.body?.options);
    let inputPlaceholder = String(req.body?.inputPlaceholder ?? "").trim();
    let answer = answerRaw;
    if (type === "option") {
      if (options.length < 2 || options.length > 26) {
        return res.status(400).json({ error: "option question must have 2-26 options" });
      }
      const allowedKeys = new Set(options.map((item) => item.key));
      answer = normalizeQuestionAnswer(answerRaw)
        .split(",")
        .filter((item) => allowedKeys.has(item))
        .join(",");
      if (!answer) {
        return res.status(400).json({ error: "option answer must contain valid option keys" });
      }
      inputPlaceholder = "";
    } else {
      options = [];
      if (!answer) {
        return res.status(400).json({ error: "input question answer is required" });
      }
    }

    let result;
    try {
      [result] = await dbPool.query(
        "INSERT INTO questions (problemset_id, question_index, question_type, stem, input_placeholder, options_json, score, answer, analysis) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [problemsetId, nextIndex, type, stem, inputPlaceholder, JSON.stringify(options), score, answer, analysis]
      );
    } catch (err) {
      const message = String(err?.message ?? "");
      if (message.includes("Duplicate entry")) {
        return res.status(409).json({ error: "question index already exists in this problemset" });
      }
      return res.status(500).json({ error: "create question failed" });
    }

    const [rows] = await dbPool.query(
      "SELECT id, question_index, question_type, material_group_index, group_question_index, group_question_count, group_title, shared_material, stem, input_placeholder, options_json, score, answer, analysis FROM questions WHERE id = ? LIMIT 1",
      [result.insertId]
    );
    return res.status(201).json({ question: toQuestion(rows[0]) });
  });

  return router;
}
