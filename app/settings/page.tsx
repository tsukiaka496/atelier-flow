"use client";

import {
  useRef,
  useState,
} from "react";

import BackgroundImagePicker from "@/components/BackgroundImagePicker";
import ColorModeToggle from "@/components/ColorModeToggle";
import PageShell from "@/components/PageShell";
import ThemeColorPicker from "@/components/ThemeColorPicker";
import { appSurfaces } from "@/lib/appSurfaces";
import type { ColorMode } from "@/lib/colorMode";
import {
  clearAllData,
  exportBackup,
  importBackupFile,
  saveTheme,
  type ThemeSettings,
} from "@/lib/storage";
import {
  normalizeCustomBackgroundImages,
} from "@/lib/themeBackgrounds";
import { useThemeSettings } from "@/lib/useThemeSettings";

const backgroundColors = [
  "#e8a8b6",
  "#f0b89a",
  "#c9a6de",
  "#8fd4b5",
  "#e8c86a",
];

const accentColors = [
  "#f9a8d4",
  "#fdba74",
  "#c4b5fd",
  "#86efac",
  "#fde047",
];

type MonthDisplayMode = "detailed" | "simple";

export default function SettingsPage() {
  const theme = useThemeSettings();
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState("");

  const monthDisplayMode: MonthDisplayMode =
    theme.monthDisplayMode ?? "detailed";

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

  function changeMonthDisplayMode(
    mode: MonthDisplayMode
  ) {
    saveCurrentTheme({
      monthDisplayMode: mode,
    });
  }

  async function handleImport(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const confirmed = window.confirm(
      "バックアップを復元しますか？\n現在のデータは上書きされます。"
    );

    if (!confirmed) {
      return;
    }

    const result = await importBackupFile(file);

    setMessage(result.message);

    if (result.success) {
      setTimeout(() => {
        location.reload();
      }, 1000);
    }
  }

  function handleExport() {
    exportBackup();
    setMessage("バックアップを書き出しました");
  }

  function handleClear() {
    const confirmed = window.confirm(
      "本当に全データを削除しますか？"
    );

    if (!confirmed) {
      return;
    }

    clearAllData();
    setMessage("全データを削除しました");

    setTimeout(() => {
      location.reload();
    }, 1000);
  }

  const customBackgroundImages =
    normalizeCustomBackgroundImages(
      theme.customBackgroundImages
    );

  return (
    <PageShell title="設定">
      <div className="mx-auto max-w-md">
        {message ? (
          <div
            className="mb-5 rounded-2xl px-4 py-3 text-sm text-white"
            style={{
              background: theme.accent,
            }}
          >
            {message}
          </div>
        ) : null}

        <div className={`mb-6 p-5 ${appSurfaces.card}`}>
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

          <p className={`mb-3 mt-5 text-xs ${appSurfaces.subtleText}`}>
            月表示モード
          </p>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                {
                  value: "detailed" as const,
                  label: "詳細モード",
                },
                {
                  value: "simple" as const,
                  label: "簡易モード",
                },
              ]
            ).map((option) => {
              const selected =
                monthDisplayMode ===
                option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    changeMonthDisplayMode(
                      option.value
                    )
                  }
                  className={`
                    rounded-2xl
                    border
                    px-4
                    py-3
                    text-sm
                    font-medium
                    transition-all
                    active:scale-[0.99]
                    ${
                      selected
                        ? `
                          border-[var(--theme-accent-border)]
                          bg-[var(--theme-accent-soft)]
                          text-[var(--theme-accent)]
                        `
                        : `
                          border-zinc-300
                          bg-zinc-50
                          text-zinc-700
                          dark:border-zinc-700
                          dark:bg-zinc-900
                          dark:text-zinc-300
                        `
                    }
                  `}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <p
            className={`mt-2 text-[10px] leading-snug ${appSurfaces.subtleText}`}
          >
            詳細は名前・時間を表示。簡易は仕事の有無だけを切り替えます
          </p>
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
            backgroundImage:
              theme.backgroundImage,
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

        <div className={`mb-6 p-5 ${appSurfaces.card}`}>
          <p className={`mb-4 ${appSurfaces.mutedLabel}`}>
            バックアップ
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleExport}
              className="
                w-full
                rounded-2xl
                px-4
                py-3
                text-sm
                text-white
              "
              style={{
                background: theme.accent,
              }}
            >
              JSONを書き出す
            </button>

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="
                w-full
                rounded-2xl
                border border-zinc-300
                bg-zinc-50
                px-4
                py-3
                text-sm
                font-medium
                text-zinc-700
                dark:border-zinc-700
                dark:bg-zinc-900
                dark:text-zinc-300
              "
            >
              JSONを読み込む
            </button>

            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </div>

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
            危険な操作
          </p>

          <button
            type="button"
            onClick={handleClear}
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
    </PageShell>
  );
}
