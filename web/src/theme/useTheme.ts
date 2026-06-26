import { computed, ref } from "vue";
import { applyThemeTokens, type ResolvedThemeMode, type ThemeMode } from "./tokens";

const THEME_STORAGE_KEY = "ti.theme-mode";
const themeMode = ref<ThemeMode>("auto");
const systemPrefersDark = ref(false);
let initialized = false;
let systemMediaQuery: MediaQueryList | null = null;

function readStoredThemeMode(): ThemeMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "auto" || stored === "dark" || stored === "light" ? stored as ThemeMode : null;
}

function detectSystemPrefersDark(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveThemeMode(mode: ThemeMode): ResolvedThemeMode {
  if (mode === "auto") {
    return systemPrefersDark.value ? "dark" : "light";
  }
  return mode;
}

function applyCurrentTheme(): void {
  applyThemeTokens(resolveThemeMode(themeMode.value));
}

export function setThemeMode(nextMode: ThemeMode): void {
  themeMode.value = nextMode;
  applyCurrentTheme();

  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextMode);
  }
}

function handleSystemThemeChange() {
  systemPrefersDark.value = detectSystemPrefersDark();
  if (themeMode.value === "auto") {
    applyCurrentTheme();
  }
}

export function initializeThemeMode(): ThemeMode {
  if (!initialized) {
    systemPrefersDark.value = detectSystemPrefersDark();

    const initialMode = readStoredThemeMode() ?? "auto";
    themeMode.value = initialMode;
    applyCurrentTheme();
    initialized = true;

    if (typeof window !== "undefined") {
      systemMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      systemMediaQuery.addEventListener("change", handleSystemThemeChange);
    }
  }

  return themeMode.value;
}

export function nextThemeMode(mode: ThemeMode): ThemeMode {
  const order: ThemeMode[] = ["auto", "light", "dark"];
  const index = order.indexOf(mode);
  return order[(index + 1) % order.length];
}

export function useThemeMode() {
  return {
    themeMode,
    isDarkTheme: computed(() => resolveThemeMode(themeMode.value) === "dark"),
    resolvedThemeMode: computed<ResolvedThemeMode>(() => resolveThemeMode(themeMode.value))
  };
}

export { type ThemeMode };
