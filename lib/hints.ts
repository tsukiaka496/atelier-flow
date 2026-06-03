export const hints = {
  "home-date": "日付で移動",
  "home-work": "この日の作業",
  "week-day": "日をタップ",
  "month-calendar": "仕事・予定",
  "month-template-add": "仕事/予定を追加",
  "month-edit": "編集で載せる",
  "projects-add": "案件を追加",
  "project-card": "詳細へ",
  "project-schedule-reschedule": "日程の変更",
  "memo-quick-add": "メモを追加",
} as const;

export type HintId = keyof typeof hints;
