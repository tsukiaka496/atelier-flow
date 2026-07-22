"use client";

import type { ReactNode } from "react";

import { appSurfaces } from "@/lib/appSurfaces";
import TaskDateField from "@/components/TaskDateField";

type TaskWorkScheduleRowProps = {
  title: string;
  completed?: boolean;
  accentColor?: string;
  date: string;
  onDateChange: (date: string) => void;
  onMoveTask: (direction: -1 | 1) => void;
  onMoveSchedule: (direction: -1 | 1) => void;
  onToggleComplete?: () => void;
  onEditTask?: () => void;
  onDeleteTask?: () => void;
  showComplete?: boolean;
};

function EndArrowRail({
  label,
  onUp,
  onDown,
}: {
  label: string;
  onUp: () => void;
  onDown: () => void;
}) {
  return (
    <div
      className="
        flex
        w-11
        shrink-0
        flex-col
        items-center
        justify-center
        gap-0.5
        self-stretch
        rounded-xl
        bg-white/50
        px-0.5
        py-1
        dark:bg-zinc-800/50
      "
    >
      <button
        type="button"
        onClick={onUp}
        aria-label={`${label}を上へ`}
        className="
          flex
          h-7
          w-7
          items-center
          justify-center
          rounded-lg
          text-sm
          font-semibold
          text-zinc-600
          transition
          hover:bg-[var(--theme-accent-soft)]
          hover:text-[var(--theme-accent)]
          dark:text-zinc-300
        "
      >
        ↑
      </button>
      <span className="text-[9px] font-medium leading-none text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <button
        type="button"
        onClick={onDown}
        aria-label={`${label}を下へ`}
        className="
          flex
          h-7
          w-7
          items-center
          justify-center
          rounded-lg
          text-sm
          font-semibold
          text-zinc-600
          transition
          hover:bg-[var(--theme-accent-soft)]
          hover:text-[var(--theme-accent)]
          dark:text-zinc-300
        "
      >
        ↓
      </button>
    </div>
  );
}

/** 作業＋日付を1ボックスに。左右端の矢印でそれぞれ並べ替え */
export default function TaskWorkScheduleRow({
  title,
  completed = false,
  accentColor,
  date,
  onDateChange,
  onMoveTask,
  onMoveSchedule,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  showComplete = false,
}: TaskWorkScheduleRowProps) {
  const taskActions: ReactNode = (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {onEditTask ? (
        <button
          type="button"
          onClick={onEditTask}
          className="rounded-md bg-white/80 px-2 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
        >
          編集
        </button>
      ) : null}
      {onDeleteTask ? (
        <button
          type="button"
          onClick={onDeleteTask}
          className="rounded-md bg-red-100 px-2 py-0.5 text-[10px] text-red-500"
        >
          削除
        </button>
      ) : null}
    </div>
  );

  return (
    <div
      className={`
        flex
        items-stretch
        gap-1.5
        p-2
        ${appSurfaces.cardSm}
      `}
      style={{
        borderColor:
          completed && accentColor
            ? `${accentColor}50`
            : undefined,
        background:
          completed && accentColor
            ? `${accentColor}12`
            : undefined,
      }}
    >
      <EndArrowRail
        label="作業"
        onUp={() => onMoveTask(-1)}
        onDown={() => onMoveTask(1)}
      />

      <div className="flex min-w-0 flex-1 items-stretch gap-1.5">
        <div
          className={`
            flex
            min-w-0
            flex-[1.35]
            flex-col
            justify-center
            rounded-xl
            border border-dashed border-zinc-300/80
            bg-white/35
            px-2.5
            py-2
            dark:border-zinc-600
            dark:bg-zinc-900/30
          `}
        >
          <p className="text-[9px] font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
            作業
          </p>
          <button
            type="button"
            onClick={onToggleComplete}
            disabled={!showComplete || !onToggleComplete}
            className={`
              mt-0.5
              w-full
              text-left
              text-base
              font-semibold
              leading-snug
              text-zinc-800
              dark:text-zinc-100
              ${showComplete ? "cursor-pointer" : "cursor-default"}
            `}
            style={{
              color:
                completed && accentColor
                  ? accentColor
                  : undefined,
            }}
          >
            {title}
          </button>
          {showComplete ? (
            <p className="mt-0.5 text-[9px] text-zinc-500">
              タップで完了切替
            </p>
          ) : null}
          {taskActions}
        </div>

        <div
          className="
            w-px
            shrink-0
            self-stretch
            bg-gradient-to-b
            from-transparent
            via-zinc-300
            to-transparent
            dark:via-zinc-600
          "
          aria-hidden
        />

        <div
          className="
            flex
            min-w-0
            flex-1
            flex-col
            justify-center
            rounded-xl
            border border-dashed border-zinc-300/80
            bg-white/35
            px-2
            py-1.5
            dark:border-zinc-600
            dark:bg-zinc-900/30
          "
        >
          <p className="mb-1 text-[9px] font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
            日付（別操作）
          </p>
          <TaskDateField
            date={date}
            onChange={onDateChange}
            compact
          />
        </div>
      </div>

      <EndArrowRail
        label="日付"
        onUp={() => onMoveSchedule(-1)}
        onDown={() => onMoveSchedule(1)}
      />
    </div>
  );
}
