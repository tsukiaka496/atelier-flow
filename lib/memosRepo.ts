import {
  getMemos as getPersistentMemos,
  invalidateStorageCacheFromEvent,
  saveMemos as savePersistentMemos,
  type Memo,
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
