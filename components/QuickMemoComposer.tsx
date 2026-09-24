"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { appSurfaces } from "@/lib/appSurfaces";
import {
  MEMO_IMPORTANCE_HIGH,
  MEMO_IMPORTANCE_NORMAL,
} from "@/lib/memoImportance";
import type { MemoGroup } from "@/lib/storage";
import { formatLocalDate } from "@/lib/taskPlan";
import { theme } from "@/lib/themeClasses";

type QuickMemoComposerProps = {
  groups: MemoGroup[];
  onAdd: (draft: {
    content: string;
    date: string;
    importance: number;
    groupId?: string;
  }) => void;
};

export default function QuickMemoComposer({
  groups = [],
  onAdd,
}: QuickMemoComposerProps) {
  const inputRef =
    useRef<HTMLTextAreaElement>(null);

  const [content, setContent] = useState("");
  const [noDate, setNoDate] = useState(true);
  const [date, setDate] = useState("");
  const [importance, setImportance] = useState(
    MEMO_IMPORTANCE_NORMAL
  );
  const [groupId, setGroupId] = useState("");

  useEffect(() => {
    inputRef.current?.focus({
      preventScroll: true,
    });
  }, []);

  function handleAdd() {
    const text = content.trim();

    if (!text) {
      alert("内容を入力してください");
      return;
    }

    onAdd({
      content: text,
      date: noDate ? "" : date,
      importance,
      groupId: groupId || undefined,
    });

    setContent("");
    setNoDate(true);
    setDate("");
    setImportance(MEMO_IMPORTANCE_NORMAL);
    setGroupId("");
    inputRef.current?.focus({
      preventScroll: true,
    });
  }

  const isImportant =
    importance >= MEMO_IMPORTANCE_HIGH;

  return (
    <div
      className={`mb-4 px-3 py-3 ${appSurfaces.cardSm}`}
    >
      <div className="flex items-center gap-2">
        <textarea
          ref={inputRef}
          value={content}
          onChange={(event) =>
            setContent(event.target.value)
          }
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey
            ) {
              event.preventDefault();
              handleAdd();
            }
          }}
          placeholder="パッとメモ…"
          rows={1}
          className="
            box-border
            min-h-[40px]
            min-w-0
            flex-1
            resize-none
            rounded-2xl
            border border-zinc-200
            bg-white/80
            px-3
            py-2
            text-sm
            leading-5
            outline-none
            dark:border-zinc-700
            dark:bg-zinc-900/80
          "
        />

        <button
          type="button"
          onClick={handleAdd}
          disabled={!content.trim()}
          className={`
            shrink-0
            rounded-2xl
            px-3
            py-2
            text-xs
            font-medium
            text-white
            transition-opacity
            disabled:opacity-40
            ${theme.btnSolid}
          `}
        >
          追加
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label
          className={`
            flex
            shrink-0
            cursor-pointer
            items-center
            gap-1.5
            rounded-full
            border border-zinc-200
            bg-white/70
            px-2.5
            py-1
            text-[11px]
            text-zinc-500
            dark:border-zinc-700
            dark:bg-zinc-900/75
            dark:text-zinc-400
          `}
        >
          <input
            type="checkbox"
            checked={noDate}
            onChange={(event) => {
              const checked =
                event.target.checked;
              setNoDate(checked);

              if (checked) {
                setDate("");
                return;
              }

              setDate(
                (current) =>
                  current ||
                  formatLocalDate(new Date())
              );
            }}
            className="accent-[var(--theme-accent)]"
          />
          日付なし
        </label>

        {!noDate && (
          <input
            type="date"
            value={date}
            onChange={(event) =>
              setDate(event.target.value)
            }
            className="
              h-8
              min-w-0
              flex-1
              rounded-xl
              border border-zinc-200
              bg-white/80
              px-2
              text-xs
              outline-none
              dark:border-zinc-700
              dark:bg-zinc-900/80
            "
          />
        )}

        <div
          className="
            ml-auto
            flex
            shrink-0
            rounded-xl
            border border-zinc-200
            bg-white/70
            p-0.5
            dark:border-zinc-700
            dark:bg-zinc-900/75
          "
        >
          <button
            type="button"
            onClick={() =>
              setImportance(
                MEMO_IMPORTANCE_NORMAL
              )
            }
            className={`
              rounded-lg
              px-2.5
              py-1
              text-[11px]
              transition-all
              ${
                !isImportant
                  ? "bg-[var(--theme-accent)] text-white"
                  : "text-zinc-500 dark:text-zinc-400"
              }
            `}
          >
            普通
          </button>

          <button
            type="button"
            onClick={() =>
              setImportance(
                MEMO_IMPORTANCE_HIGH
              )
            }
            className={`
              rounded-lg
              px-2.5
              py-1
              text-[11px]
              transition-all
              ${
                isImportant
                  ? "bg-[var(--theme-accent)] text-white"
                  : "text-zinc-500 dark:text-zinc-400"
              }
            `}
          >
            重要
          </button>
        </div>
      </div>

      <div className="mt-2">
        <p className={`mb-1.5 text-[11px] ${appSurfaces.mutedLabel}`}>
          グループ
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setGroupId("")}
            className="rounded-full px-3 py-1 text-[11px] transition-all"
            style={{
              background: !groupId
                ? "var(--theme-accent)"
                : "rgba(255,255,255,0.7)",
              color: !groupId ? "white" : "#52525b",
            }}
          >
            未分類
          </button>
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => setGroupId(group.id)}
              className="rounded-full px-3 py-1 text-[11px] transition-all"
              style={{
                background:
                  groupId === group.id
                    ? "var(--theme-accent)"
                    : "rgba(255,255,255,0.7)",
                color:
                  groupId === group.id ? "white" : "#52525b",
              }}
            >
              {group.name || "無題"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
