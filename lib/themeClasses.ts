/**
 * UIテーマ用クラス（ThemedMain 内でのみ使用）
 *
 * 色のルール:
 * - ナビ・ボタン・カレンダー枠 → このファイルの theme.* または var(--theme-accent)
 * - 案件・タスクの識別色 → project.color のみ（style で適用）
 * - theme の accent を案件色に使わない / project.color を UI アクセントに使わない
 */
export const theme = {
  text: "text-[var(--theme-accent)]",
  textXs: "text-xs text-[var(--theme-accent)]",
  text10: "text-[10px] text-[var(--theme-accent)]",
  text10Medium:
    "text-[10px] font-medium text-[var(--theme-accent)]",
  bgSoft: "bg-[var(--theme-accent-soft)]",
  bgSofter: "bg-[var(--theme-accent-softer)]",
  border: "border-[var(--theme-accent-border)]",
  borderAccent: "border-[var(--theme-accent)]",
  dot: "bg-[var(--theme-accent)]",
  ring: "ring-2 ring-[var(--theme-accent-border)]",
  shadow: "shadow-[0_4px_20px_var(--theme-accent-shadow)]",
  shadowSoft:
    "shadow-[0_4px_20px_var(--theme-accent-shadow-soft)]",
  navActive: "text-sm text-[var(--theme-accent)]",
  btnSolid:
    "rounded-2xl bg-[var(--theme-accent)] text-sm text-white",
};
