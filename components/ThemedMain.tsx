"use client";

import {
  type ReactNode,
} from "react";

import {
  resolvePageBackground,
} from "@/lib/colorMode";
import type { ThemeSettings } from "@/lib/storage";
import { getAccentCssVars } from "@/lib/themeVars";
import { useThemeSettings } from "@/lib/useThemeSettings";

type ThemedMainProps = {
  children: ReactNode;
  className?: string;
  background?: string;
  backgroundImage?: string;
  accent?: string;
  colorMode?: ThemeSettings["colorMode"];
};

export default function ThemedMain({
  children,
  className = "",
  background: backgroundOverride,
  backgroundImage: backgroundImageOverride,
  accent: accentOverride,
  colorMode: colorModeOverride,
}: ThemedMainProps) {
  const theme = useThemeSettings();

  const background =
    backgroundOverride ?? theme.background;

  const backgroundImage =
    backgroundImageOverride ??
    theme.backgroundImage;

  const accent =
    accentOverride ?? theme.accent;

  const colorMode =
    colorModeOverride ?? theme.colorMode;

  const pageBackground = resolvePageBackground({
    background,
    backgroundImage,
    colorMode,
  });

  return (
    <main
      className={`min-h-screen bg-cover bg-center text-zinc-800 dark:text-zinc-100 ${className}`}
      style={{
        ...getAccentCssVars(accent),
        backgroundColor: pageBackground,
        backgroundImage: backgroundImage
          ? `url(${backgroundImage})`
          : undefined,
      }}
    >
      {children}
    </main>
  );
}
