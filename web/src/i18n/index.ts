import { computed, ref } from "vue";
import { createI18n } from "vue-i18n";
import { messages, type AppLocale } from "./messages";

const LOCALE_STORAGE_KEY = "ti.locale";
const fallbackLocale: AppLocale = "en-US";
const locale = ref<AppLocale>(detectSystemLocale());
let initialized = false;

export const localeOptions: Array<{ value: AppLocale; labelKey: string }> = [
  { value: "zh-CN", labelKey: "locale.zhCN" },
  { value: "en-US", labelKey: "locale.enUS" },
  { value: "ja-JP", labelKey: "locale.jaJP" },
  { value: "origin", labelKey: "locale.origin" }
];

function isSupportedLocale(value: string): value is AppLocale {
  return value === "zh-CN" || value === "en-US" || value === "ja-JP" || value === "origin";
}

function readStoredLocale(): AppLocale | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored && isSupportedLocale(stored) ? stored : null;
}

function detectSystemLocale(): AppLocale {
  if (typeof navigator === "undefined") return fallbackLocale;
  const candidates = [...(navigator.languages ?? []), navigator.language].filter(Boolean);
  for (const candidate of candidates) {
    const normalized = String(candidate).toLowerCase();
    if (normalized.startsWith("zh")) return "zh-CN";
    if (normalized.startsWith("en")) return "en-US";
    if (normalized.startsWith("ja")) return "ja-JP";
  }
  return fallbackLocale;
}

function syncDocumentLang(locale: AppLocale) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
}

function syncLocale(nextLocale: AppLocale, persist: boolean) {
  locale.value = nextLocale;
  i18n.global.locale.value = nextLocale;
  syncDocumentLang(nextLocale);

  if (persist && typeof window !== "undefined") {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
  }
}

export const i18n = createI18n({
  legacy: false,
  locale: readStoredLocale() ?? detectSystemLocale(),
  fallbackLocale,
  messages
});

export function initializeLocale() {
  if (!initialized) {
    syncLocale(readStoredLocale() ?? detectSystemLocale(), false);
    initialized = true;
  }

  return i18n.global.locale.value as AppLocale;
}

export function setLocale(nextLocale: AppLocale) {
  syncLocale(nextLocale, true);
}

export function useAppLocale() {
  return {
    currentLocale: computed(() => locale.value),
    localeOptions,
    setLocale
  };
}

export function translate(key: string, params?: Record<string, unknown>) {
  return String(i18n.global.t(key, params ?? {}));
}
