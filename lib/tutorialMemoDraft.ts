import type { Memo } from "@/lib/storage";
import { MEMO_IMPORTANCE_NORMAL } from "@/lib/memoImportance";

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function createTutorialMemoDraft(now = new Date()): Pick<
  Memo,
  "content" | "date" | "importance"
> {
  return {
    content: "イラスト公開日",
    date: formatDate(now),
    importance: MEMO_IMPORTANCE_NORMAL,
  };
}
