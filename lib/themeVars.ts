import type { CSSProperties } from "react";

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");

  if (normalized.length !== 6) {
    return { r: 56, g: 189, b: 248 };
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

/** ThemedMain の style に渡すアクセント用 CSS 変数 */
export function getAccentCssVars(
  accent: string
): CSSProperties {
  const { r, g, b } = hexToRgb(accent);

  return {
    ["--theme-accent" as string]: accent,
    ["--theme-accent-soft" as string]: `rgba(${r}, ${g}, ${b}, 0.14)`,
    ["--theme-accent-softer" as string]: `rgba(${r}, ${g}, ${b}, 0.18)`,
    ["--theme-accent-border" as string]: `rgba(${r}, ${g}, ${b}, 0.28)`,
    ["--theme-accent-shadow" as string]: `rgba(${r}, ${g}, ${b}, 0.25)`,
    ["--theme-accent-shadow-soft" as string]: `rgba(${r}, ${g}, ${b}, 0.18)`,
  };
}
