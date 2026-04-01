// @ts-nocheck
import dotenv from "dotenv";

dotenv.config();

const port = Number(process.env.PORT ?? 3000);

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port,
  publicApiBaseUrl: process.env.PUBLIC_API_BASE_URL ?? `http://localhost:${port}`,
  webBaseUrl: process.env.WEB_BASE_URL ?? "http://localhost:5173",
  cpoauthBaseUrl: process.env.CPOAUTH_BASE_URL ?? "https://auth.luogu.me",
  db: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "app",
    password: process.env.DB_PASSWORD ?? "app",
    name: process.env.DB_NAME ?? "luogu_ti"
  },
  redis: {
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT ?? 6379)
  }
};



