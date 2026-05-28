"use client";

import {
  useRef,
  useState,
} from "react";

import {
  clearAllData,
  exportBackup,
  importBackupFile,
  saveTheme,
  type ThemeSettings,
} from "@/lib/storage";

import ThemedMain from "@/components/ThemedMain";
import BottomNav from "@/components/BottomNav";
import BackgroundImagePicker from "@/components/BackgroundImagePicker";
import ColorModeToggle from "@/components/ColorModeToggle";
import ThemeColorPicker from "@/components/ThemeColorPicker";
import type { ColorMode } from "@/lib/colorMode";
import { appSurfaces } from "@/lib/appSurfaces";
import {
  normalizeCustomBackgroundImages,
} from "@/lib/themeBackgrounds";
import { useThemeSettings } from "@/lib/useThemeSettings";

const backgroundColors = [
  "#f7f7f5",
  "#f4f6fb",
  "#fdf6f0",
  "#f5f5ff",
  "#eef7f2",
];

const accentColors = [
  "#38bdf8",
  "#fb7185",
  "#a78bfa",
  "#34d399",
  "#f59e0b",
];

export default function SettingsPage() {
  const theme = useThemeSettings();
  const fileInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const [message, setMessage] =
    useState("");

  function saveCurrentTheme(
    updates: Partial<ThemeSettings>
  ) {
    saveTheme({
      ...theme,
      ...updates,
    });
  }

  function changeColorMode(mode: ColorMode) {
    saveCurrentTheme({ colorMode: mode });
  }

  async function handleImport(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    const confirmed =
      window.confirm(
        "バックアップを復元しますか？\n現在のデータは上書きされます。"
      );

    if (!confirmed) {
      return;
    }

    const result =
      await importBackupFile(
        file
      );

    setMessage(
      result.message
    );

    if (
      result.success
    ) {
      setTimeout(() => {
        location.reload();
      }, 1000);
    }
  }

  function handleExport() {
    exportBackup();

    setMessage(
      "バックアップを書き出しました"
    );
  }

  function handleClear() {
    const confirmed =
      window.confirm(
        "本当に全データを削除しますか？"
      );

    if (!confirmed) {
      return;
    }

    clearAllData();

    setMessage(
      "全データを削除しました"
    );

    setTimeout(() => {
      location.reload();
    }, 1000);
  }

  const customBackgroundImages =
    normalizeCustomBackgroundImages(
      theme.customBackgroundImages
    );

  return (
    <ThemedMain className="px-5 py-6 pb-32">
      <div className="mx-auto max-w-md">
        <div
          className="mb-6"
          data-tour="settings-guide"
        >
          <p className={appSurfaces.mutedLabel}>
            application settings
          </p>

          <h1 className={`mt-1 ${appSurfaces.pageTitle}`}>
            設定
          </h1>
        </div>

        {message && (
          <div
            className="mb-5 rounded-2xl px-4 py-3 text-sm text-white"
            style={{
              background:
                theme.accent,
            }}
          >
            {message}
          </div>
        )}

        <div
          className={`mb-6 p-5 ${appSurfaces.card}`}
        >
          <p className={`mb-4 ${appSurfaces.mutedLabel}`}>
            バックアップ
          </p>

          <div className="space-y-3">
            <button
              onClick={
                handleExport
              }
              className="
                w-full
                rounded-2xl
                px-4
                py-3
                text-sm
                text-white
              "
              style={{
                background:
                  theme.accent,
              }}
            >
              JSONを書き出す
            </button>

            <button
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="
                w-full
                rounded-2xl
                border border-zinc-200
                bg-white
                px-4
                py-3
                text-sm
                text-zinc-600
              "
            >
              JSONを読み込む
            </button>

            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={
                handleImport
              }
              className="hidden"
            />
          </div>
        </div>

        <div
          className={`mb-6 p-5 ${appSurfaces.card}`}
        >
          <p className={`mb-4 ${appSurfaces.mutedLabel}`}>
            表示
          </p>

          <p className={`mb-3 text-xs ${appSurfaces.subtleText}`}>
            カラーモード
          </p>

          <ColorModeToggle
            value={theme.colorMode ?? "light"}
            onChange={changeColorMode}
          />
        </div>

        <ThemeColorPicker
          key={`bg-${theme.background}`}
          label="背景色"
          value={theme.background}
          presets={backgroundColors}
          onChange={(color) => {
            saveCurrentTheme({
              background: color,
            });
          }}
        />

        <ThemeColorPicker
          key={`accent-${theme.accent}`}
          label="ハイライト色"
          value={theme.accent}
          presets={accentColors}
          onChange={(color) => {
            saveCurrentTheme({
              accent: color,
            });
          }}
        />

        <BackgroundImagePicker
          theme={{
            background: theme.background,
            accent: theme.accent,
            backgroundImage: theme.backgroundImage,
            customBackgroundImages,
          }}
          onChange={(next) => {
            saveCurrentTheme({
              backgroundImage:
                next.backgroundImage,
              customBackgroundImages:
                normalizeCustomBackgroundImages(
                  next.customBackgroundImages
                ),
            });
          }}
        />

        <div
          className="
            rounded-[30px]
            border border-red-100
            bg-red-50/70
            p-5
            dark:border-red-900/40
            dark:bg-red-950/40
          "
        >
          <p className="mb-2 text-sm text-red-400 dark:text-red-300">
            danger zone
          </p>

          <button
            onClick={
              handleClear
            }
            className="
              w-full
              rounded-2xl
              bg-red-100
              px-4
              py-3
              text-sm
              text-red-500
            "
          >
            全データ削除
          </button>
        </div>
      </div>

      <BottomNav />
    </ThemedMain>
  );
}
