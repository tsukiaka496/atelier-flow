"use client";

import type { ButtonHTMLAttributes } from "react";

import { theme } from "@/lib/themeClasses";

type TaskEditorSheetProps = {
  open: boolean;
  title: string;
  onTitleChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
  saveButtonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
};

export default function TaskEditorSheet({
  open,
  title,
  onTitleChange,
  onSave,
  onClose,
  onDelete,
  saveButtonProps,
}: TaskEditorSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md px-5 pb-6">
        <div
          className="
            rounded-[28px]
            border border-white/60 dark:border-zinc-700/50
            bg-white/95
            p-5
            shadow-[0_12px_40px_rgba(0,0,0,0.18)]
            backdrop-blur-xl
            dark:bg-zinc-900/95
          "
        >
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            作業を編集
          </p>

          <div className="mt-4 space-y-3">
            <input
              value={title}
              onChange={(event) =>
                onTitleChange(event.target.value)
              }
              placeholder="例: ラフ提出"
              className="
                box-border
                w-full
                min-w-0
                rounded-2xl
                border border-zinc-200 dark:border-zinc-700
                bg-white dark:bg-zinc-900
                px-4
                py-3
                text-sm
                outline-none
              "
            />
          </div>

          <div className="mt-5 flex items-center justify-between gap-2">
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="
                  rounded-xl
                  bg-red-50
                  px-3
                  py-2
                  text-xs
                  text-red-500
                "
              >
                削除
              </button>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="
                  rounded-xl
                  bg-zinc-100
                  px-3
                  py-2
                  text-xs
                  text-zinc-500
                  dark:bg-zinc-800
                  dark:text-zinc-300
                "
              >
                キャンセル
              </button>

              <button
                type="button"
                onClick={onSave}
                {...saveButtonProps}
                className={`rounded-xl px-4 py-2 text-xs text-white ${theme.btnSolid}`}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
