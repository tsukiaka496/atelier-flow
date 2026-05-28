"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { createTutorialMemoDraft } from "@/lib/tutorialMemoDraft";
import {
  registerTutorialAction,
  registerTutorialHook,
} from "@/lib/tutorialActionRegistry";
import { useTourAction } from "@/lib/useTourAction";
import {
  tourInstanceProps,
  useTourInstanceId,
} from "@/lib/useTourInstanceId";
import { appSurfaces } from "@/lib/appSurfaces";
import {
  MEMO_IMPORTANCE_HIGH,
  MEMO_IMPORTANCE_NORMAL,
} from "@/lib/memoImportance";
import { theme } from "@/lib/themeClasses";

import { useOnboarding } from "@/components/onboarding/OnboardingProvider";

type QuickMemoComposerProps = {
  onAdd: (draft: {
    content: string;
    date: string;
    importance: number;
  }) => void;
};

function formatToday() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(
    2,
    "0"
  );
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function QuickMemoComposer({
  onAdd,
}: QuickMemoComposerProps) {
  const { bumpTutorialReady } = useOnboarding();
  const inputRef =
    useRef<HTMLTextAreaElement>(null);
  const addInstance = useTourInstanceId(
    "memo-quick-add"
  );

  const [content, setContent] =
    useState("");
  const [noDate, setNoDate] =
    useState(true);
  const [date, setDate] = useState("");
  const [importance, setImportance] =
    useState(MEMO_IMPORTANCE_NORMAL);

  useEffect(() => {
    inputRef.current?.focus({
      preventScroll: true,
    });
  }, []);

  const applyTutorialExample =
    useCallback(() => {
      const draft =
        createTutorialMemoDraft(new Date());
      setContent(draft.content);
      setNoDate(false);
      setDate(draft.date);
      setImportance(draft.importance);
      requestAnimationFrame(() => {
        bumpTutorialReady();
      });
    }, [bumpTutorialReady]);

  useEffect(() => {
    return registerTutorialHook(
      "memo-form-prepare",
      applyTutorialExample
    );
  }, [applyTutorialExample]);

  useEffect(() => {
    bumpTutorialReady();
  }, [
    content,
    date,
    importance,
    noDate,
    bumpTutorialReady,
  ]);

  const submitAction = useCallback(() => {
    const text = content.trim();

    if (!text) {
      alert("内容を入力してください");
      return;
    }

    onAdd({
      content: text,
      date: noDate ? "" : date,
      importance,
    });

    setContent("");
    setNoDate(true);
    setDate("");
    setImportance(MEMO_IMPORTANCE_NORMAL);
    inputRef.current?.focus({
      preventScroll: true,
    });
  }, [content, date, importance, noDate, onAdd]);

  const handleAdd = useTourAction(
    "memo-quick-add",
    submitAction
  );

  useEffect(() => {
    return registerTutorialAction(
      "memo-quick-add",
      submitAction
    );
  }, [submitAction]);

  const isImportant =
    importance >= MEMO_IMPORTANCE_HIGH;

  return (
    <div
      data-tour="memo-quick-compose"
      className={`mb-4 px-3 py-3 ${appSurfaces.cardSm}`}
    >
      <div className="flex items-center gap-2">
        <textarea
          ref={inputRef}
          data-tour="memo-quick-input"
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
          {...tourInstanceProps(
            "memo-quick-add",
            addInstance
          )}
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

              setDate((current) =>
                current || formatToday()
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
    </div>
  );
}
