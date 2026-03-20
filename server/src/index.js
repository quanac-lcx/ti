import express from "express";
import cors from "cors";
import { env } from "./env.js";
import { buildRouter } from "./routes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", buildRouter());

app.get("/", (_req, res) => {
  res.type("text").send("api up");
});

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on :${env.port}`);
});

