"use client";

import { appSurfaces } from "@/lib/appSurfaces";

type TaskScheduleDateInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function TaskScheduleDateInput({
  value,
  onChange,
}: TaskScheduleDateInputProps) {
  return (
    <div>
      <p className={`mb-2 text-xs ${appSurfaces.subtleText}`}>
        いつやる日（任意）
      </p>

      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          aria-label="いつやる日"
          className={`
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
    </div>
  );
}
