export type ThemeMode = "light" | "dark";

export interface LayoutThemeTokens {
  siderBg: string;
  siderBorder: string;
  headerBg: string;
  headerBorder: string;
  brandBg: string;
  navHoverBg: string;
  navActiveBg: string;
  navActiveIndicator: string;
  dropdownShadow: string;
}

export interface AppThemeTokens {
  borderRadius: number;
  colorBgLayout: string;
  colorBgContainer: string;
  colorBgMuted: string;
  colorBgSubtle: string;
  colorBgElevated: string;
  colorBgInput: string;
  colorBgMask: string;
  colorBgModal: string;
  colorSurfaceInverse: string;
  colorTextOnInverse: string;
  colorBorder: string;
  colorBorderStrong: string;
  colorBorderSubtle: string;
  colorText: string;
  colorTextMuted: string;
  colorTextSoft: string;
  colorPrimary: string;
  colorPrimarySoft: string;
  colorSuccess: string;
  colorSuccessSoft: string;
  colorDanger: string;
  colorDangerSoft: string;
  colorWarning: string;
  colorWarningSoft: string;
  colorWarningBorder: string;
  colorWarningText: string;
  colorNeutralFill: string;
  shadowNone: string;
  shadowSm: string;
  layout: LayoutThemeTokens;
}

export const softLightThemeTokens = {
  borderRadius: 6,
  colorBgLayout: "#f4f6f9",
  colorBgContainer: "#fbfcfe",
  colorBgMuted: "#f1f4f8",
  colorBgSubtle: "#edf2f7",
  colorBgElevated: "#f7f9fc",
  colorBgInput: "#f8fafc",
  colorBgMask: "rgba(214, 221, 231, 0.76)",
  colorBgModal: "rgba(251, 252, 254, 0.96)",
  colorSurfaceInverse: "#2b3544",
  colorTextOnInverse: "#f8fbff",
  colorBorder: "#d9e1eb",
  colorBorderStrong: "#c6d0dd",
  colorBorderSubtle: "#e8edf3",
  colorText: "#1f2937",
  colorTextMuted: "#526072",
  colorTextSoft: "#718096",
  colorPrimary: "#5f7bd9",
  colorPrimarySoft: "#eef2ff",
  colorSuccess: "#5f9b78",
  colorSuccessSoft: "#edf7f1",
  colorDanger: "#c96f72",
  colorDangerSoft: "#fdf0f1",
  colorWarning: "#b98a4a",
  colorWarningSoft: "#f8f1e6",
  colorWarningBorder: "#e8d4b6",
  colorWarningText: "#8d6932",
  colorNeutralFill: "#c8d1dc",
  shadowNone: "none",
  shadowSm: "0 16px 32px rgba(143, 157, 179, 0.16)",
  layout: {
    siderBg: "#fbfcfe",
    siderBorder: "#d9e1eb",
    headerBg: "#fbfcfe",
    headerBorder: "#d9e1eb",
    brandBg: "#f3f6fb",
    navHoverBg: "#eef2f7",
    navActiveBg: "#eef2ff",
    navActiveIndicator: "#5f7bd9",
    dropdownShadow: "0 16px 32px rgba(143, 157, 179, 0.18)"
  }
} as const satisfies AppThemeTokens;

