import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const cdnBaseUrl = (process.env.VITE_CDN_BASE_URL ?? "").trim();

export default defineConfig({
  plugins: [vue()],
  base: cdnBaseUrl || "/",
  server: {
    port: 5173,
  },
});

