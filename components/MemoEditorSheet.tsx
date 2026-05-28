"use client";

import ImportanceSelect from "@/components/ImportanceSelect";
import MemoDateField from "@/components/MemoDateField";
import { theme } from "@/lib/themeClasses";

type MemoEditorSheetProps = {
  open: boolean;
  content: string;
  date: string;
  importance: number;
  onContentChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onImportanceChange: (value: number) => void;
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
};

export default function MemoEditorSheet({
  open,
  content,
  date,
  importance,
  onContentChange,
  onDateChange,
  onImportanceChange,
  onSave,
  onClose,
  onDelete,
}: MemoEditorSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="absolute bottom-0 left-0 right-0 mx-auto max-h-[90vh] w-full max-w-md overflow-y-auto px-5 pb-6">
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
            メモを編集
          </p>

          <div className="mt-4">
            <textarea
              value={content}
              onChange={(event) =>
                onContentChange(event.target.value)
              }
              placeholder="メモの内容"
              rows={4}
              className="
                box-border
                w-full
                min-w-0
                resize-none
                rounded-2xl
                border border-zinc-200
                bg-white
                px-4
                py-3
                text-sm
                outline-none
                dark:border-zinc-700
                dark:bg-zinc-900
              "
            />

            <MemoDateField
              value={date}
              onChange={onDateChange}
            />

            <ImportanceSelect
              value={importance}
              onChange={onImportanceChange}
            />
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
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
