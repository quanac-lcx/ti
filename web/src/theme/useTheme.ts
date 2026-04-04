import { computed, ref } from "vue";
import { applyThemeTokens, type ThemeMode } from "./tokens";

const THEME_STORAGE_KEY = "ti.theme-mode";
const themeMode = ref<ThemeMode>("light");
let initialized = false;

function readStoredThemeMode(): ThemeMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "dark" || stored === "light" ? stored : null;
}

function detectPreferredThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function setThemeMode(nextMode: ThemeMode): void {
  themeMode.value = nextMode;
  applyThemeTokens(nextMode);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextMode);
  }
}

export function initializeThemeMode(): ThemeMode {
  if (!initialized) {
    const initialMode = readStoredThemeMode() ?? detectPreferredThemeMode();
    themeMode.value = initialMode;
    applyThemeTokens(initialMode);
    initialized = true;
  }

  return themeMode.value;
}

export function toggleThemeMode(): void {
  setThemeMode(themeMode.value === "dark" ? "light" : "dark");
}

export function useThemeMode() {
  return {
    themeMode,
    isDarkTheme: computed(() => themeMode.value === "dark")
  };
}
