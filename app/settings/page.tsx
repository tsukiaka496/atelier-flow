"use client";

import Link from "next/link";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  clearAllData,
  exportBackup,
  getTheme,
  importBackupFile,
  saveTheme,
} from "@/lib/storage";

import ThemedMain from "@/components/ThemedMain";
import ThemeColorPicker from "@/components/ThemeColorPicker";
import { theme } from "@/lib/themeClasses";

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

const backgroundImages = [
  "",
  "/backgrounds/bg1.jpg",
  "/backgrounds/bg2.jpg",
  "/backgrounds/bg3.jpg",
];

export default function SettingsPage() {

  const fileInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const [message, setMessage] =
    useState("");

  const [background, setBackground] =
    useState("#f7f7f5");

  const [accent, setAccent] =
    useState("#38bdf8");

  const [
    backgroundImage,
    setBackgroundImage,
  ] = useState("");

  useEffect(() => {

    const theme =
      getTheme();

    setBackground(
      theme.background
    );

    setAccent(
      theme.accent
    );

    setBackgroundImage(
      theme.backgroundImage
    );

  }, []);

  function saveCurrentTheme(
    newBackground: string,
    newAccent: string,
    newBackgroundImage: string
  ) {

    saveTheme({
      background:
        newBackground,

      accent:
        newAccent,

      backgroundImage:
        newBackgroundImage,
    });
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

  return (

    <ThemedMain
      className="px-5 py-6 pb-32"
      background={background}
      backgroundImage={backgroundImage}
      accent={accent}
    >

      <div className="mx-auto max-w-md">

        <div className="mb-6">

          <p className="text-sm text-zinc-400">
            application settings
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-wide">
            設定
          </h1>

        </div>

        {message && (

          <div
            className="mb-5 rounded-2xl px-4 py-3 text-sm text-white"
            style={{
              background:
                accent,
            }}
          >
            {message}
          </div>

        )}

        <div
          className="
            mb-6
            rounded-[30px]
            border border-white/60
            bg-white/75
            p-5
            backdrop-blur-xl
            shadow-[0_8px_30px_rgba(0,0,0,0.05)]
          "
        >

          <p className="mb-4 text-sm text-zinc-400">
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
                  accent,
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

        <ThemeColorPicker
          label="背景色"
          value={background}
          presets={backgroundColors}
          onChange={(color) => {
            setBackground(color);
            saveCurrentTheme(
              color,
              accent,
              backgroundImage
            );
          }}
        />

        <ThemeColorPicker
          label="ハイライト色"
          value={accent}
          presets={accentColors}
          onChange={(color) => {
            setAccent(color);
            saveCurrentTheme(
              background,
              color,
              backgroundImage
            );
          }}
        />

        <div
          className="
            mb-6
            rounded-[30px]
            border border-white/60
            bg-white/75
            p-5
            backdrop-blur-xl
            shadow-[0_8px_30px_rgba(0,0,0,0.05)]
          "
        >

          <p className="mb-4 text-sm text-zinc-400">
            背景画像
          </p>

          <div className="grid grid-cols-2 gap-3">

            {backgroundImages.map(
              (image, index) => (

                <button
                  key={index}
                  onClick={() => {

                    setBackgroundImage(
                      image
                    );

                    saveCurrentTheme(
                      background,
                      accent,
                      image
                    );
                  }}
                  className="
                    overflow-hidden
                    rounded-2xl
                    border border-zinc-200
                    bg-white
                  "
                >

                  {image ? (

                    <img
                      src={image}
                      alt=""
                      className="
                        h-24
                        w-full
                        object-cover
                      "
                    />

                  ) : (

                    <div
                      className="
                        flex
                        h-24
                        items-center
                        justify-center
                        text-sm
                        text-zinc-400
                      "
                    >
                      なし
                    </div>

                  )}

                </button>

              )
            )}

          </div>

        </div>

        <div
          className="
            rounded-[30px]
            border border-red-100
            bg-red-50/70
            p-5
          "
        >

          <p className="mb-2 text-sm text-red-400">
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

      <div
        className="
          fixed
          bottom-5
          left-1/2
          flex
          w-[92%]
          max-w-md
          -translate-x-1/2
          items-center
          justify-between
          rounded-[30px]
          border border-white/60
          bg-white/70
          px-6
          py-4
          backdrop-blur-xl
          shadow-[0_8px_30px_rgba(0,0,0,0.08)]
        "
      >

        <Link
          href="/"
          className="text-sm text-zinc-500"
        >
          ホーム
        </Link>

        <Link
          href="/projects"
          className="text-sm text-zinc-500"
        >
          案件
        </Link>

        <Link
          href="/month"
          className="text-sm text-zinc-500"
        >
          月
        </Link>

        <Link
          href="/settings"
          className={theme.navActive}
        >
          設定
        </Link>

      </div>

    </ThemedMain>
  );
}