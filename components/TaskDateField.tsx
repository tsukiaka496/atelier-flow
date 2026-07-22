"use client";

type TaskDateFieldProps = {
  date: string;
  onChange: (date: string) => void;
  compact?: boolean;
};

function todayIso() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 未定 / 日付のコンパクト切替 */
export default function TaskDateField({
  date,
  onChange,
  compact = false,
}: TaskDateFieldProps) {
  const pending = !date;

  return (
    <div className={`flex flex-col gap-1 ${compact ? "" : "gap-1.5"}`}>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onChange("")}
          className={`
            flex-1
            rounded-lg
            px-1.5
            py-1
            text-[10px]
            font-medium
            transition-all
            ${
              pending
                ? "bg-[var(--theme-accent-soft)] text-[var(--theme-accent)]"
                : "bg-white/70 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            }
          `}
        >
          未定
        </button>
        <button
          type="button"
          onClick={() => {
            if (!date) {
              onChange(todayIso());
            }
          }}
          className={`
            flex-1
            rounded-lg
            px-1.5
            py-1
            text-[10px]
            font-medium
            transition-all
            ${
              !pending
                ? "bg-[var(--theme-accent-soft)] text-[var(--theme-accent)]"
                : "bg-white/70 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            }
          `}
        >
          日付
        </button>
      </div>

      {!pending ? (
        <input
          type="date"
          value={date}
          onChange={(event) => onChange(event.target.value)}
          className="
            w-full
            rounded-lg
            border border-white/80
            bg-white/80
            px-1.5
            py-1
            text-[11px]
            text-zinc-800
            outline-none
            dark:border-white/10
            dark:bg-zinc-900/70
            dark:text-zinc-100
          "
        />
      ) : null}
    </div>
  );
}
