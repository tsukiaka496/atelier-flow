"use client";

import {
  useEffect,
  type ReactNode,
} from "react";

import {
  applyColorModeClass,
  THEME_CHANGE_EVENT,
} from "@/lib/colorMode";
import {
  getTheme,
  type ThemeSettings,
} from "@/lib/storage";

export default function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  useEffect(() => {
    applyColorModeClass(
      getTheme().colorMode
    );

    const onThemeChange = (
      event: Event
    ) => {
      const detail = (
        event as CustomEvent<ThemeSettings>
      ).detail;

      applyColorModeClass(
        detail?.colorMode
      );
    };

    window.addEventListener(
      THEME_CHANGE_EVENT,
      onThemeChange
    );

    return () => {
      window.removeEventListener(
        THEME_CHANGE_EVENT,
        onThemeChange
      );
    };
  }, []);

  return children;
}
