"use client";

import {
  useRef,
  useSyncExternalStore,
  useState,
} from "react";

import {
  addMemoGroupRepo,
  addMemoRepo,
  deleteMemoGroupRepo,
  isUncategorizedMemo,
  saveMemosRepo,
  updateMemoGroupRepo,
} from "@/lib/memosRepo";
import { useMemoGroups, useMemos } from "@/lib/useMemos";
import { getMemoText } from "@/lib/memoDisplay";
import {
  isMemoImportant,
  MEMO_IMPORTANCE_NORMAL,
} from "@/lib/memoImportance";
import type { Memo } from "@/lib/storage";
import { appSurfaces } from "@/lib/appSurfaces";

import PageShell from "@/components/PageShell";
import MemoEditorSheet from "@/components/MemoEditorSheet";
import QuickMemoComposer from "@/components/QuickMemoComposer";

const SHOW_COMPLETED_KEY =
  "atelier-show-completed-memos";
const SORT_KEY = "atelier-memos-sort";
const SORT_DIR_KEY = "atelier-memos-sort-dir";
const PREFS_CHANGED_EVENT =
  "atelier-flow:memos-list-prefs";

type MemoSortType = "date" | "importance";
type SortDir = "asc" | "desc";
type GroupFilter = "all" | "uncategorized" | string;

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
  const savedSort = localStorage.getItem(SORT_KEY);

  if (savedSort === "date" || savedSort === "importance") {
    return savedSort;
  }

  return "date";
}

function getSortDirSnapshot(): SortDir {
  const savedDir = localStorage.getItem(SORT_DIR_KEY);

  if (savedDir === "asc" || savedDir === "desc") {
    return savedDir;
  }

  return getSortTypeSnapshot() === "importance" ? "desc" : "asc";
}

function compareMemoDates(a: Memo, b: Memo, dir: SortDir) {
  const aHasDate = Boolean(a.date);
  const bHasDate = Boolean(b.date);

  if (aHasDate && !bHasDate) {
    return -1;
  }

  if (!aHasDate && bHasDate) {
    return 1;
  }

  if (aHasDate && bHasDate && a.date !== b.date) {
    const compared = a.date.localeCompare(b.date);
    return dir === "desc" ? -compared : compared;
  }

  return (
    new Date(b.updatedAt).getTime() -
    new Date(a.updatedAt).getTime()
  );
}

function sortMemos(
  memos: Memo[],
  sortType: MemoSortType,
  sortDir: SortDir
) {
  return [...memos].sort((a, b) => {
    if (sortType === "importance") {
      if (b.importance !== a.importance) {
        return sortDir === "asc"
          ? a.importance - b.importance
          : b.importance - a.importance;
      }

      return compareMemoDates(a, b, "asc");
    }

    return compareMemoDates(a, b, sortDir);
  });
}

