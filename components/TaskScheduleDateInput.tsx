"use client";

import { useState } from "react";

import { appSurfaces } from "@/lib/appSurfaces";

type TaskScheduleDateInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function TaskScheduleDateInput({
  value,
  onChange,
}: TaskScheduleDateInputProps) {
  const [wantsDate, setWantsDate] =
    useState(Boolean(value));

  const hasDate =
    Boolean(value) || wantsDate;

  return (
    <div className="min-w-0">
      <p className={`mb-2 text-xs ${appSurfaces.subtleText}`}>
        いつやる日（任意）
      </p>

      <label
        className={`
          mb-3
          flex
          cursor-pointer
          items-center
          gap-3
          rounded-2xl
          border border-zinc-200
          bg-white/70
          px-4
          py-3
          text-sm
          text-zinc-600
          dark:border-zinc-700
          dark:bg-zinc-900/75
          dark:text-zinc-300
        `}
      >
        <input
          type="checkbox"
          checked={!hasDate}
          onChange={(event) => {
            const noDate =
              event.target.checked;

            if (noDate) {
              setWantsDate(false);
              onChange("");
              return;
            }

            setWantsDate(true);
          }}
          className="accent-[var(--theme-accent)]"
        />
        日付なし
      </label>

      {hasDate && (
        <div className="relative min-w-0">
          <input
            type="date"
            value={value}
            onChange={(event) =>
              onChange(event.target.value)
            }
            aria-label="いつやる日"
            className={`
              box-border
              w-full
              min-w-0
              max-w-full
              px-4
              py-4
              ${appSurfaces.input}
              ${
                !value
                  ? "[&::-webkit-datetime-edit]:opacity-0"
                  : ""
              }
            `}
          />

          {!value && (
            <span
              className={`
                pointer-events-none
                absolute
                inset-y-0
                left-4
                flex
                items-center
                text-sm
                ${appSurfaces.subtleText}
              `}
              aria-hidden
            >
              日付を選ぶ（いつやるか）
            </span>
          )}
        </div>
      )}
    </div>
  );
}
