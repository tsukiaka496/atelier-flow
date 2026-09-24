import {
  getMemoGroups as getPersistentMemoGroups,
  getMemos as getPersistentMemos,
  invalidateStorageCacheFromEvent,
  saveMemoGroups as savePersistentMemoGroups,
  saveMemos as savePersistentMemos,
  type Memo,
  type MemoGroup,
} from "@/lib/storage";

const MEMOS_CHANGED_EVENT = "atelier-flow:memos-changed";

function emitMemosChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MEMOS_CHANGED_EVENT));
}

export function notifyMemosChanged() {
  emitMemosChanged();
}

export function subscribeMemosChanged(
  onChange: () => void
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    invalidateStorageCacheFromEvent(event.key);
    onChange();
  };

  window.addEventListener(MEMOS_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(
      MEMOS_CHANGED_EVENT,
      onChange
    );
    window.removeEventListener(
      "storage",
      onStorage
    );
  };
}

export function getMemosRepo(): Memo[] {
  return getPersistentMemos();
}

export function saveMemosRepo(memos: Memo[]) {
  savePersistentMemos(memos);
  emitMemosChanged();
}

export function addMemoRepo(memo: Memo) {
  const memos = [...getPersistentMemos()];
  memos.unshift(memo);
  savePersistentMemos(memos);
  emitMemosChanged();
}

export function updateMemoRepo(updated: Memo) {
  const memos = getPersistentMemos().map((memo) =>
    memo.id === updated.id ? updated : memo
  );
  savePersistentMemos(memos);
  emitMemosChanged();
}

const MEMO_GROUPS_CHANGED_EVENT =
  "atelier-flow:memo-groups-changed";

function emitMemoGroupsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new Event(MEMO_GROUPS_CHANGED_EVENT)
  );
}

export function subscribeMemoGroupsChanged(
  onChange: () => void
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    invalidateStorageCacheFromEvent(event.key);
    onChange();
  };

  window.addEventListener(
    MEMO_GROUPS_CHANGED_EVENT,
    onChange
  );
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(
      MEMO_GROUPS_CHANGED_EVENT,
      onChange
    );
    window.removeEventListener(
      "storage",
      onStorage
    );
  };
}

export function getMemoGroupsRepo(): MemoGroup[] {
  return getPersistentMemoGroups();
}

export function saveMemoGroupsRepo(
  groups: MemoGroup[]
) {
  savePersistentMemoGroups(groups);
  emitMemoGroupsChanged();
}

export function addMemoGroupRepo(group: MemoGroup) {
  const groups = [...getPersistentMemoGroups(), group];
  savePersistentMemoGroups(groups);
  emitMemoGroupsChanged();
}

export function updateMemoGroupRepo(updated: MemoGroup) {
  const groups = getPersistentMemoGroups().map((group) =>
    group.id === updated.id ? updated : group
  );
  savePersistentMemoGroups(groups);
  emitMemoGroupsChanged();
}

export function deleteMemoGroupRepo(groupId: string) {
  savePersistentMemoGroups(
    getPersistentMemoGroups().filter(
      (group) => group.id !== groupId
    )
  );
  emitMemoGroupsChanged();

  const memos = getPersistentMemos();
  let changed = false;
  const nextMemos = memos.map((memo) => {
    if (memo.groupId !== groupId) {
      return memo;
    }

    changed = true;
    return {
      ...memo,
      groupId: undefined,
    };
  });

  if (changed) {
    savePersistentMemos(nextMemos);
    emitMemosChanged();
  }
}

export function isUncategorizedMemo(
  memo: Memo,
  groups: MemoGroup[]
): boolean {
  if (!memo.groupId) {
    return true;
  }

  return !groups.some((group) => group.id === memo.groupId);
}
