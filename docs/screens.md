# Atelier Flow — 画面構成・操作フロー

> 事実のみ。推測禁止。関連: [architecture.md](./architecture.md) / [data-flow.md](./data-flow.md)

---

## 1. 全ルート一覧

| ルート | ファイル | Client/Server | BottomNav |
|--------|----------|---------------|-----------|
| （全ページ共通） | `app/layout.tsx` | Server | — |
| `/` | `app/page.tsx` | Client | あり |
| `/month` | `app/month/page.tsx` | Client | あり |
| `/projects` | `app/projects/page.tsx` | Client | あり |
| `/projects/new` | `app/projects/new/page.tsx` | Client | なし |
| `/projects/[id]` | `app/projects/[id]/page.tsx` | Client | あり |
| `/projects/[id]/edit` | `app/projects/[id]/edit/page.tsx` | Client | なし |
| `/memos` | `app/memos/page.tsx` | Client | あり |
| `/memos/new` | `app/memos/new/page.tsx` | Server | —（`redirect("/memos")` のみ） |
| `/settings` | `app/settings/page.tsx` | Client | あり |
| `/create` | `app/create/page.tsx` | Client | あり（他画面からリンクなし） |
| `/dashboard` | `app/dashboard/page.tsx` | Client | なし（他画面からリンクなし） |

BottomNav 定義（`components/BottomNav.tsx`）:

| href | ラベル |
|------|--------|
| `/` | ホーム |
| `/month` | 月 |
| `/projects` | 案件 |
| `/memos` | メモ |
| `/settings` | 設定 |

---

## 2. 画面詳細

### 2.1 `/` ホーム

| 項目 | 内容 |
|------|------|
| **役割** | 週単位の予定確認。選択日のシフト・締切・メモ・作業を表示し、作業/メモの完了を切り替え |
| **主な機能** | 週オフセット移動、日選択、日付ピッカー、作業トグル、メモトグル、締切リンク、期限超過/未割当セクション |
| **使用コンポーネント** | `ThemedMain`, `BottomNav`, `SimpleDatePicker`, `HintLabel`, `HomeWorkPlanSections`, ローカル `DayScheduleItems` |
| **hooks / 書込** | `useProjectsRepo`, `useMemos`, `useShifts`, `useShiftTemplates`, `useOnboarding`; 書込 `saveProjectsRepo`, `saveMemosRepo` |
| **保存データ** | Projects（タスク completed）, Memos（isCompleted / updatedAt） |
| **関連型** | `Project`, `Task`, `Memo`, `Shift`, `ShiftTemplate` |

**UI 構造**

| 領域 | 内容（事実） |
|------|----------------|
| ヘッダー相当 | 日付バッジ・ヒント・週ナビ（`<header>` なし） |
| メイン | 週ストリップ、選択日詳細、`HomeWorkPlanSections` |
| フッター相当 | `BottomNav` |

**Local state**: `weekOffset`, `selectedDay`, `calendarOpen`

---

### 2.2 `/month` 月

| 項目 | 内容 |
|------|------|
| **役割** | シフトテンプレート（仕事/予定）の管理と、編集モードでのカレンダー日への配置 |
| **主な機能** | 月移動、テンプレ追加/選択/削除、種別切替、時間あり/なし、編集モード、日セルでシフト toggle |
| **使用コンポーネント** | `ThemedMain`, `BottomNav`, `MonthDayShiftBadges`, `HintLabel` |
| **hooks / 書込** | `useShifts`, `useShiftTemplates`, `useOnboarding`; `saveShifts`, `saveShiftTemplates` |
| **保存データ** | `atelier-flow-shifts`, `atelier-flow-shift-templates` |
| **関連型** | `Shift`, `ShiftTemplate`, `ShiftTemplateKind` |

**Local state**: `currentDate`, `name`, `start`, `end`, `templateKind`, `noTime`, `editMode`, `selectedTemplateId`

---

### 2.3 `/projects` 案件一覧

