"use client";

import type { HintMode } from "@/lib/storage";

type HintModeToggleProps = {
  value: HintMode;
  onChange: (mode: HintMode) => void;
};

const options: Array<{
  value: HintMode;
  label: string;
}> = [
  { value: "on", label: "表示" },
  { value: "off", label: "非表示" },
];

export default function HintModeToggle({
  value,
  onChange,
}: HintModeToggleProps) {
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
                    border-zinc-200
                    bg-white
                    text-zinc-600
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
