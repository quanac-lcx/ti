import express from "express";
import { pingDb } from "./db.js";
import { pingRedis } from "./redis.js";
import { dbPool } from "./db.js";
import { redis } from "./redis.js";

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

  router.get("/users", async (_req, res) => {
    const [rows] = await dbPool.query(
      "SELECT id, name, created_at FROM users ORDER BY id ASC LIMIT 100"
    );
    res.json({ users: rows });
  });

  router.get("/cache-demo", async (_req, res) => {
    const key = "demo:counter";
    const next = await redis.incr(key);
    res.json({ key, value: next });
  });

  return router;
}

