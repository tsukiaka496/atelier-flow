"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { getTheme } from "@/lib/storage";
import { getAccentCssVars } from "@/lib/themeVars";

type ThemedMainProps = {
  children: ReactNode;
  /** ページごとの余白など（min-h-screen / text-zinc-800 は共通） */
  className?: string;
  /** 設定画面など、保存前のプレビュー用（省略時は localStorage のテーマ） */
  background?: string;
  backgroundImage?: string;
  accent?: string;
};

export default function ThemedMain({
  children,
  className = "",
  background: backgroundOverride,
  backgroundImage: backgroundImageOverride,
  accent: accentOverride,
}: ThemedMainProps) {
  const [theme, setTheme] = useState({
    background: "#f7f7f5",
    backgroundImage: "",
    accent: "#38bdf8",
  });

  useEffect(() => {
    const saved = getTheme();
    setTheme({
      background: saved.background,
      backgroundImage: saved.backgroundImage,
      accent: saved.accent,
    });
  }, []);

  const background =
    backgroundOverride ?? theme.background;

  const backgroundImage =
    backgroundImageOverride ?? theme.backgroundImage;

  const accent =
    accentOverride ?? theme.accent;

  return (
    <main
      className={`min-h-screen bg-cover bg-center text-zinc-800 ${className}`}
      style={{
        ...getAccentCssVars(accent),
        background,
        backgroundImage: backgroundImage
          ? `url(${backgroundImage})`
          : "none",
      }}
    >
      {children}
    </main>
  );
}
