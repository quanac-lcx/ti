import { zhCN } from "./zh-CN";
import { enUS } from "./en-US";
import { jaJP } from "./ja-JP";

function buildOriginMessages(source: unknown, path: string[] = []): unknown {
  if (source === null || typeof source !== "object" || Array.isArray(source)) {
    return `(${path.join(".")})`;
  }

  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, buildOriginMessages(value, [...path, key])])
  );
}

type BaseLocaleMessages = typeof zhCN;
type MessageLocale = "zh-CN" | "en-US" | "ja-JP" | "origin";

const localeSystemLabels = {
  "zh-CN": "跟随系统",
  "en-US": "Follow system",
  "ja-JP": "システムに従う",
  origin: "Follow system"
} as const satisfies Record<MessageLocale, string>;

const themeLabels = {
  "zh-CN": {
    label: "主题",
    system: "跟随系统",
    light: "浅色",
    dark: "深色"
  },
  "en-US": {
    label: "Theme",
    system: "Follow system",
    light: "Light",
    dark: "Dark"
  },
  "ja-JP": {
    label: "テーマ",
    system: "システムに従う",
    light: "ライト",
    dark: "ダーク"
  },
  origin: {
    label: "Theme",
    system: "Follow system",
    light: "Light",
    dark: "Dark"
  }
} as const satisfies Record<
  MessageLocale,
  {
    label: string;
    system: string;
    light: string;
    dark: string;
  }
>;

function withPreferenceMessages(locale: MessageLocale, source: BaseLocaleMessages) {
  return {
    ...source,
    layout: {
      ...source.layout,
      themeLabel: themeLabels[locale].label,
      themeLight: themeLabels[locale].light,
      themeDark: themeLabels[locale].dark
    }
  };
}

export const messages = {
  "zh-CN": withPreferenceMessages("zh-CN", zhCN),
  "en-US": withPreferenceMessages("en-US", enUS as unknown as BaseLocaleMessages),
  "ja-JP": withPreferenceMessages("ja-JP", jaJP as unknown as BaseLocaleMessages),
  origin: withPreferenceMessages("origin", buildOriginMessages(zhCN) as unknown as BaseLocaleMessages)
} as const;

export type MessageSchema = typeof messages;
export type AppLocale = keyof MessageSchema;
