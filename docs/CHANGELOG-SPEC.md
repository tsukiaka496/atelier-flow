# 仕様変更ログ（2026-07実装）

本ドキュメントは大規模 UX / データモデル変更後の要点です。詳細な旧資料（screens.md 等）は一部古い記述が残る可能性があります。**現行の正本はコード**です。

## データモデル

- `Task` は `{ id, title, completed }` のみ（`date` 廃止）
- `Project.schedule: ScheduleSlot[]` — `{ id, date, taskId? }`
- 作業順（`tasks`）と日程順（`schedule`）は完全独立
- 旧 `Task.date` は `normalizeProject` で `ScheduleSlot` へマイグレーション
- `BACKUP_VERSION = 3`（`timeline` 追加）
- チュートリアル / Onboarding 型・ストレージは削除

## ナビ・ヘッダー

- `AppHeader`: `?`（画面ヒント）+ 歯車（`/settings`）
- `BottomNav`: ホーム / 月 / 案件 / メモ / **時間**（設定はヘッダーへ）
- `PageShell` で共通シェル

## 月表示

- 日タップ → ボトムシート編集（ShiftBoard 風）
- 詳細 / 簡易は `ThemeSettings.monthDisplayMode`（**同一 Shift データ**、表示のみ切替）
- 詳細モードでは登録済みシフトを**履歴**として表示し、タップ一発でその日に割り当て可能（使用回数・直近利用日で並び替え）

## 時間スケジュール

- ルート `/timeline`（ナビ表示名は「時間」）
- 0〜23時の1時間刻み表を常時表示（左0〜11 / 右12〜23）
- **開始〜終了の範囲登録**に対応（`TimelineSlot.endMinutes`）。途中の時間帯にも連続表示
- `TimelinePlan`（平日 / 休日、`minutes` + 任意の `endMinutes` + `label`）
- 他画面非連携

## 削除したもの

- チュートリアル一式、`ProjectScheduleReschedule`、旧 HintLabel / hintMode
- Dead code: `types.ts`, `autoSchedule`, `scheduler`, `workStorage`, `monthStorage` 等
