"use client";

import {
  useRef,
  useState,
} from "react";

import {
  addCustomBackgroundImage,
  compressImageFileToDataUrl,
  getBackgroundImageChoices,
  MAX_CUSTOM_BACKGROUND_IMAGES,
  normalizeCustomBackgroundImages,
  removeCustomBackgroundImage,
  type BackgroundImageChoice,
} from "@/lib/themeBackgrounds";
import type { ThemeSettings } from "@/lib/storage";
import { appSurfaces } from "@/lib/appSurfaces";

type BackgroundImagePickerProps = {
  theme: ThemeSettings;
  onChange: (theme: ThemeSettings) => void;
};

export default function BackgroundImagePicker({
  theme,
  onChange,
}: BackgroundImagePickerProps) {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [error, setError] =
    useState("");

  const customImages =
    normalizeCustomBackgroundImages(
      theme.customBackgroundImages
    );

  const choices = getBackgroundImageChoices(
    customImages
  );

  const selectImage = (src: string) => {
    setError("");
    onChange({
      ...theme,
      backgroundImage: src,
    });
  };

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (
      customImages.length >=
      MAX_CUSTOM_BACKGROUND_IMAGES
    ) {
      setError(
        `追加できる画像は ${MAX_CUSTOM_BACKGROUND_IMAGES} 枚までです`
      );
      return;
    }

    try {
      setError("");
      const dataUrl =
        await compressImageFileToDataUrl(file);
      onChange(
        addCustomBackgroundImage(
          theme,
          dataUrl
        )
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "画像の追加に失敗しました"
      );
    }
  };

  const handleRemove = (
    choice: BackgroundImageChoice
  ) => {
    if (!choice.isCustom) {
      return;
    }

    onChange(
      removeCustomBackgroundImage(
        theme,
        choice.src
      )
    );
  };

  return (
    <div
      className={`mb-6 p-5 ${appSurfaces.card}`}
    >
      <p className={`mb-4 ${appSurfaces.mutedLabel}`}>
        背景画像
      </p>

      <p className={`mb-3 text-[11px] leading-4 ${appSurfaces.subtleText}`}>
        ※ プリセットの背景画像はAIで生成されています。
      </p>

      <div className="grid grid-cols-2 gap-3">
        {choices.map((choice) => {
          const selected =
            theme.backgroundImage ===
            choice.src;

          return (
            <div
              key={
                choice.isCustom
                  ? choice.src
                  : choice.src || "none"
              }
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  selectImage(choice.src)
                }
                className={`
                  w-full
                  overflow-hidden
                  rounded-2xl
                  border
                  bg-white
                  dark:bg-zinc-900
                  transition-all

                  ${
                    selected
                      ? "border-[var(--theme-accent)] ring-2 ring-[var(--theme-accent-border)]"
                      : "border-zinc-200 dark:border-zinc-700"
                  }
                `}
              >
                {choice.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={choice.src}
                    alt={choice.label}
                    className="
                      h-24
                      w-full
                      object-cover
                    "
                  />
                ) : (
                  <div
                    className={`
                      flex
                      h-24
                      items-center
                      justify-center
                      text-sm
                      ${appSurfaces.subtleText}
                    `}
                  >
                    なし
                  </div>
                )}

                <p className={`border-t border-zinc-100 px-3 py-2 text-left text-xs dark:border-zinc-800 ${appSurfaces.subtleText}`}>
                  {choice.label}
                </p>
              </button>

              {choice.isCustom && (
                <button
                  type="button"
                  aria-label={`${choice.label}を削除`}
                  onClick={() =>
                    handleRemove(choice)
                  }
                  className="
                    absolute
                    right-2
                    top-2
                    rounded-full
                    bg-black/55
                    px-2
                    py-1
                    text-[10px]
                    text-white
                  "
                >
                  削除
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />

        <button
          type="button"
          onClick={() =>
            fileInputRef.current?.click()
          }
          className="
            w-full
            rounded-2xl
            border
            border-dashed
            border-zinc-300
            bg-white/80
            px-4
            py-4
            text-sm
            text-zinc-600
            transition-all
            hover:border-[var(--theme-accent-border)]
            hover:text-[var(--theme-accent)]
            active:scale-[0.99]
            dark:border-zinc-600
            dark:bg-zinc-900/80
            dark:text-zinc-300
          "
        >
          画像を追加
        </button>

        <p className="text-xs leading-5 text-zinc-400">
          JPG / PNG など（5MB 以下）。追加した画像はこの端末に保存されます。
        </p>

        {error && (
          <p className="text-xs text-red-500">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
