# Atelier Flow — 技術的負債 / 重複 / Dead Code

> **事実**と**分析（優先度）**を分離する。優先度は分析である。

関連: [architecture.md](./architecture.md) / [data-model.md](./data-model.md)

---

## 1. 重複コード調査

### 1.1 【事実】重複ロジック

| 内容 | 箇所 |
|------|------|
| 作業完了トグル（`completed` 反転 → `saveProjectsRepo`） | `app/page.tsx` `toggleTask` と `app/projects/[id]/page.tsx` `toggleTask` |
| 残り日数計算（deadline と today の差） | `app/projects/[id]/page.tsx` `getDaysLeft` / `getTaskDaysLeft` と `lib/getPriorityProjects.ts` 内 `daysLeft`（後者は未使用モジュール） |
| 作業の上下入れ替え | `app/projects/new/page.tsx` と `app/projects/[id]/edit/page.tsx` |
| 一覧の sort / showCompleted を localStorage + カスタムイベントで保持 | `app/projects/page.tsx` と `app/memos/page.tsx`（キー名は別） |
| 日付「なし」チェックボックス + `type="date"` | `DeadlineField`, `MemoDateField`, `TaskScheduleDateInput`（ラベル文言は異なるが構造が同型） |
| 案件新規の複数実装 | `/projects/new`, `/create`, `AddProjectForm`（dashboard） |

### 1.2 【事実】重複 UI

| UI | 箇所 |
|----|------|
| 任意日付フィールド | 上記 3 コンポーネント |
| 案件作成フォーム | new / create / AddProjectForm |
| シート型エディタ | `TaskEditorSheet` と `MemoEditorSheet`（開閉・保存・削除のパターンが類似） |

### 1.3 【分析】共通化候補

| 候補 | 根拠となる事実 | 期待効果（分析） |
|------|----------------|------------------|
| `OptionalDateField` | 3 コンポーネントの同型 JSX | 日付 UI の振る舞い統一 |
| `toggleTaskCompleted(projects, projectId, taskId)` | 2 画面の同処理 | バグ修正の一点化 |
| 一覧 prefs hook | projects/memos の同パターン | prefs キー漏れ（clearAllData）の扱いも揃えやすい |
| 案件作成の導線一本化 | 3 実装 + `/create` `/dashboard` がナビ非接続 | 保守対象の削減 |

---

## 2. Dead Code 調査

### 2.1 【事実】未使用ファイル（app/components から import されない）

| ファイル | 内容 |
|----------|------|
| `types.ts` | 旧 `Task`/`Project` |
| `data/projects.ts` | `initialProjects`（自コメントで未使用と記載） |
| `lib/workStorage.ts` | `Work`, `getWorks`, `saveWorks` |
| `lib/monthStorage.ts` | `DaySchedule`, `getSchedules`, `saveSchedules` |
| `lib/autoSchedule.ts` | `autoSchedule` |
| `lib/scheduler.ts` | `getWeekTasks` |
| `lib/getPriorityProjects.ts` | `getPriorityProjects` |
| `lib/tutorialSampleProjects.ts` | `createTutorialSampleProjects`（定義のみ、参照ゼロ） |

### 2.2 【事実】lib 内のみ参照だが app/components 未使用

| ファイル | 参照元 |
|----------|--------|
| `lib/hintMode.ts` | `lib/storage.ts` のみ（`normalizeHintMode`）→ **使用中**（間接） |
| `lib/tutorialTarget.ts` | `lib/tutorialTargetIdentity.ts` のみ → **使用中**（間接） |

### 2.3 【事実】エクスポートされているが呼出ゼロの関数

| シンボル | ファイル |
|----------|----------|
| `isUsingTutorialProjects` | `lib/projectsRepo.ts`（本体は常に `false`） |
| `useTourProxy` | `lib/useTourAction.ts` |

### 2.4 【事実】ナビ非接続だが実装はあるルート

| ルート | コンポーネント |
|--------|----------------|
| `/create` | 案件簡易作成（動作する実装） |
| `/dashboard` | `AddProjectForm`, `AddTaskForm` |

「デッドルート」ではなく「未リンク・並行実装」として扱うのがコード事実に忠実。

