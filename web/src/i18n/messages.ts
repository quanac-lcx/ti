import { zhCN } from "./zh-CN";
import { enUS } from "./en-US";
import { jaJP } from "./ja-JP";

type BaseLocaleMessages = typeof zhCN;
type MessageLocale = "zh-CN" | "en-US" | "ja-JP";

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
  "ja-JP": withPreferenceMessages("ja-JP", jaJP as unknown as BaseLocaleMessages)
} as const;

export type MessageSchema = typeof messages;
export type AppLocale = keyof MessageSchema;
