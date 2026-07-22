# Atelier Flow — データフロー

> 事実のみ。操作手順の詳細は [screens.md](./screens.md)。型・キーは [data-model.md](./data-model.md)。

---

## 1. アプリ全体のデータフロー（概観）

```
[ユーザー操作 on page/component]
        │
        ▼
[ページ内 useState または直接 repo/storage API]
        │
        ▼
[lib/storage.ts get*/save*  （projects/memos は repo 経由）]
        │
        ├── localStorage.setItem(キー, JSON)
        ├── モジュール内スナップショット更新
        └── CustomEvent 発火
                │
                ▼
[useSyncExternalStore / addEventListener]
        │
        ▼
[購読中コンポーネントの再レンダー]
```

クロスタブ: `projectsRepo` / `memosRepo` のみ `window` の `storage` イベントを購読し、`invalidateStorageCacheFromEvent` 後に再描画。

---

## 2. エンティティ別フロー

### 2.1 Project

**読み**

```
UI → useProjectsRepo()
   → subscribeProjectsChanged
   → getProjectsRepo() → getProjects() → localStorage[atelier-flow-projects]
   → normalizeProject 経由の配列
```

**書き（代表パス）**

| 操作 | 呼出 | 永続化 |
|------|------|--------|
| 新規 | `addProjectRepo` | `addProject` → save |
| 一括置換 | `saveProjectsRepo` | `saveProjects` |
| 単体更新 API | `updateProjectRepo` | `updateProject` |

いずれも後続で `atelier-flow:projects-changed`。

**参照画面**: `/`, `/projects`, `/projects/new`, `/projects/[id]`, `/projects/[id]/edit`, `/create`, `/dashboard` のフォーム、OnboardingProvider（ツアー用に `getProjectsRepo`）

**内包**: `Project.tasks: Task[]`。Task 単独のストレージキーはない。

---

### 2.2 Task

**モデル上の位置**: 常に親 `Project` の配列要素。

**完了トグル**

```
Home.toggleTask / Detail.toggleTask
  → Project.tasks[].completed 反転を含む Project[] を組み立て
  → saveProjectsRepo
  → localStorage projects
  → projects-changed
  → useProjectsRepo 購読画面が更新
```

**日付**

- 作成/編集 UI: `TaskScheduleDateInput` → `task.date` 文字列
- 空文字は未割当（`taskPlan.getProjectScheduleDates` は空を除外）
- 組み直し: `ProjectScheduleReschedule` + `taskPlan` → 更新済み `Project` → `saveProjectsRepo`

**進捗**: `lib/projectProgress.ts` の `getProjectProgress` / `isProjectFullyCompleted`（tasks または `manualCompleted`）

---

### 2.3 Shift / ShiftTemplate

**読み**

```
useShifts / useShiftTemplates
  → subscribeShiftsChanged（共通イベント atelier-flow:shifts-changed）
  → getShifts / getShiftTemplates
```

**書き**

```
month/page
  → saveShiftTemplates / saveShifts
  → localStorage
  → notifyShiftsChanged（storage 内）
```

テンプレ削除時は templates と、その `templateId` を持つ shifts の両方を更新。

**表示補助**: `lib/shiftUtils.ts`, `lib/shiftDisplay.ts`（ホーム・月）

**クロスタブ**: shifts hook は `storage` イベント非購読（コード事実）。

---

### 2.4 Theme

**読み**

```
useThemeSettings → getTheme → atelier-flow-theme
ThemedMain → useThemeSettings（または props 上書き）
layout beforeInteractive script → 同期的に dark class
ThemeProvider → mount / THEME_CHANGE_EVENT で applyColorModeClass
```

**書き**

```
settings → saveTheme(partial merge)
  → localStorage
  → applyColorModeClass
  → notifyThemeChange → event "atelier-theme-change"
```

`BackgroundImagePicker` はファイルを data URL に圧縮（`themeBackgrounds.compressImageFileToDataUrl`）し、親が `customBackgroundImages` を含む theme を保存。

---

### 2.5 Onboarding

**永続**

```
getOnboarding / saveOnboarding → atelier-flow-onboarding
イベント: atelier-flow:onboarding-changed
```

**セッション**

```
tutorialSession.ts ↔ sessionStorage (tutorial-session, tutorial-session-state)
```

**UI 状態**

```
OnboardingProvider useState（currentStepId, targetRect, …）
  + Context で子へ配布
  + WelcomeOverlay / TutorialOverlay を同ツリーで描画
```

**ヒント**

```
settings.hintMode → shouldShowHints
  → HintLabel が hints[hintId] を条件表示
```

**案件作成との接続**

```
チュートリアル中の addProjectRepo → Project.isTutorial = true
  + setTutorialCreatedProjectId(session)
```

---

### 2.6 Memo

**読み**

```
useMemos → getMemosRepo → getMemos → atelier-flow-memos
```

**書き**

```
addMemoRepo / saveMemosRepo / updateMemoRepo
  → saveMemos → localStorage
  → atelier-flow:memos-changed
```

**参照画面**: `/memos`（CRUD）、`/`（日付一致メモの表示・完了トグル）

**バックアップ**: `BackupData.memos` は optional（v2）。`createBackupData` / `importBackupFile` が扱う。

---

## 3. バックアップフロー

```
exportBackup
  → createBackupData()（projects, shifts, shiftTemplates, memos, theme, version=2）
  → JSON Blob ダウンロード

importBackupFile(file)
  → JSON parse / 検証・正規化
  → 各 save* で上書き
  → settings 画面が success 時 location.reload()
```

---

## 4. イベントと UI 更新の対応表

| データ | 書込後イベント | 主な再描画トリガ |
|--------|----------------|------------------|
| Project/Task | `atelier-flow:projects-changed` | `useProjectsRepo` |
| Memo | `atelier-flow:memos-changed` | `useMemos` |
| Shift(s) | `atelier-flow:shifts-changed` | `useShifts` / `useShiftTemplates` |
| Theme | `atelier-theme-change` | `useThemeSettings`, `ThemeProvider` |
| Onboarding | `atelier-flow:onboarding-changed` | `useOnboardingSettings`, Provider |
| 案件一覧 prefs | `atelier-flow:projects-list-prefs` | projects page store |
| メモ一覧 prefs | `atelier-flow:memos-list-prefs` | memos page store |

---

## 5. 【分析】改修時のチェックリスト（事実に基づく）

1. 新フィールドを足すなら `normalize*`（`storage.ts`）と `BackupData` / import 互換を同時に確認する
2. Projects/Memos は repo の emit を忘れると同一タブでも hook が更新されない（`saveProjects` 単体では projects-changed は出ない。repo 経由が必要）
3. Shifts は `storage.saveShifts` がイベントを出すため、repo 層がない
4. Task だけの API はない。常に Project 単位で保存する
|
