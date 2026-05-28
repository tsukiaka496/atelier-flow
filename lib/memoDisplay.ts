import type { Memo } from "@/lib/storage";

export function getMemoText(memo: Memo): string {
  const content = memo.content.trim();
  const title = memo.title.trim();

  if (content) {
    return content;
  }

  if (title) {
    return title;
  }

  return "無題";
}