### 2.5 【事実】空ディレクトリ

- `scripts/`（ファイル 0）

### 2.6 【事実】スタブルート

- `/memos/new` → `redirect("/memos")` のみ

---

## 3. その他コード上確認できる不整合

| 事実 | 箇所 |
|------|------|
| メタデータが Create Next App のまま | `app/layout.tsx` |
| README がプロダクト説明でない | `README.md` |
| `clearAllData` が一覧 prefs キーを消さない | `lib/storage.ts` vs `app/projects/page.tsx` / `memos/page.tsx` |
| shifts の cross-tab `storage` 非購読 | `lib/useShiftData.ts`（projects/memos との非対称） |
| `invalidateStorageCacheFromEvent` が shifts/theme キーを見ない | `lib/storage.ts` |
| `Project.isTutorial` コメントが「将来の除外/分析用」 | `lib/storage.ts`（現時点の除外ロジックは `isUsingTutorialProjects` が false のため未稼働） |

---

## 4. 技術的負債一覧（優先度は分析）

優先度の定義（本資料内）:

- **P0**: データ損失・復元不完全・型の二重定義など、改修時に実害が出やすい
- **P1**: 保守コスト・並行実装・未リンク機能の混乱
- **P2**: ドキュメント/メタ/空ディレクトリ等、動作非影響

### P0（分析）

| ID | 項目 | 事実根拠 | 推奨対応の方向（分析） |
|----|------|----------|------------------------|
| P0-1 | ドメイン型の二重定義 | `types.ts` と `lib/storage.ts` が非互換 | `types.ts` 削除または再エクスポート禁止を明記 |
| P0-2 | バックアップ/全削除と prefs の非対称 | clear が prefs を残す | clear/import の対象キーを文書化・必要なら拡張 |
| P0-3 | Task が Project 埋め込みのみ | 単独永続なし（設計事実）。分離改修時に全保存経路が必要 | 変更時は data-flow の Task 節を必須確認 |

### P1（分析）

| ID | 項目 | 事実根拠 |
|----|------|----------|
| P1-1 | 案件作成の三重実装 | `/projects/new`, `/create`, `AddProjectForm` |
| P1-2 | 未リンク画面の残存 | `/create`, `/dashboard` |
| P1-3 | 無効化されたチュートリアル案件ストア切替 | `isUsingTutorialProjects() === false` |
| P1-4 | 未使用スケジューラ群 | `autoSchedule`, `scheduler`, `getPriorityProjects`, `workStorage`, `monthStorage` |
| P1-5 | 日付フィールド三重複 | Deadline/Memo/TaskSchedule |
| P1-6 | 完了トグル二箇所実装 | home / detail |
| P1-7 | shifts のタブ間同期非対称 | projects/memos のみ `storage` 購読 |
| P1-8 | チュートリアルのページ埋込量 | 多数の `data-tour` / registry（改修コスト） |

### P2（分析）

| ID | 項目 | 事実根拠 |
|----|------|----------|
| P2-1 | metadata / README がテンプレのまま | layout, README |
| P2-2 | 空の `scripts/` | ディレクトリのみ |
| P2-3 | `/memos/new` リダイレクトのみ | stub |
| P2-4 | `useTourProxy` 未使用 | 定義のみ |
| P2-5 | `tutorialSampleProjects` 未使用 | 定義のみ |
| P2-6 | 開発専用チュートリアルデバッグ | NODE_ENV ガードあり（負債というより開発支援） |

---

## 5. 【分析】削除・整理の安全順（提案）

事実として「未参照」が確認できているものから着手可能:

1. `types.ts`, `data/projects.ts`
2. `lib/autoSchedule.ts`, `lib/scheduler.ts`, `lib/getPriorityProjects.ts`, `lib/workStorage.ts`, `lib/monthStorage.ts`, `lib/tutorialSampleProjects.ts`
3. ナビ接続方針を決めた上で `/create` / `/dashboard` の削除またはリダイレクト
4. 日付フィールドと toggleTask の共通化（動作回帰テストが必要だが、本リポジトリに自動テストはない）

自動テストが存在しないことは `package.json` の scripts/deps から確認できる事実である。
|
