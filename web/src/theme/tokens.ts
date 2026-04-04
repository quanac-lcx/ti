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
  colorBorder: string;
  colorBorderStrong: string;
  colorBorderSubtle: string;
  colorText: string;
  colorTextMuted: string;
  colorTextSoft: string;
  colorPrimary: string;
  colorPrimarySoft: string;
  colorSuccess: string;
  colorDanger: string;
  shadowNone: string;
  shadowSm: string;
  layout: LayoutThemeTokens;
}

export const pragmaticThemeTokens = {
  borderRadius: 6,
  colorBgLayout: "#f8fafc",
  colorBgContainer: "#ffffff",
  colorBgMuted: "#f8fafc",
  colorBgSubtle: "#f1f5f9",
  colorBorder: "#e2e8f0",
  colorBorderStrong: "#cbd5e1",
  colorBorderSubtle: "#f1f5f9",
  colorText: "#0f172a",
  colorTextMuted: "#475569",
  colorTextSoft: "#64748b",
  colorPrimary: "#2563eb",
  colorPrimarySoft: "#eff6ff",
  colorSuccess: "#16a34a",
  colorDanger: "#dc2626",
  shadowNone: "none",
  shadowSm: "0 8px 24px #e2e8f0",
  layout: {
    siderBg: "#ffffff",
    siderBorder: "#e2e8f0",
    headerBg: "#ffffff",
    headerBorder: "#e2e8f0",
    brandBg: "#f8fafc",
    navHoverBg: "#f1f5f9",
    navActiveBg: "#eff6ff",
    navActiveIndicator: "#2563eb",
    dropdownShadow: "0 8px 24px #e2e8f0"
  }
} as const satisfies AppThemeTokens;

function toCssVariables(theme: AppThemeTokens): Record<string, string> {
  return {
    "--app-radius": `${theme.borderRadius}px`,
    "--app-bg": theme.colorBgLayout,
    "--app-surface": theme.colorBgContainer,
    "--app-bg-muted": theme.colorBgMuted,
    "--app-bg-subtle": theme.colorBgSubtle,
    "--app-border": theme.colorBorder,
    "--app-border-strong": theme.colorBorderStrong,
    "--app-border-subtle": theme.colorBorderSubtle,
    "--app-text": theme.colorText,
    "--app-text-muted": theme.colorTextMuted,
    "--app-text-soft": theme.colorTextSoft,
    "--app-primary": theme.colorPrimary,
    "--app-primary-soft": theme.colorPrimarySoft,
    "--app-success": theme.colorSuccess,
    "--app-danger": theme.colorDanger,
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

export function applyThemeTokens(theme: AppThemeTokens = pragmaticThemeTokens): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  for (const [name, value] of Object.entries(toCssVariables(theme))) {
    root.style.setProperty(name, value);
  }
}
