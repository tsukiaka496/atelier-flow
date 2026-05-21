"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  hexToRgb,
  normalizeHex,
  parseColorInput,
  rgbToHex,
} from "@/lib/colorFormat";

type ThemeColorPickerProps = {
  label: string;
  value: string;
  presets: string[];
  onChange: (hex: string) => void;
};

const inputClass = `
  w-full
  rounded-2xl
  border border-zinc-200
  bg-white
  px-4
  py-3
  text-sm
  text-zinc-700
  outline-none
`;

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

  useEffect(() => {
    const hex =
      normalizeHex(value) ?? value;

    setHexInput(hex);

    const rgb = hexToRgb(hex);

    if (rgb) {
      setR(rgb.r);
      setG(rgb.g);
      setB(rgb.b);
    }

    setHexError("");
  }, [value]);

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
        {label}
      </p>

      <div className="flex flex-wrap gap-3">
        {presets.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() =>
              applyColor(color)
            }
            className={`
              h-10
              w-10
              rounded-full
              border-2
              shadow-md
              transition-transform
              ${
                normalizedValue === color
                  ? "scale-110 border-zinc-400"
                  : "border-white"
              }
            `}
            style={{
              background: color,
            }}
            aria-label={`プリセット ${color}`}
          />
        ))}
      </div>

      <div className="mt-5 border-t border-zinc-100 pt-3">
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
            px-1
            py-2
            text-left
            transition-colors
          "
        >
          <span className="flex items-center gap-3">
            <span
              className="
                h-8
                w-8
                shrink-0
                rounded-xl
                border border-zinc-200
                shadow-sm
              "
              style={{
                background:
                  normalizedValue,
              }}
            />
            <span>
              <span className="block text-xs text-zinc-400">
                カスタム色
              </span>
              <span className="block text-[11px] text-zinc-500">
                {normalizedValue}
              </span>
            </span>
          </span>
          <span
            className={`
              text-xs
              text-zinc-400
              transition-transform
              ${customOpen ? "rotate-180" : ""}
            `}
          >
            ▼
          </span>
        </button>

        {customOpen && (
          <div className="mt-3 space-y-3 border-t border-zinc-100 pt-4">

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
              border border-zinc-200
              shadow-sm
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

          <p className="text-xs leading-relaxed text-zinc-500">
            タップでカラーパレットから選べます
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs text-zinc-400">
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
                placeholder="#f7f7f5"
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
                  border border-zinc-200
                  bg-white
                  px-4
                  text-sm
                  text-zinc-600
                "
              >
                適用
              </button>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs text-zinc-400">
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
                border border-zinc-200
                bg-white
                px-4
                py-3
                text-sm
                text-zinc-600
              "
            >
              RGBを適用
            </button>
          </div>

          {hexError && (
            <p className="text-xs text-red-400">
              {hexError}
            </p>
          )}

          <p className="text-[11px] text-zinc-400">
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