| 項目 | 内容 |
|------|------|
| **役割** | 案件一覧の表示・ソート・完了済み表示切替・新規/詳細への導線 |
| **主な機能** | 納期順/進捗順、完了済み表示トグル、案件カードリンク、＋で `/projects/new` |
| **使用コンポーネント** | `ThemedMain`, `BottomNav`, `HintLabel` |
| **hooks** | `useProjectsRepo`, `useOnboarding` |
| **保存データ** | 読取: projects。書込: `atelier-sort`, `atelier-show-completed`（一覧 prefs） |
| **関連型** | `Project`, `Task`（進捗計算に使用） |

**Local / external prefs state**: `sortType`, `showCompleted`（`useSyncExternalStore` + localStorage）

---

### 2.4 `/projects/new` 案件作成

| 項目 | 内容 |
|------|------|
| **役割** | 新規案件（依頼主・タイトル・色・納期・作業リスト）の作成 |
| **主な機能** | フィールド入力、作業追加/編集/並び替え/削除、入力例、作成 |
| **使用コンポーネント** | `ThemedMain`, `DeadlineField`, `TaskScheduleDateInput`, `TaskEditorSheet` |
| **書込** | `addProjectRepo`; チュートリアル時 `setTutorialCreatedProjectId` |
| **保存データ** | projects; session `tutorial-created-project-id`（条件付き） |
| **関連型** | `Project`, `Task` |

**BottomNav**: なし

---

### 2.5 `/projects/[id]` 案件詳細

| 項目 | 内容 |
|------|------|
| **役割** | 単一案件の進捗確認、作業完了、作業編集、日程組み直し、削除 |
| **主な機能** | 全完了/全解除、作業トグル、`TaskEditorSheet`、`ProjectScheduleReschedule`、編集ページへ、削除 |
| **使用コンポーネント** | `ThemedMain`, `BottomNav`, `TaskEditorSheet`, `ProjectScheduleReschedule` |
| **書込** | `saveProjectsRepo` |
| **保存データ** | projects |
| **関連型** | `Project`, `Task` |

---

### 2.6 `/projects/[id]/edit` 案件編集

| 項目 | 内容 |
|------|------|
| **役割** | 案件メタデータと作業一覧の一括編集 |
| **主な機能** | フィールド更新、作業追加/並び/削除/日付、保存 |
| **使用コンポーネント** | `ThemedMain`, `DeadlineField`, `TaskScheduleDateInput` |
| **書込** | `saveProjectsRepo`（`normalizeProject` 後） |
| **保存データ** | projects |
| **関連型** | `Project`, `Task` |

**BottomNav**: なし

---

### 2.7 `/memos` メモ

| 項目 | 内容 |
|------|------|
| **役割** | メモ一覧・クイック追加・編集シート・完了・削除 |
| **主な機能** | `QuickMemoComposer`, ソート/完了フィルタ、完了トグル、`MemoEditorSheet` |
| **使用コンポーネント** | `ThemedMain`, `BottomNav`, `QuickMemoComposer`, `MemoEditorSheet` |
| **書込** | `addMemoRepo`, `saveMemosRepo`; prefs: `atelier-memos-sort`, `atelier-show-completed-memos` |
| **保存データ** | memos + list prefs |
| **関連型** | `Memo` |

---

### 2.8 `/memos/new`

| 項目 | 内容 |
|------|------|
| **役割** | `/memos` へのリダイレクトのみ |
| **実装** | `redirect("/memos")` |

---

### 2.9 `/settings` 設定

| 項目 | 内容 |
|------|------|
| **役割** | 外観・ヒント・バックアップ・全削除 |
| **主な機能** | カラーモード、ヒントモード、背景色/アクセント、背景画像、JSON 書き出し/読み込み、全データ削除 |
| **使用コンポーネント** | `ThemedMain`, `BottomNav`, `ColorModeToggle`, `HintModeToggle`, `ThemeColorPicker`, `BackgroundImagePicker` |
| **書込** | `saveTheme`, `saveOnboarding`, `exportBackup`, `importBackupFile`, `clearAllData` |
| **保存データ** | theme, onboarding; バックアップはファイル DL; clear は複数キー削除（[data-model.md](./data-model.md)） |
| **関連型** | `ThemeSettings`, `OnboardingSettings`, `HintMode`, `BackupData` |

**Local state**: `message`

---

### 2.10 `/create`（ナビ未接続）

