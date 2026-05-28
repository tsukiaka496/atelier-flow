"use client";

import { appSurfaces } from "@/lib/appSurfaces";
import {
  MEMO_IMPORTANCE_HIGH,
  MEMO_IMPORTANCE_NORMAL,
} from "@/lib/memoImportance";

type ImportanceSelectProps = {
  value: number;
  onChange: (value: number) => void;
};

export default function ImportanceSelect({
  value,
  onChange,
}: ImportanceSelectProps) {
  const selected =
    value >= MEMO_IMPORTANCE_HIGH
      ? MEMO_IMPORTANCE_HIGH
      : MEMO_IMPORTANCE_NORMAL;

  return (
    <div className="mb-6">
      <p className={`mb-2 text-sm ${appSurfaces.mutedLabel}`}>
        種類
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() =>
            onChange(MEMO_IMPORTANCE_NORMAL)
          }
          className={`
            rounded-xl
            px-3
            py-3
            text-center
            text-sm
            transition-all
            ${
              selected === MEMO_IMPORTANCE_NORMAL
                ? "bg-[var(--theme-accent)] text-white"
                : "border border-zinc-200 bg-white/70 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/75 dark:text-zinc-400"
            }
          `}
        >
          普通のメモ
        </button>

        <button
          type="button"
          onClick={() =>
            onChange(MEMO_IMPORTANCE_HIGH)
          }
          className={`
            rounded-xl
            px-3
            py-3
            text-center
            text-sm
            transition-all
            ${
              selected === MEMO_IMPORTANCE_HIGH
                ? "bg-[var(--theme-accent)] text-white"
                : "border border-zinc-200 bg-white/70 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/75 dark:text-zinc-400"
            }
          `}
        >
          重要なメモ
        </button>
      </div>
    </div>
  );
}
