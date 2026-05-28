import type { ThemeSettings } from "@/lib/storage";

export type ColorMode = "light" | "dark";

export const DARK_PAGE_BACKGROUND = "#111113";
export const DARK_PAGE_BACKGROUND_WITH_IMAGE =
  "#0a0a0b";

export function normalizeColorMode(
  value: unknown
): ColorMode {
  return value === "dark" ? "dark" : "light";
}

export function applyColorModeClass(
  mode: ColorMode | undefined
) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle(
    "dark",
    mode === "dark"
  );
}

export function resolvePageBackground(
  theme: Pick<
    ThemeSettings,
    "background" | "backgroundImage" | "colorMode"
  >
): string {
  if (theme.colorMode === "dark") {
    return theme.backgroundImage
      ? DARK_PAGE_BACKGROUND_WITH_IMAGE
      : DARK_PAGE_BACKGROUND;
  }

  return theme.background;
}

export const THEME_CHANGE_EVENT =
  "atelier-theme-change";

export function notifyThemeChange(
  theme: ThemeSettings
) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(THEME_CHANGE_EVENT, {
      detail: theme,
    })
  );
}
