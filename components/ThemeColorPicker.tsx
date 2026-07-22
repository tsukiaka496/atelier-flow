"use client";

import {
  useState,
} from "react";

import {
  hexToRgb,
  normalizeHex,
  parseColorInput,
  rgbToHex,
} from "@/lib/colorFormat";
import { appSurfaces } from "@/lib/appSurfaces";

type ThemeColorPickerProps = {
  label: string;
  value: string;
  presets: string[];
  onChange: (hex: string) => void;
};

const inputClass = `${appSurfaces.input} px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200`;

export default function ThemeColorPicker({
  label,
  value,
  presets,
  onChange,
}: ThemeColorPickerProps) {
  const normalizedValue =
    normalizeHex(value) ??
    presets[0] ??
    value;

  const rgbPreview = hexToRgb(
    normalizedValue
  );

  const [hexInput, setHexInput] =
    useState(normalizedValue);

  const [r, setR] = useState(0);
  const [g, setG] = useState(0);
  const [b, setB] = useState(0);

  const [hexError, setHexError] =
    useState("");

  const [customOpen, setCustomOpen] =
    useState(false);

  function applyColor(hex: string) {
    onChange(hex);
    setHexError("");
  }

  function applyFromHexField() {
    const parsed = parseColorInput(
      hexInput
    );

    if (!parsed) {
      setHexError(
        "#RRGGBB または rgb(255,128,0) 形式で入力してください"
      );
      return;
    }

    applyColor(parsed);
  }

  function applyFromRgb() {
    const parsed = rgbToHex(r, g, b);

    if (!parsed) {
      setHexError(
        "RGB は 0〜255 の数値で入力してください"
      );
      return;
    }

    applyColor(parsed);
  }

  return (
    <div
      className={`mb-6 p-5 ${appSurfaces.card}`}
    >
      <p className={`mb-4 ${appSurfaces.mutedLabel}`}>
        {label}
      </p>

      <div
        className="
          rounded-2xl
          border border-white/75
          bg-white/40
          p-3.5
          shadow-[0_1px_0_rgba(255,255,255,0.85)_inset,0_8px_24px_rgba(249,168,212,0.12)]
          backdrop-blur-xl
          dark:border-white/10
          dark:bg-zinc-800/40
        "
      >
        <div className="flex flex-wrap gap-3">
          {presets.map((color) => {
            const selected =
              normalizedValue === color;

            return (
              <button
                key={color}
                type="button"
                onClick={() =>
                  applyColor(color)
                }
                className={`
                  h-12
                  w-12
                  rounded-full
                  border-2
                  transition-all
                  duration-200
                  ${
                    selected
                      ? `
                        scale-110
                        border-white
                        shadow-[0_0_0_3px_#f9a8d4,0_6px_16px_rgba(249,168,212,0.45)]
                        dark:border-zinc-200
                        dark:shadow-[0_0_0_3px_rgba(249,168,212,0.55),0_4px_14px_rgba(0,0,0,0.35)]
                      `
                      : `
                        border-white
                        shadow-[0_3px_10px_rgba(251,146,160,0.22)]
                        dark:border-zinc-600
                        dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]
                      `
                  }
                `}
                style={{
                  background: color,
                }}
                aria-label={`プリセット ${color}`}
                aria-pressed={selected}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-5 border-t border-rose-100 pt-3 dark:border-zinc-700">
        <button
          type="button"
          onClick={() =>
            setCustomOpen(
              (open) => !open
            )
          }
          aria-expanded={customOpen}
          className="
            flex
            w-full
            items-center
            justify-between
            gap-3
            rounded-2xl
            border border-white/75
            bg-white/45
            px-3
            py-2.5
            text-left
            shadow-[0_1px_0_rgba(255,255,255,0.8)_inset]
            backdrop-blur-md
            transition-colors
            dark:border-white/10
            dark:bg-zinc-800/45
          "
        >
          <span className="flex items-center gap-3">
            <span
              className="
                h-8
                w-8
                shrink-0
                rounded-xl
                border-2 border-white
                shadow-[0_0_0_2px_#fbcfe8,0_2px_6px_rgba(249,168,212,0.25)]
                dark:border-zinc-500
              "
              style={{
                background:
                  normalizedValue,
              }}
            />
            <span>
              <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                カスタム色
              </span>
              <span className="block text-[11px] text-zinc-600 dark:text-zinc-400">
                {normalizedValue}
              </span>
            </span>
          </span>
          <span
            className={`
              text-xs
              text-zinc-500
              transition-transform
              dark:text-zinc-400
              ${customOpen ? "rotate-180" : ""}
            `}
          >
            ▼
          </span>
        </button>

        {customOpen && (
          <div className="mt-3 space-y-3 border-t border-rose-100 pt-4 dark:border-zinc-700">

        <div className="mb-1 flex items-center gap-3">
          <label
            className="
              relative
              h-12
              w-12
              shrink-0
              cursor-pointer
              overflow-hidden
              rounded-2xl
              border-2 border-white
              shadow-[0_0_0_2px_#fbcfe8,0_2px_6px_rgba(249,168,212,0.25)]
              dark:border-zinc-500
            "
          >
            <input
              type="color"
              value={normalizedValue}
              onChange={(e) =>
                applyColor(
                  e.target.value
                )
              }
              className="
                absolute
                inset-0
                h-full
                w-full
                cursor-pointer
                opacity-0
              "
            />
            <span
              className="
                block
                h-full
                w-full
              "
              style={{
                background:
                  normalizedValue,
              }}
            />
          </label>

          <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            タップでカラーパレットから選べます
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-400">
              カラーコード
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={hexInput}
                onChange={(e) =>
                  setHexInput(
                    e.target.value
                  )
                }
                onBlur={
                  applyFromHexField
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter"
                  ) {
                    applyFromHexField();
                  }
                }}
                placeholder="#f0b89a"
                className={inputClass}
              />
              <button
                type="button"
                onClick={
                  applyFromHexField
                }
                className="
                  shrink-0
                  rounded-2xl
                  border border-white/80
                  bg-white/60
                  px-4
                  text-sm
                  font-medium
                  text-zinc-700
                  backdrop-blur-md
                  dark:border-zinc-600
                  dark:bg-zinc-800
                  dark:text-zinc-200
                "
              >
                適用
              </button>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-400">
              RGB（0〜255）
            </p>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                min={0}
                max={255}
                value={r}
                onChange={(e) =>
                  setR(
                    Number(
                      e.target.value
                    )
                  )
                }
                placeholder="R"
                className={inputClass}
              />
              <input
                type="number"
                min={0}
                max={255}
                value={g}
                onChange={(e) =>
                  setG(
                    Number(
                      e.target.value
                    )
                  )
                }
                placeholder="G"
                className={inputClass}
              />
              <input
                type="number"
                min={0}
                max={255}
                value={b}
                onChange={(e) =>
                  setB(
                    Number(
                      e.target.value
                    )
                  )
                }
                placeholder="B"
                className={inputClass}
              />
            </div>
            <button
              type="button"
              onClick={applyFromRgb}
              className="
                mt-2
                w-full
                rounded-2xl
                border border-white/80
                bg-white/60
                px-4
                py-3
                text-sm
                font-medium
                text-zinc-700
                backdrop-blur-md
                dark:border-zinc-600
                dark:bg-zinc-800
                dark:text-zinc-200
              "
            >
              RGBを適用
            </button>
          </div>

          {hexError && (
            <p className="text-xs text-rose-500">
              {hexError}
            </p>
          )}

          <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
            現在: {normalizedValue}
            {rgbPreview && (
              <>
                {" "}
                / rgb({rgbPreview.r}, {rgbPreview.g},{" "}
                {rgbPreview.b})
              </>
            )}
          </p>
        </div>

          </div>
        )}
      </div>
    </div>
  );
}