export const softDarkThemeTokens = {
  borderRadius: 6,
  colorBgLayout: "#10141b",
  colorBgContainer: "#171d27",
  colorBgMuted: "#1b2230",
  colorBgSubtle: "#222b3b",
  colorBgElevated: "#1d2533",
  colorBgInput: "#141a24",
  colorBgMask: "rgba(4, 7, 12, 0.68)",
  colorBgModal: "rgba(23, 29, 39, 0.96)",
  colorSurfaceInverse: "#ecf1f8",
  colorTextOnInverse: "#18202c",
  colorBorder: "#2c3648",
  colorBorderStrong: "#3a4760",
  colorBorderSubtle: "#232c3d",
  colorText: "#e8eef7",
  colorTextMuted: "#b6c1d3",
  colorTextSoft: "#8794ab",
  colorPrimary: "#8fa4ff",
  colorPrimarySoft: "#243150",
  colorSuccess: "#77bf93",
  colorSuccessSoft: "#1f3128",
  colorDanger: "#e88f95",
  colorDangerSoft: "#372127",
  colorWarning: "#d4ad68",
  colorWarningSoft: "#2e291d",
  colorWarningBorder: "#5a4e2f",
  colorWarningText: "#f1d8a6",
  colorNeutralFill: "#4b5973",
  shadowNone: "none",
  shadowSm: "0 18px 36px rgba(2, 6, 23, 0.42)",
  layout: {
    siderBg: "#151b25",
    siderBorder: "#2c3648",
    headerBg: "#151b25",
    headerBorder: "#2c3648",
    brandBg: "#131923",
    navHoverBg: "#1d2533",
    navActiveBg: "#243150",
    navActiveIndicator: "#8fa4ff",
    dropdownShadow: "0 18px 36px rgba(2, 6, 23, 0.42)"
  }
} as const satisfies AppThemeTokens;

export const themeTokensMap = {
  light: softLightThemeTokens,
  dark: softDarkThemeTokens
} as const satisfies Record<ThemeMode, AppThemeTokens>;

function toCssVariables(theme: AppThemeTokens): Record<string, string> {
  return {
    "--app-radius": `${theme.borderRadius}px`,
    "--app-bg": theme.colorBgLayout,
    "--app-surface": theme.colorBgContainer,
    "--app-bg-muted": theme.colorBgMuted,
    "--app-bg-subtle": theme.colorBgSubtle,
    "--app-bg-elevated": theme.colorBgElevated,
    "--app-input-bg": theme.colorBgInput,
    "--app-mask": theme.colorBgMask,
    "--app-modal-surface": theme.colorBgModal,
    "--app-surface-inverse": theme.colorSurfaceInverse,
    "--app-text-on-inverse": theme.colorTextOnInverse,
    "--app-border": theme.colorBorder,
    "--app-border-strong": theme.colorBorderStrong,
    "--app-border-subtle": theme.colorBorderSubtle,
    "--app-text": theme.colorText,
    "--app-text-muted": theme.colorTextMuted,
    "--app-text-soft": theme.colorTextSoft,
    "--app-primary": theme.colorPrimary,
    "--app-primary-soft": theme.colorPrimarySoft,
    "--app-success": theme.colorSuccess,
    "--app-success-soft": theme.colorSuccessSoft,
    "--app-danger": theme.colorDanger,
    "--app-danger-soft": theme.colorDangerSoft,
    "--app-warning": theme.colorWarning,
    "--app-warning-soft": theme.colorWarningSoft,
    "--app-warning-border": theme.colorWarningBorder,
    "--app-warning-text": theme.colorWarningText,
    "--app-neutral-fill": theme.colorNeutralFill,
    "--panel-bg": theme.colorBgContainer,
    "--panel-border": theme.colorBorder,
    "--panel-radius": `${theme.borderRadius}px`,
    "--panel-shadow": theme.shadowNone,
    "--surface-shadow-sm": theme.shadowSm,
    "--layout-sider-bg": theme.layout.siderBg,
    "--layout-sider-border": theme.layout.siderBorder,
    "--layout-header-bg": theme.layout.headerBg,
    "--layout-header-border": theme.layout.headerBorder,
    "--layout-brand-bg": theme.layout.brandBg,
    "--layout-nav-hover-bg": theme.layout.navHoverBg,
    "--layout-nav-active-bg": theme.layout.navActiveBg,
    "--layout-nav-active-indicator": theme.layout.navActiveIndicator,
    "--dropdown-shadow": theme.layout.dropdownShadow
  };
}

export function applyThemeTokens(mode: ThemeMode): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.dataset.theme = mode;
  root.style.colorScheme = mode;

  const theme = themeTokensMap[mode];
  for (const [name, value] of Object.entries(toCssVariables(theme))) {
    root.style.setProperty(name, value);
  }
}