export default function MemosPage() {
  const memos = useMemos();
  const groups = useMemoGroups();

  const [editingMemoId, setEditingMemoId] =
    useState<string | null>(null);
  const [editContent, setEditContent] =
    useState("");
  const [editDate, setEditDate] =
    useState("");
  const [editImportance, setEditImportance] =
    useState(MEMO_IMPORTANCE_NORMAL);
  const [editGroupId, setEditGroupId] = useState("");
  const [groupFilter, setGroupFilter] =
    useState<GroupFilter>("all");
  const [newGroupName, setNewGroupName] = useState("");
  const [renamingGroupId, setRenamingGroupId] =
    useState<string | null>(null);
  const [renameGroupName, setRenameGroupName] =
    useState("");

  const [exitingMemoIds, setExitingMemoIds] =
    useState<string[]>([]);

  const exitTimersRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

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

  const sortDir = useSyncExternalStore(
    subscribeListPrefs,
    getSortDirSnapshot,
    () => "asc" as SortDir
  );

  function changeSort(type: MemoSortType) {
    localStorage.setItem(SORT_KEY, type);
    notifyListPrefsChanged();
  }

  function changeSortDir(dir: SortDir) {
    localStorage.setItem(SORT_DIR_KEY, dir);
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
    const target =
      memos.find((memo) => memo.id === memoId) ??
      null;

    if (!target) {
      return;
    }

    if (target.isCompleted) {
      const updated = memos.map((memo) => {
        if (memo.id !== memoId) {
          return memo;
        }

        return {
          ...memo,
          isCompleted: false,
          updatedAt: new Date().toISOString(),
        };
      });

      saveMemosRepo(updated);
      return;
    }

    if (!showCompleted) {
      setExitingMemoIds((current) => [
        ...current,
        memoId,
      ]);

      if (exitTimersRef.current[memoId]) {
        clearTimeout(
          exitTimersRef.current[memoId]
        );
      }

      exitTimersRef.current[memoId] =
        setTimeout(() => {
          const updated = memos.map((memo) => {
            if (memo.id !== memoId) {
              return memo;
            }

            return {
              ...memo,
              isCompleted: true,
              updatedAt: new Date().toISOString(),
            };
          });

          saveMemosRepo(updated);

          setExitingMemoIds((current) =>
            current.filter((id) => id !== memoId)
          );

          delete exitTimersRef.current[memoId];
        }, 480);

      return;
    }

    const updated = memos.map((memo) => {
      if (memo.id !== memoId) {
        return memo;
      }

      return {
        ...memo,
        isCompleted: true,
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
    setEditGroupId(
      memo.groupId &&
        groups.some((group) => group.id === memo.groupId)
        ? memo.groupId
        : ""
    );
  }

  function closeMemoEditor() {
    setEditingMemoId(null);
    setEditContent("");
    setEditDate("");
    setEditImportance(MEMO_IMPORTANCE_NORMAL);
    setEditGroupId("");
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
        groupId: editGroupId || undefined,
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
    groupId?: string;
  }) {
    const now = new Date().toISOString();

    addMemoRepo({
      id: crypto.randomUUID(),
      title: "",
      content: draft.content,
      date: draft.date,
      importance: draft.importance,
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
      groupId: draft.groupId,
    });
  }

  function addGroup() {
    const name = newGroupName.trim();

    if (!name) {
      alert("グループ名を入力してください");
      return;
    }

    const nextOrder =
      groups.reduce(
        (max, group) => Math.max(max, group.sortOrder),
        -1
      ) + 1;

    addMemoGroupRepo({
      id: crypto.randomUUID(),
      name,
      sortOrder: nextOrder,
    });
    setNewGroupName("");
  }

  function startRenameGroup(groupId: string, name: string) {
    setRenamingGroupId(groupId);
    setRenameGroupName(name);
  }

  function saveGroupName() {
    if (!renamingGroupId) {
      return;
    }

    const name = renameGroupName.trim();

    if (!name) {
      alert("グループ名を入力してください");
      return;
    }

    const target = groups.find(
      (group) => group.id === renamingGroupId
    );

    if (!target) {
      setRenamingGroupId(null);
      return;
    }

    updateMemoGroupRepo({
      ...target,
      name,
    });
    setRenamingGroupId(null);
    setRenameGroupName("");
  }

  function deleteGroup(groupId: string) {
    const confirmed = window.confirm(
      "このグループを削除しますか？\nメモは未分類に移ります。"
    );

    if (!confirmed) {
      return;
    }

    deleteMemoGroupRepo(groupId);

    if (groupFilter === groupId) {
      setGroupFilter("all");
    }

    if (renamingGroupId === groupId) {
      setRenamingGroupId(null);
      setRenameGroupName("");
    }
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
    if (
      !showCompleted &&
      memo.isCompleted &&
      !exitingMemoIds.includes(memo.id)
    ) {
      return false;
    }

    if (groupFilter === "uncategorized") {
      return isUncategorizedMemo(memo, groups);
    }

    if (
      groupFilter !== "all" &&
      groups.some((group) => group.id === groupFilter)
    ) {
      return memo.groupId === groupFilter;
    }

    return true;
  });

  const sorted = sortMemos(filtered, sortType, sortDir);
  const selectedGroup =
    groupFilter !== "all" && groupFilter !== "uncategorized"
      ? groups.find((group) => group.id === groupFilter) ?? null
      : null;

  return (
    <PageShell title="メモ">
      <div className="mx-auto max-w-md">
        <QuickMemoComposer
          groups={groups}
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
            日付順 {sortType === "date" ? (sortDir === "asc" ? "↑" : "↓") : ""}
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
            重要度順 {sortType === "importance" ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>

          <button
            type="button"
            onClick={() => changeSortDir("asc")}
            className="rounded-full px-4 py-2 text-sm transition-all"
            style={{
              background:
                sortDir === "asc"
                  ? "var(--theme-accent)"
                  : "rgba(255,255,255,0.7)",
              color: sortDir === "asc" ? "white" : "#52525b",
            }}
          >
            昇順
          </button>

          <button
            type="button"
            onClick={() => changeSortDir("desc")}
            className="rounded-full px-4 py-2 text-sm transition-all"
            style={{
              background:
                sortDir === "desc"
                  ? "var(--theme-accent)"
                  : "rgba(255,255,255,0.7)",
              color: sortDir === "desc" ? "white" : "#52525b",
            }}
          >
            降順
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

        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setGroupFilter("all")}
            className="rounded-full px-4 py-2 text-sm transition-all"
            style={{
              background:
                groupFilter === "all"
                  ? "var(--theme-accent)"
                  : "rgba(255,255,255,0.7)",
              color: groupFilter === "all" ? "white" : "#52525b",
            }}
          >
            すべて
          </button>
          <button
            type="button"
            onClick={() => setGroupFilter("uncategorized")}
            className="rounded-full px-4 py-2 text-sm transition-all"
            style={{
              background:
                groupFilter === "uncategorized"
                  ? "var(--theme-accent)"
                  : "rgba(255,255,255,0.7)",
              color:
                groupFilter === "uncategorized" ? "white" : "#52525b",
            }}
          >
            未分類
          </button>
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => setGroupFilter(group.id)}
              className="rounded-full px-4 py-2 text-sm transition-all"
              style={{
                background:
                  groupFilter === group.id
                    ? "var(--theme-accent)"
                    : "rgba(255,255,255,0.7)",
                color:
                  groupFilter === group.id ? "white" : "#52525b",
              }}
            >
              {group.name || "無題"}
            </button>
          ))}
        </div>

        <div className={`mb-5 px-3 py-3 ${appSurfaces.cardSm}`}>
          <div className="flex gap-2">
            <input
              value={newGroupName}
              onChange={(event) =>
                setNewGroupName(event.target.value)
              }
              placeholder="新しいグループ名"
              className={`min-w-0 flex-1 px-3 py-2 text-sm ${appSurfaces.input}`}
            />
            <button
              type="button"
              onClick={addGroup}
              className="shrink-0 rounded-2xl px-3 py-2 text-xs font-medium text-white"
              style={{ background: "var(--theme-accent)" }}
            >
              追加
            </button>
          </div>

          {selectedGroup && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {renamingGroupId === selectedGroup.id ? (
                <>
                  <input
                    value={renameGroupName}
                    onChange={(event) =>
                      setRenameGroupName(event.target.value)
                    }
                    className={`min-w-0 flex-1 px-3 py-2 text-sm ${appSurfaces.input}`}
                  />
                  <button
                    type="button"
                    onClick={saveGroupName}
                    className="rounded-xl bg-zinc-100 px-3 py-1 text-xs dark:bg-zinc-800"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingGroupId(null);
                      setRenameGroupName("");
                    }}
                    className="rounded-xl bg-zinc-100 px-3 py-1 text-xs dark:bg-zinc-800"
                  >
                    キャンセル
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      startRenameGroup(
                        selectedGroup.id,
                        selectedGroup.name
                      )
                    }
                    className="rounded-xl bg-zinc-100 px-3 py-1 text-xs dark:bg-zinc-800"
                  >
                    名前を変更
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteGroup(selectedGroup.id)}
                    className="rounded-xl bg-red-100 px-3 py-1 text-xs text-red-500"
                  >
                    グループ削除
                  </button>
                </>
              )}
            </div>
          )}
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

          {sorted.map((memo) => {
            const isExiting =
              exitingMemoIds.includes(memo.id);

            return (
              <div
                key={memo.id}
                className={`
                  p-5
                  ${appSurfaces.card}
                  overflow-hidden

                  ${
                    isExiting
                      ? "memo-complete-exit"
                      : ""
                  }
                `}
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

                    <p
                      className={`mt-2 text-xs ${appSurfaces.subtleText}`}
                    >
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
            );
          })}
        </div>
      </div>

      <MemoEditorSheet
        open={Boolean(editingMemoId)}
        content={editContent}
        date={editDate}
        importance={editImportance}
        groupId={editGroupId}
        groups={groups}
        onContentChange={setEditContent}
        onDateChange={setEditDate}
        onImportanceChange={setEditImportance}
        onGroupChange={setEditGroupId}
        onSave={saveMemoEdits}
        onClose={closeMemoEditor}
        onDelete={
          editingMemoId
            ? () => deleteMemo(editingMemoId)
            : undefined
        }
      />
    </PageShell>
  );
}
