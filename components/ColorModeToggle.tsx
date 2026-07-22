"use client";

import type { ColorMode } from "@/lib/colorMode";

type ColorModeToggleProps = {
  value: ColorMode;
  onChange: (mode: ColorMode) => void;
};

const options: Array<{
  value: ColorMode;
  label: string;
}> = [
  { value: "light", label: "ライト" },
  { value: "dark", label: "ダーク" },
];

export default function ColorModeToggle({
  value,
  onChange,
}: ColorModeToggleProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => {
        const selected =
          value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() =>
              onChange(option.value)
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
  );
}
