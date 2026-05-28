"use client";

import { useState } from "react";

import { appSurfaces } from "@/lib/appSurfaces";

type DeadlineFieldProps = {
  value: string;
  onChange: (deadline: string) => void;
};

export default function DeadlineField({
  value,
  onChange,
}: DeadlineFieldProps) {
  const [wantsDate, setWantsDate] =
    useState(Boolean(value));

  const hasDeadline =
    Boolean(value) || wantsDate;

  return (
    <div className="mb-6">
      <p className={`mb-2 text-sm ${appSurfaces.mutedLabel}`}>
        納期
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
          checked={!hasDeadline}
          onChange={(event) => {
            const noDeadline =
              event.target.checked;

            if (noDeadline) {
              setWantsDate(false);
              onChange("");
              return;
            }

            setWantsDate(true);
          }}
          className="accent-[var(--theme-accent)]"
        />
        納期なし
      </label>

      {hasDeadline && (
        <input
          type="date"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className={`px-4 py-4 ${appSurfaces.input}`}
        />
      )}
    </div>
  );
}
