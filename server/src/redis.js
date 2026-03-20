import Redis from "ioredis";
import { env } from "./env.js";

export const redis = new Redis({
  host: env.redis.host,
  port: env.redis.port,
  lazyConnect: true,
  maxRetriesPerRequest: 2
});

export async function pingRedis() {
  if (redis.status === "end") return;
  if (redis.status !== "ready") await redis.connect();
  await redis.ping();
}

