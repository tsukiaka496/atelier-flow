"use client";

import {
  useSyncExternalStore,
  useState,
} from "react";

import {
  addMemoRepo,
  saveMemosRepo,
} from "@/lib/memosRepo";
import { useMemos } from "@/lib/useMemos";
import { getMemoText } from "@/lib/memoDisplay";
import {
  isMemoImportant,
  MEMO_IMPORTANCE_NORMAL,
} from "@/lib/memoImportance";
import type { Memo } from "@/lib/storage";
import { appSurfaces } from "@/lib/appSurfaces";
import { isTutorialSessionActive } from "@/lib/tutorialSession";

import ThemedMain from "@/components/ThemedMain";
import BottomNav from "@/components/BottomNav";
import MemoEditorSheet from "@/components/MemoEditorSheet";
import QuickMemoComposer from "@/components/QuickMemoComposer";

const SHOW_COMPLETED_KEY =
  "atelier-show-completed-memos";
const SORT_KEY = "atelier-memos-sort";
const PREFS_CHANGED_EVENT =
  "atelier-flow:memos-list-prefs";

type MemoSortType = "date" | "importance";

function subscribeListPrefs(onChange: () => void) {
  window.addEventListener(
    PREFS_CHANGED_EVENT,
    onChange
  );

  return () => {
    window.removeEventListener(
      PREFS_CHANGED_EVENT,
      onChange
    );
  };
}

function notifyListPrefsChanged() {
  window.dispatchEvent(
    new Event(PREFS_CHANGED_EVENT)
  );
}

function getShowCompletedSnapshot(): boolean {
  return (
    localStorage.getItem(
      SHOW_COMPLETED_KEY
    ) === "true"
  );
}

function getSortTypeSnapshot(): MemoSortType {
  const savedSort = localStorage.getItem(
    SORT_KEY
  ) as MemoSortType | null;

  return savedSort ?? "date";
}

function sortMemos(
  memos: Memo[],
  sortType: MemoSortType
) {
  return [...memos].sort((a, b) => {
    if (sortType === "importance") {
      if (b.importance !== a.importance) {
        return b.importance - a.importance;
      }
    }

    const aHasDate = Boolean(a.date);
    const bHasDate = Boolean(b.date);

    if (aHasDate && !bHasDate) {
      return -1;
    }

    if (!aHasDate && bHasDate) {
      return 1;
    }

    if (
      aHasDate &&
      bHasDate &&
      a.date !== b.date
    ) {
      return a.date.localeCompare(b.date);
    }

    return (
      new Date(b.updatedAt).getTime() -
      new Date(a.updatedAt).getTime()
    );
  });
}

