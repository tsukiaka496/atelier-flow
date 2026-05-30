export const hints = {
  "projects-add": "案件を追加",
  "project-card": "タップで詳細",
  "week-day": "日付をタップ",
  "month-calendar": "仕事・予定を確認",
} as const;

export type HintId = keyof typeof hints;