| 項目 | 内容 |
|------|------|
| **役割** | 簡易な案件作成（タイトル・納期・工程文字列配列） |
| **使用コンポーネント** | `ThemedMain`, `BottomNav`, `DeadlineField` |
| **書込** | `getProjectsRepo` + `saveProjectsRepo` |
| **関連型** | `Project`, `Task`（`client: ""`, `date: ""` 固定で Task 生成） |

他ファイルから `href="/create"` の参照はなし。

---

### 2.11 `/dashboard`（ナビ未接続）

| 項目 | 内容 |
|------|------|
| **役割** | `AddProjectForm` と `AddTaskForm` を並べた管理画面 |
| **使用コンポーネント** | `ThemedMain`, `AddProjectForm`, `AddTaskForm` |
| **書込** | 各フォームが `addProjectRepo` / `saveProjectsRepo` |

他ファイルから `href="/dashboard"` の参照はなし。

---

## 3. ユーザー操作フロー

凡例:

```
ユーザー操作 → ローカル状態変更 → 永続化 → 購読による画面更新
```

---

### 3.1 案件作成（現行導線: `/projects/new`）

```
[/projects] 「＋」Link → /projects/new
  → 入力: client / title / deadline / color / tasks（useState）
  → 作業追加: setTasks([...])
  → 「依頼作成」handleCreateProject
       → addProjectRepo({ id: crypto.randomUUID(), ... })
            → storage.save / addProject
            → localStorage[atelier-flow-projects]
            → emit atelier-flow:projects-changed
       → （チュートリアル中）setTutorialCreatedProjectId
       → router.push("/projects")
  → /projects の useProjectsRepo が再購読 → 一覧更新
```

### 3.2 案件作成（旧: `/create`）

```
直接 URL /create
  → title / deadline / tasks:string[]（useState）
  → handleSave
       → Task[] に変換（date: ""）
       → saveProjectsRepo([...projects, newProject])
       → router.push("/projects")
```

### 3.3 案件作成（旧: `/dashboard` の AddProjectForm）

```
AddProjectForm 入力 → addProjectRepo → projects-changed → （dashboard 自体は一覧 hook なし）
```

---

### 3.4 作業追加

**A. 新規作成画面 (`/projects/new`)**

```
作業名 + 任意日付入力 → addTask → setTasks（ローカルのみ）
  → 案件作成時に tasks ごと addProjectRepo
```

**B. 編集画面 (`/projects/[id]/edit`)**

```
newTask / newTaskDate → addTask → setProject（ローカル）
  → 「保存」saveProject → normalizeProject → saveProjectsRepo → projects-changed
  → router.push(/projects/[id])
```

**C. 詳細画面**

詳細画面の UI から新規作業を追加する処理は、編集は `TaskEditorSheet`（既存作業）、新規追加は edit ページ側。詳細ページの `deleteTask` / `saveTaskEdits` は既存作業向け。

**D. dashboard AddTaskForm**

```
projectId + title → getProjectsRepo → 対象 Project.tasks に追加 → saveProjectsRepo
```

---

### 3.5 作業編集

```
[/projects/[id]] 編集ボタン → openTaskEditor
  → editingTaskId / editTitle / editDate（useState）
  → TaskEditorSheet 表示
  → 「保存」saveTaskEdits
       → tasks.map で title/date 更新
       → saveProjectsRepo
       → closeTaskEditor
  → useProjectsRepo 再描画
```

`/projects/new` でも同様にシート編集があるが、保存先はローカル `tasks` state（案件未作成時）。

---

### 3.6 作業完了トグル

**ホーム**

```
HomeWorkPlanSections のトグル → toggleTask(projectId, taskId)
  → projects.map で task.completed 反転
  → saveProjectsRepo
  → projects-changed → ホーム再描画
```

**案件詳細**

```
行クリック → toggleTask(taskId)
  → 同上パターンで saveProjectsRepo
```

**全完了 / 全解除（詳細）**

```
toggleAllTasks
  → tasks が空: manualCompleted 反転
  → tasks あり: 全 task.completed を一括セット
  → saveProjectsRepo
```

---

### 3.7 作業削除

