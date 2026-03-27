import express from "express";
import { randomBytes } from "node:crypto";
import { dbPool, pingDb } from "./db.js";
import { pingRedis, redis } from "./redis.js";
import { buildGravatarUrl, hashPassword, normalizeEmail, verifyPassword } from "./auth.js";
import { env } from "./env.js";

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}

function normalizeUid(value) {
  return String(value ?? "").trim();
}

function isValidUid(value) {
  return /^[A-Za-z0-9_][A-Za-z0-9_-]{1,31}$/.test(normalizeUid(value));
}

function toPublicUser(row) {
  return {
    id: Number(row.id),
    uid: String(row.uid ?? ""),
    username: String(row.name ?? ""),
    email: String(row.email ?? ""),
    avatarUrl: String(row.avatar_url ?? ""),
    isAdmin: Boolean(row.is_admin),
    isBanned: Boolean(row.is_banned),
    createdAt: row.created_at
  };
}

function toQuestion(row) {
  return {
    id: String(row.id),
    index: Number(row.question_index),
    type: String(row.question_type ?? "option"),
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

const CPOAUTH_SETTING_KEYS = {
  clientId: "cpoauth.client_id",
  clientSecret: "cpoauth.client_secret",
  callbackUrl: "cpoauth.callback_url",
  scope: "cpoauth.scope"
};

function buildDefaultCallbackUrl() {
  return `${env.publicApiBaseUrl.replace(/\/$/, "")}/api/oauth/cpoauth/callback`;
}

function normalizeReturnTo(raw) {
  const value = String(raw ?? "").trim();
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/problemset";
  }
  return value;
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(String(value ?? "").trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeOauthScope(scopeRaw) {
  const existing = String(scopeRaw ?? "")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const merged = Array.from(new Set([...existing, "openid", "profile", "email"]));
  return merged.join(" ");
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

async function getCpoauthConfig() {
  const settings = await getAppSettings(Object.values(CPOAUTH_SETTING_KEYS));
  return {
    clientId: String(settings[CPOAUTH_SETTING_KEYS.clientId] ?? "").trim(),
    clientSecret: String(settings[CPOAUTH_SETTING_KEYS.clientSecret] ?? "").trim(),
    callbackUrl: String(settings[CPOAUTH_SETTING_KEYS.callbackUrl] ?? "").trim() || buildDefaultCallbackUrl(),
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
  return "CPOAuth 用户";
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

  const cpoUsername = normalizeUid(profile?.username);
  if (!isValidUid(cpoUsername)) {
    throw new Error("userinfo missing valid username");
  }
  const displayName = pickDisplayName(profile);
  const rawEmail = String(profile?.email ?? "").trim();
  const email = rawEmail && isEmail(rawEmail) ? normalizeEmail(rawEmail) : null;

  const [boundRows] = await dbPool.query(
    "SELECT id, uid, name, email, avatar_url, is_admin, is_banned, created_at FROM users WHERE oauth_provider = ? AND oauth_subject = ? LIMIT 1",
    ["cpoauth", subject]
  );
  if (Array.isArray(boundRows) && boundRows.length > 0) {
    const boundUser = boundRows[0];
    if (String(boundUser.uid ?? "").startsWith("pre")) {
      const [uidRows] = await dbPool.query(
        "SELECT id FROM users WHERE uid = ? AND id <> ? LIMIT 1",
        [cpoUsername, Number(boundUser.id)]
      );
      if (!Array.isArray(uidRows) || uidRows.length === 0) {
        await dbPool.query("UPDATE users SET uid = ? WHERE id = ?", [cpoUsername, Number(boundUser.id)]);
        boundUser.uid = cpoUsername;
      }
    }
    return toPublicUser(boundUser);
  }

  const [uidRows] = await dbPool.query("SELECT id FROM users WHERE uid = ? LIMIT 1", [cpoUsername]);
  if (Array.isArray(uidRows) && uidRows.length > 0) {
    throw new Error(`uid already exists: ${cpoUsername}`);
  }

  const username = await buildUniqueDisplayName(displayName);
  const avatarUrl = String(profile?.avatar_url ?? "").trim()
    || (email ? buildGravatarUrl(email) : buildGravatarUrl(`cpo-${subject}@auth.luogu.me`));

  try {
    const [result] = await dbPool.query(
      "INSERT INTO users (uid, name, email, password_hash, avatar_url, oauth_provider, oauth_subject) VALUES (?, ?, ?, NULL, ?, ?, ?)",
      [cpoUsername, username, email, avatarUrl, "cpoauth", subject]
    );

    const userId = Number(result.insertId);
    const [rows] = await dbPool.query(
      "SELECT id, uid, name, email, avatar_url, is_admin, is_banned, created_at FROM users WHERE id = ? LIMIT 1",
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
      "SELECT id, uid, name, email, avatar_url, is_admin, is_banned, created_at FROM users WHERE oauth_provider = ? AND oauth_subject = ? LIMIT 1",
      ["cpoauth", subject]
    );
    if (!Array.isArray(rows) || rows.length === 0) throw err;
    return toPublicUser(rows[0]);
  }
}

async function getAdminByHeader(req) {
  const adminUid = String(req.header("x-admin-uid") ?? "").trim();
  if (!adminUid) return null;
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
    "SELECT id, uid, name, email, avatar_url, is_admin, is_banned, created_at FROM users WHERE uid = ? LIMIT 1",
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

async function getNextProblemsetId() {
  const [rows] = await dbPool.query(`
    SELECT GREATEST(
      COALESCE((SELECT MAX(id) FROM problemsets), 1000),
      COALESCE((SELECT MAX(problemset_id) FROM questions), 1000)
    ) AS max_id
  `);
  return Number(rows[0]?.max_id ?? 1000) + 1;
}

function parseInlineAttrs(raw) {
  const attrs = {};
  const source = String(raw ?? "");
  const pattern = /([a-zA-Z_][a-zA-Z0-9_-]*)\s*=\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^\s]+)/g;
  let match = pattern.exec(source);
  while (match) {
    const key = match[1];
    let value = match[2] ?? "";
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    attrs[key] = value;
    match = pattern.exec(source);
  }
  return attrs;
}

function getSection(rawBlock, sectionName) {
  const regex = new RegExp(`\\[${sectionName}([^\\]]*)\\]([\\s\\S]*?)\\[\\/${sectionName}\\]`, "i");
  const matched = regex.exec(rawBlock);
  if (!matched) return null;
  return {
    attrs: parseInlineAttrs(matched[1] ?? ""),
    body: String(matched[2] ?? "").trim()
  };
}

function parseOptionLines(optionsText) {
  const lines = String(optionsText ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const options = [];
  for (const line of lines) {
    const letterMatch = /^([A-Za-z])[\.\)]\s*(.+)$/.exec(line);
    if (letterMatch) {
      options.push({ key: letterMatch[1].toUpperCase(), text: letterMatch[2].trim() });
      continue;
    }
    const numberMatch = /^(\d+)[\.\)]\s*(.+)$/.exec(line);
    if (numberMatch) {
      const index = Number(numberMatch[1]) - 1;
      if (index >= 0 && index < 26) {
        options.push({ key: String.fromCharCode(65 + index), text: numberMatch[2].trim() });
      }
    }
  }
  return options.filter((item, index, arr) => arr.findIndex((it) => it.key === item.key) === index);
}

function normalizeOptionAnswer(answerRaw) {
  const letters = String(answerRaw ?? "")
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
  const normalized = Array.from(new Set(letters)).filter((item) => /^[A-Z]$/.test(item));
  return normalized.join(",");
}

function parseQuestionConfig(configRaw) {
  const source = String(configRaw ?? "").replace(/\r\n/g, "\n");
  const blockRegex = /:::question([^\n]*)\n([\s\S]*?)\n:::/g;
  const parsed = [];
  const errors = [];
  let matched = blockRegex.exec(source);

  while (matched) {
    const headerAttrs = parseInlineAttrs(matched[1] ?? "");
    const blockBody = String(matched[2] ?? "");
    const questionType = String(headerAttrs.type ?? "").trim().toLowerCase();
    const score = Number(headerAttrs.score ?? NaN);
    const stemSection = getSection(blockBody, "stem");
    const analysisSection = getSection(blockBody, "analysis");

    if (!questionType || (questionType !== "option" && questionType !== "input")) {
      errors.push("题型 type 只支持 option 或 input");
      matched = blockRegex.exec(source);
      continue;
    }
    if (!Number.isFinite(score) || score <= 0) {
      errors.push("score 必须为正数");
      matched = blockRegex.exec(source);
      continue;
    }
    if (!stemSection?.body) {
      errors.push("每个题目都必须提供 [stem]...[/stem]");
      matched = blockRegex.exec(source);
      continue;
    }

    if (questionType === "option") {
      const optionSection = getSection(blockBody, "options");
      const answer = normalizeOptionAnswer(optionSection?.attrs?.answer ?? "");
      const options = parseOptionLines(optionSection?.body ?? "");
      if (!optionSection) {
        errors.push("选择题需要 [options answer=A]...[/options]");
        matched = blockRegex.exec(source);
        continue;
      }
      if (options.length < 2 || options.length > 26) {
        errors.push("选择题选项数量必须在 2~26");
        matched = blockRegex.exec(source);
        continue;
      }
      if (!answer) {
        errors.push("选择题答案不能为空，例如 answer=A 或 answer=A,C");
        matched = blockRegex.exec(source);
        continue;
      }

      parsed.push({
        type: "option",
        score,
        stem: stemSection.body,
        options,
        answer,
        inputPlaceholder: "",
        analysis: analysisSection?.body ?? ""
      });
    } else {
      const inputSection = getSection(blockBody, "input");
      const answer = String(inputSection?.attrs?.answer ?? "").trim();
      if (!inputSection) {
        errors.push("填空题需要 [input answer=xxx placeholder=提示]...[/input]");
        matched = blockRegex.exec(source);
        continue;
      }
      if (!answer) {
        errors.push("填空题 answer 不能为空");
        matched = blockRegex.exec(source);
        continue;
      }

      parsed.push({
        type: "input",
        score,
        stem: stemSection.body,
        options: [],
        answer,
        inputPlaceholder: String(inputSection.attrs?.placeholder ?? inputSection.body ?? "").trim(),
        analysis: analysisSection?.body ?? ""
      });
    }

    matched = blockRegex.exec(source);
  }

  if (parsed.length === 0 && errors.length === 0) {
    errors.push("未解析到题目，请检查配置格式。");
  }
  return { questions: parsed, errors };
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

  router.get("/problemsets", async (_req, res) => {
    const [rows] = await dbPool.query(`
      SELECT
        p.id,
        p.title,
        p.description,
        p.duration_minutes,
        COALESCE(COUNT(q.id), 0) AS question_count
      FROM problemsets p
      LEFT JOIN questions q ON q.problemset_id = p.id
      GROUP BY p.id, p.title, p.description, p.duration_minutes
      ORDER BY p.id ASC
    `);
    return res.json({
      problemsets: rows.map((row) => ({
        id: Number(row.id),
        title: row.title,
        description: row.description,
        questionCount: Number(row.question_count ?? 0),
        durationHours: Number(row.duration_minutes ?? 120) / 60
      }))
    });
  });

  router.get("/problemsets/:id", async (req, res) => {
    const problemsetId = Number(req.params.id);
    if (!Number.isFinite(problemsetId)) {
      return res.status(400).json({ error: "invalid problemset id" });
    }

    const [summaryRows] = await dbPool.query(
      "SELECT id, title, description, duration_minutes FROM problemsets WHERE id = ? LIMIT 1",
      [problemsetId]
    );
    if (!Array.isArray(summaryRows) || summaryRows.length === 0) {
      return res.status(404).json({ error: "problemset not found" });
    }

    const [questionRows] = await dbPool.query(
      "SELECT id, question_index, question_type, stem, input_placeholder, options_json, score, answer, analysis FROM questions WHERE problemset_id = ? ORDER BY question_index ASC",
      [problemsetId]
    );

    const summary = summaryRows[0];
    return res.json({
      summary: {
        id: Number(summary.id),
        title: summary.title,
        description: summary.description,
        questionCount: questionRows.length,
        durationHours: Number(summary.duration_minutes ?? 120) / 60
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
        problemsetId = await getNextProblemsetId();
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
          "INSERT INTO problemsets (id, title, description, duration_minutes, question_config, created_by_uid) VALUES (?, ?, ?, ?, ?, ?)",
          [problemsetId, title, description, Math.round(durationMinutes), questionConfig, user.uid]
        );

        for (let index = 0; index < parsed.questions.length; index += 1) {
          const question = parsed.questions[index];
          await connection.query(
            "INSERT INTO questions (problemset_id, question_index, question_type, stem, input_placeholder, options_json, score, answer, analysis) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              problemsetId,
              index + 1,
              question.type,
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
          durationHours: Math.round(durationMinutes) / 60
        }
      });
    } catch {
      return res.status(500).json({ error: "create problemset failed" });
    }
  });

  router.get("/users", async (_req, res) => {
    const [rows] = await dbPool.query(
      "SELECT id, uid, name, email, avatar_url, is_admin, is_banned, created_at FROM users ORDER BY id ASC LIMIT 100"
    );
    res.json({ users: rows.map(toPublicUser) });
  });

  router.get("/users/:uid", async (req, res) => {
    const uid = normalizeUid(req.params.uid);
    if (!uid) {
      return res.status(400).json({ error: "uid is required" });
    }
    const [rows] = await dbPool.query(
      "SELECT id, uid, name, email, avatar_url, is_admin, is_banned, created_at FROM users WHERE uid = ? LIMIT 1",
      [uid]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: "user not found" });
    }
    return res.json({ user: toPublicUser(rows[0]) });
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
      "SELECT id, uid, name, email, avatar_url, is_admin, is_banned, created_at FROM users WHERE id = ? LIMIT 1",
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
      "SELECT id, uid, name, email, avatar_url, is_admin, is_banned, password_hash, created_at FROM users WHERE email = ? OR name = ? OR uid = ? LIMIT 1",
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

  router.get("/oauth/cpoauth/authorize", async (req, res) => {
    const config = await getCpoauthConfig();
    if (!config.clientId || !config.clientSecret) {
      return res.status(503).json({ error: "cpoauth is not configured" });
    }
    if (!isHttpUrl(config.callbackUrl)) {
      return res.status(503).json({ error: "invalid cpoauth callback url" });
    }

    const state = randomBytes(24).toString("hex");
    const returnTo = normalizeReturnTo(req.query?.returnTo);
    await pingRedis();
    await redis.set(`oauth:cpoauth:state:${state}`, JSON.stringify({ returnTo }), "EX", 600);
    return res.redirect(302, buildCpoauthAuthorizeUrl(config, state));
  });

  router.get("/oauth/cpoauth/callback", async (req, res) => {
    const loginCallbackUrl = new URL("/auth/cpoauth/callback", env.webBaseUrl);
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

    try {
      const config = await getCpoauthConfig();
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
      "SELECT id, uid, name, email, avatar_url, is_admin, is_banned, created_at FROM users WHERE uid = ? LIMIT 1",
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
    const problemsetId = Number(req.params.id);
    if (!Number.isFinite(problemsetId)) {
      return res.status(400).json({ error: "invalid problemset id" });
    }
    const [rows] = await dbPool.query(
      "SELECT id, question_index, question_type, stem, input_placeholder, options_json, score, answer, analysis FROM questions WHERE problemset_id = ? ORDER BY question_index ASC",
      [problemsetId]
    );
    return res.json({ questions: rows.map(toQuestion) });
  });

  router.get("/admin/users", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const [rows] = await dbPool.query(
      "SELECT id, uid, name, email, avatar_url, is_admin, is_banned, created_at FROM users ORDER BY id ASC"
    );
    return res.json({ users: rows.map(toPublicUser) });
  });

  router.get("/admin/oauth/cpoauth", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const config = await getCpoauthConfig();
    return res.json({ config });
  });

  router.put("/admin/oauth/cpoauth", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const clientId = String(req.body?.clientId ?? "").trim();
    const clientSecret = String(req.body?.clientSecret ?? "").trim();
    const callbackUrlInput = String(req.body?.callbackUrl ?? "").trim();
    const callbackUrl = callbackUrlInput || buildDefaultCallbackUrl();
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

  router.post("/admin/users", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const username = String(req.body?.username ?? "").trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password ?? "");
    if (!username || !isEmail(email) || password.length < 6) {
      return res.status(400).json({ error: "invalid payload" });
    }

    const [exists] = await dbPool.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (Array.isArray(exists) && exists.length > 0) {
      return res.status(409).json({ error: "email already exists" });
    }

    const [result] = await dbPool.query(
      "INSERT INTO users (name, email, password_hash, avatar_url) VALUES (?, ?, ?, ?)",
      [username, email, hashPassword(password), buildGravatarUrl(email)]
    );
    const userId = Number(result.insertId);
    await dbPool.query("UPDATE users SET uid = ? WHERE id = ?", [`pre${userId}`, userId]);
    const [rows] = await dbPool.query(
      "SELECT id, uid, name, email, avatar_url, is_admin, is_banned, created_at FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    return res.status(201).json({ user: toPublicUser(rows[0]) });
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
      "SELECT id, uid, name, email, avatar_url, is_admin, is_banned, created_at FROM users WHERE uid = ? LIMIT 1",
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

    const stem = String(req.body?.stem ?? "").trim();
    const answer = String(req.body?.answer ?? "").trim();
    const analysis = String(req.body?.analysis ?? "").trim();
    const score = Number(req.body?.score ?? 1.5);
    const options = Array.isArray(req.body?.options) ? req.body.options : [];

    if (!stem || !answer || !analysis || options.length < 2) {
      return res.status(400).json({ error: "invalid question payload" });
    }

    const [maxRows] = await dbPool.query(
      "SELECT COALESCE(MAX(question_index), 0) AS max_index FROM questions WHERE problemset_id = ?",
      [problemsetId]
    );
    const nextIndex = Number(maxRows[0]?.max_index ?? 0) + 1;

    const [result] = await dbPool.query(
      "INSERT INTO questions (problemset_id, question_index, stem, options_json, score, answer, analysis) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [problemsetId, nextIndex, stem, JSON.stringify(options), score, answer, analysis]
    );

    const [rows] = await dbPool.query(
      "SELECT id, question_index, stem, options_json, score, answer, analysis FROM questions WHERE id = ? LIMIT 1",
      [result.insertId]
    );
    return res.status(201).json({ question: toQuestion(rows[0]) });
  });

  router.get("/cache-demo", async (_req, res) => {
    const key = "demo:counter";
    const next = await redis.incr(key);
    res.json({ key, value: next });
  });

  return router;
}