export default function MemosPage() {
  const memos = useMemos();

  const [editingMemoId, setEditingMemoId] =
    useState<string | null>(null);
  const [editContent, setEditContent] =
    useState("");
  const [editDate, setEditDate] =
    useState("");
  const [editImportance, setEditImportance] =
    useState(MEMO_IMPORTANCE_NORMAL);

  const sortType = useSyncExternalStore(
    subscribeListPrefs,
    getSortTypeSnapshot,
    () => "date" as MemoSortType
  );

  const showCompleted = useSyncExternalStore(
    subscribeListPrefs,
    getShowCompletedSnapshot,
    () => false
  );

  function changeSort(type: MemoSortType) {
    localStorage.setItem(SORT_KEY, type);
    notifyListPrefsChanged();
  }

  function toggleCompletedFilter() {
    localStorage.setItem(
      SHOW_COMPLETED_KEY,
      String(!showCompleted)
    );
    notifyListPrefsChanged();
  }

  function toggleMemoComplete(memoId: string) {
    const updated = memos.map((memo) => {
      if (memo.id !== memoId) {
        return memo;
      }

      return {
        ...memo,
        isCompleted: !memo.isCompleted,
        updatedAt: new Date().toISOString(),
      };
    });

    saveMemosRepo(updated);
  }

  function openMemoEditor(memo: Memo) {
    setEditingMemoId(memo.id);
    setEditContent(memo.content);
    setEditDate(memo.date);
    setEditImportance(memo.importance);
  }

  function closeMemoEditor() {
    setEditingMemoId(null);
    setEditContent("");
    setEditDate("");
    setEditImportance(MEMO_IMPORTANCE_NORMAL);
  }

  function saveMemoEdits() {
    if (!editingMemoId) {
      return;
    }

    if (!editContent.trim()) {
      alert("内容を入力してください");
      return;
    }

    const updated = memos.map((memo) => {
      if (memo.id !== editingMemoId) {
        return memo;
      }

      return {
        ...memo,
        content: editContent.trim(),
        date: editDate,
        importance: editImportance,
        updatedAt: new Date().toISOString(),
      };
    });

    saveMemosRepo(updated);
    closeMemoEditor();
  }

  function addQuickMemo(draft: {
    content: string;
    date: string;
    importance: number;
  }) {
    const now = new Date().toISOString();
    const tutorialFlag =
      isTutorialSessionActive();

    addMemoRepo({
      id: crypto.randomUUID(),
      title: "",
      content: draft.content,
      date: draft.date,
      importance: draft.importance,
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
      isTutorial: tutorialFlag
        ? true
        : undefined,
    });
  }

  function deleteMemo(memoId: string) {
    const confirmed =
      window.confirm("このメモを削除しますか？");

    if (!confirmed) {
      return;
    }

    saveMemosRepo(
      memos.filter((memo) => memo.id !== memoId)
    );

    if (editingMemoId === memoId) {
      closeMemoEditor();
    }
  }

  const filtered = memos.filter((memo) => {
    if (!showCompleted && memo.isCompleted) {
      return false;
    }

    return true;
  });

  const sorted = sortMemos(filtered, sortType);

  return (
    <ThemedMain className="px-5 py-8 pb-32">
      <div className="mx-auto max-w-md">
        <div className="mb-6">
          <p className={appSurfaces.mutedLabel}>
            memo list
          </p>

          <h1 className={`mt-1 ${appSurfaces.pageTitle}`}>
            メモ
          </h1>
        </div>

        <QuickMemoComposer
          onAdd={addQuickMemo}
        />

        <div className="mb-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => changeSort("date")}
            className="
              rounded-full
              px-4
              py-2
              text-sm
              transition-all
            "
            style={{
              background:
                sortType === "date"
                  ? "var(--theme-accent)"
                  : "rgba(255,255,255,0.7)",
              color:
                sortType === "date"
                  ? "white"
                  : "#52525b",
            }}
          >
            日付順
          </button>

          <button
            type="button"
            onClick={() =>
              changeSort("importance")
            }
            className="
              rounded-full
              px-4
              py-2
              text-sm
              transition-all
            "
            style={{
              background:
                sortType === "importance"
                  ? "var(--theme-accent)"
                  : "rgba(255,255,255,0.7)",
              color:
                sortType === "importance"
                  ? "white"
                  : "#52525b",
            }}
          >
            重要度順
          </button>

          <button
            type="button"
            onClick={toggleCompletedFilter}
            className="
              rounded-full
              px-4
              py-2
              text-sm
              transition-all
            "
            style={{
              background: showCompleted
                ? "var(--theme-accent)"
                : "rgba(255,255,255,0.7)",
              color: showCompleted
                ? "white"
                : "#52525b",
            }}
          >
            完了済み表示
          </button>
        </div>

        <div className="space-y-4">
          {sorted.length === 0 && (
            <div
              className={`
                border border-dashed border-zinc-300
                p-8
                text-center
                text-sm
                text-zinc-400
                dark:border-zinc-600
                dark:text-zinc-500
                ${appSurfaces.cardSm}
              `}
            >
              表示できるメモがありません
            </div>
          )}

          {sorted.map((memo) => (
            <div
              key={memo.id}
              className={`p-5 ${appSurfaces.card}`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() =>
                    toggleMemoComplete(memo.id)
                  }
                  className="
                    mt-0.5
                    flex
                    h-6
                    w-6
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    border
                    text-xs
                  "
                  style={{
                    background: memo.isCompleted
                      ? "var(--theme-accent)"
                      : "transparent",
                    borderColor: memo.isCompleted
                      ? "var(--theme-accent)"
                      : "#d4d4d8",
                    color: memo.isCompleted
                      ? "white"
                      : "transparent",
                  }}
                >
                  ✓
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`whitespace-pre-wrap text-[15px] font-medium ${
                        memo.isCompleted
                          ? "text-zinc-400 line-through"
                          : ""
                      }`}
                    >
                      {getMemoText(memo)}
                    </p>

                    {isMemoImportant(
                      memo.importance
                    ) && (
                      <span
                        className="
                          shrink-0
                          rounded-full
                          bg-amber-100
                          px-2
                          py-1
                          text-[10px]
                          text-amber-700
                          dark:bg-amber-900/40
                          dark:text-amber-300
                        "
                      >
                        重要
                      </span>
                    )}
                  </div>

                  <p className={`mt-2 text-xs ${appSurfaces.subtleText}`}>
                    {memo.date
                      ? `日付: ${memo.date}`
                      : "日付なし"}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openMemoEditor(memo)
                    }
                    className="
                      rounded-xl
                      bg-zinc-100
                      px-3
                      py-1
                      text-xs
                      dark:bg-zinc-800
                    "
                  >
                    編集
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      deleteMemo(memo.id)
                    }
                    className="
                      rounded-xl
                      bg-red-100
                      px-3
                      py-1
                      text-xs
                      text-red-500
                    "
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <MemoEditorSheet
        open={Boolean(editingMemoId)}
        content={editContent}
        date={editDate}
        importance={editImportance}
        onContentChange={setEditContent}
        onDateChange={setEditDate}
        onImportanceChange={setEditImportance}
        onSave={saveMemoEdits}
        onClose={closeMemoEditor}
        onDelete={
          editingMemoId
            ? () => deleteMemo(editingMemoId)
            : undefined
        }
      />

      <BottomNav />
    </ThemedMain>
  );
}