```
詳細: deleteTask → confirm → filter → saveProjectsRepo
編集: deleteTask → setProject（ローカル）→ 保存時に永続化
新規: removeTask → setTasks（ローカル）
```

---

### 3.8 日程組み直し

```
ProjectScheduleReschedule
  → removeDate / addDate（ローカル）
  → taskPlan の再割当結果を onApply(updatedProject)
  → applyRescheduledProject → saveProjectsRepo
```

---

### 3.9 案件削除

```
詳細「削除」→ confirm → filter → saveProjectsRepo → router.push("/projects")
```

---

### 3.10 シフトテンプレート追加

```
/month フォーム入力 → handleAddTemplate
  → 入力十分: addTemplateFromForm
       → saveShiftTemplates([...])
       → shifts-changed → useShiftTemplates 更新
  → 不足時: addTutorialShiftTemplate（チュートリアル用）
```

### 3.11 シフト配置（日セル）

```
editMode === true かつ activeTemplateId あり
  → 日セルタップ → toggleShift(date)
       → 同一 kind の既存シフトを削除 / 置換 / 追加
       → saveShifts(updatedShifts)
       → shifts-changed → useShifts 更新
```

### 3.12 シフトテンプレート削除

```
deleteTemplate → confirm
  → saveShiftTemplates(filtered)
  → saveShifts(templateId を除いた shifts)
```

---

### 3.13 メモ追加

```
QuickMemoComposer onAdd(draft) → addQuickMemo
  → addMemoRepo({ id, title:"", content, date, importance, ... })
  → memos-changed → useMemos 更新
```

### 3.14 メモ編集

```
編集 → openMemoEditor（editing* state）
  → MemoEditorSheet
  → saveMemoEdits → saveMemosRepo → closeMemoEditor
```

### 3.15 メモ完了

```
ホーム: toggleMemo → isCompleted 反転 → saveMemosRepo
メモ一覧: toggleMemoComplete → 完了/解除（完了時は退出アニメ用 exitingMemoIds あり）→ saveMemosRepo
```

### 3.16 メモ削除

```
deleteMemo → confirm → saveMemosRepo(filter)
```

---

### 3.17 設定変更

```
カラーモード → changeColorMode → saveTheme → localStorage + applyColorModeClass + atelier-theme-change
ヒントモード → saveOnboarding({ ...getOnboarding(), hintMode })
背景/アクセント → saveCurrentTheme → saveTheme
背景画像 → BackgroundImagePicker onChange → 親が saveTheme（customBackgroundImages 含む）
```

### 3.18 バックアップ

```
書き出し: exportBackup → BackupData JSON を Blob DL（ファイル名 atelier-flow-backup-YYYY-MM-DD.json）
読み込み: importBackupFile → 確認 → 復元 → location.reload()
全削除: clearAllData → 確認 → reload
```

`clearAllData` が消すキー: projects, shift-templates, shifts, theme, onboarding, memos。  
一覧 prefs（`atelier-sort` 等）は `clearAllData` 内で `removeItem` していない。

---

### 3.19 一覧 prefs（案件・メモ）

```
ソート/完了表示トグル
  → localStorage.setItem(対応キー)
  → dispatch 対応 list-prefs イベント
  → 同ページ useSyncExternalStore 更新
```

---

### 3.20 チュートリアル開始/進行（概要）

```
WelcomeOverlay「はじめる」→ OnboardingProvider.startTutorial
  → sessionStorage tutorial-session / tutorial-session-state
  → saveOnboarding（進捗）
  → TutorialOverlay + data-tour ターゲット
  → registerTourAction / runTourAction で各画面操作と連動
スキップ/完了 → saveOnboarding + endTutorialSession（条件による）
```

詳細ステップ定義は `lib/tutorialSteps.ts` の `GUIDED_STEPS` / `TUTORIAL_STEPS_BY_TAB`。

---

## 4. 【分析】操作フロー上の注意点

- 案件作成の「正規」導線は `/projects` → `/projects/new`。`/create` と `/dashboard` は並行実装として残存。
- 作業完了トグルはホームと詳細で別関数だが、どちらも `saveProjectsRepo` による同一ストレージ更新。
- 月面のシフト配置は `editMode` が false のとき `toggleShift` が早期 return する。
|
