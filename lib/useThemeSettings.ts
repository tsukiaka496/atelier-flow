"use client";

import { useSyncExternalStore } from "react";

import { THEME_CHANGE_EVENT } from "@/lib/colorMode";
import {
  getDefaultTheme,
  getTheme,
  type ThemeSettings,
} from "@/lib/storage";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(
    THEME_CHANGE_EVENT,
    onStoreChange
  );

  return () => {
    window.removeEventListener(
      THEME_CHANGE_EVENT,
      onStoreChange
    );
  };
}

export function useThemeSettings(): ThemeSettings {
  return useSyncExternalStore(
    subscribe,
    getTheme,
    getDefaultTheme
  );
}
