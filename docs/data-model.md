# Atelier Flow — データモデル / localStorage / 状態

> 事実のみ。関連: [architecture.md](./architecture.md) / [data-flow.md](./data-flow.md)

---

## 1. 型定義一覧

### 1.1 【事実】現在使用中（正本: `lib/storage.ts`）

これらは `app/` または `components/` から直接/間接に参照される。

#### `Task`

```ts
{
  id: string;
  title: string;
  completed: boolean;
  date: string; // YYYY-MM-DD または ""（未割当）
}
```

#### `Project`

```ts
{
  id: string;
  title: string;      // 依頼内容
  client: string;     // 依頼主
  color: string;
  deadline: string;
  tasks: Task[];
  manualCompleted?: boolean; // 作業がない案件の手動完了
  isTutorial?: boolean;      // コメント: チュートリアルで作成（将来の除外/分析用）
}
```

#### `ShiftTemplateKind`

`"work" | "schedule"`

#### `ShiftTemplate`

```ts
{
  id: string;
  name: string;
  start: string;
  end: string;
  kind?: ShiftTemplateKind;
}
```

#### `Shift`

```ts
{
  date: string;
  templateId: string;
  kind?: ShiftTemplateKind; // 同日に仕事・予定を両方置けるよう保持
}
```

#### `Memo`

```ts
{
  id: string;
  title: string;
  content: string;
  date: string;
  importance: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  isTutorial?: boolean;
}
```

#### `ThemeSettings`

```ts
{
  background: string;
  accent: string;
  backgroundImage: string;
  colorMode?: "light" | "dark";
  customBackgroundImages?: string[]; // data URL
}
```

#### `HintMode`

`"on" | "off"`

#### `OnboardingSettings`

```ts
{
  tutorialCompleted: boolean;
  tutorialCompletedAt?: string;
  hintMode: HintMode;
  tutorialVersion?: number;
  tutorialTabProgress?: Partial<Record<TutorialTabId, TutorialTabProgress>>;
}
```

#### `TutorialTabId`

`"home" | "month" | "tasks" | "memo" | "settings"`

#### `TutorialTabProgress`

```ts
{ completed: boolean; skipped: boolean; }
```

#### `BackupData`

```ts
{
  version: number;
  exportedAt: string;
  projects: Project[];
  shifts: Shift[];
  shiftTemplates: ShiftTemplate[];
  memos?: Memo[];   // v2 以降・省略可
  theme?: ThemeSettings; // 省略可
}
```

`BACKUP_VERSION = 2`（`lib/storage.ts`）。

#### その他使用中の型（storage 外）

| 型 | 定義場所 | 使用 |
|----|----------|------|
| `ColorMode` | `lib/colorMode.ts` | テーマ |
| `HintId` | `lib/hints.ts` | `HintLabel` |
| `DateGroup`, `TaskPlanSegment` 等 | `lib/taskPlan.ts` | 日程組み直し |
| `GuidedStep` 等 | `lib/tutorialSteps.ts` | チュートリアル |
| `TutorialSessionStatus`, `TutorialSessionSnapshot` | `lib/tutorialSession.ts` | sessionStorage |
| `HomeEnrichedTask` | `components/HomeWorkPlanSections.tsx` | ホーム表示用 |

---

### 1.2 【事実】未使用（app/components から import されない）

| 型 | 定義ファイル | 備考 |
|----|--------------|------|
| `Task` / `Project`（id: number, `workStatus` 付き） | `types.ts` | storage の型と形状が異なる。import ゼロ |
| `Work` | `lib/workStorage.ts` | `atelier_works` 用。呼出ゼロ |
| `DaySchedule` | `lib/monthStorage.ts` | `atelier-flow-schedules` 用。呼出ゼロ |

---

### 1.3 【事実】廃止候補（分析は technical-debt に分離）

コード上「廃止」と書かれたマーカーはない。以下は **未使用である事実** により整理対象となるもの。

| 対象 | 根拠 |
|------|------|
| `types.ts` 全体 | import ゼロ + 現行型と不整合 |
| `data/projects.ts` の `initialProjects` | ファイルコメント「未使用」、import ゼロ |
| `Work` / `DaySchedule` | モジュール未使用 |
| `isUsingTutorialProjects` | 常に `false`、実質無効 |

---

## 2. localStorage 構造

### 2.1 キー一覧

| キー | 保存内容 | 使用画面 | 更新箇所 | 読み込み箇所 |
|------|----------|----------|----------|--------------|
| `atelier-flow-projects` | `Project[]` JSON | ホーム、案件系、create、dashboard、チュートリアル関連 | `storage.saveProjects` / `addProject` / `updateProject` ← repo 経由が多い。`clearAllData` / `importBackupFile` | `getProjects` ← `getProjectsRepo` / hooks |
| `atelier-flow-memos` | `Memo[]` JSON | ホーム、メモ、設定(clear/import) | `saveMemos` ← memosRepo。clear/import | `getMemos` ← `useMemos` |
| `atelier-flow-shifts` | `Shift[]` JSON | ホーム、月、設定(clear/import) | `saveShifts`（主に `month/page`）、clear/import | `getShifts` ← `useShifts` |
| `atelier-flow-shift-templates` | `ShiftTemplate[]` | ホーム、月、設定 | `saveShiftTemplates`（`month/page`）、clear/import | `getShiftTemplates` ← `useShiftTemplates` |
| `atelier-flow-theme` | `ThemeSettings` JSON | 全画面（ThemedMain）、設定、layout 初期スクリプト | `saveTheme`、clear/import | `getTheme`、`layout` inline script、`ThemeProvider` |
| `atelier-flow-onboarding` | `OnboardingSettings` | 設定、チュートリアル全域、HintLabel 経由 | `saveOnboarding`、clear | `getOnboarding`、OnboardingProvider、`useOnboardingSettings` |
| `atelier-sort` | ソート種別文字列 | `/projects` のみ | `projects/page` `changeSort` | `projects/page` |
| `atelier-show-completed` | 完了表示フラグ | `/projects` のみ | `toggleCompleted` | `projects/page` |
| `atelier-memos-sort` | ソート種別 | `/memos` のみ | `changeSort` | `memos/page` |
| `atelier-show-completed-memos` | 完了表示フラグ | `/memos` のみ | `toggleCompletedFilter` | `memos/page` |
| `atelier_works` | `Work[]`（想定） | **なし** | `workStorage.saveWorks`（呼出なし） | `getWorks`（呼出なし） |
| `atelier-flow-schedules` | `DaySchedule[]`（想定） | **なし** | `monthStorage.saveSchedules`（呼出なし） | `getSchedules`（呼出なし） |

バックアップダウンロード名プレフィックス（localStorage キーではない）: `atelier-flow-backup-` + 日付 + `.json`（`exportBackup`）。

### 2.2 【事実】`clearAllData` が削除するキー

- `atelier-flow-projects`
- `atelier-flow-shift-templates`
- `atelier-flow-shifts`
- `atelier-flow-theme`
- `atelier-flow-onboarding`
- `atelier-flow-memos`

加えて `endTutorialSession()`（sessionStorage クリア）、テーマ/オンボーディング/シフトの通知。

**削除しない**: `atelier-sort`, `atelier-show-completed`, `atelier-memos-sort`, `atelier-show-completed-memos`, `atelier_works`, `atelier-flow-schedules`

### 2.3 【事実】キャッシュ無効化

`invalidateStorageCacheFromEvent(key)` は次のキーのスナップショットのみ無効化:

- `atelier-flow-projects`
- `atelier-flow-memos`
- `atelier-flow-onboarding`

（shifts / theme のキーは対象外）

---

## 3. sessionStorage 構造

| キー | 内容 | 更新 | 読込 |
|------|------|------|------|
| `tutorial-session` | セッション活性フラグ相当 | `startTutorialSession` / `endTutorialSession` | `isTutorialSessionActive` 等 |
| `tutorial-session-state` | `TutorialSessionSnapshot` JSON | `persistTutorialSessionSnapshot` / start / end | `loadTutorialSessionSnapshot` |
| `tutorial-created-project-id` | 作成した案件 id 文字列 | `setTutorialCreatedProjectId` / `clearTutorialCreatedProjectId` | `getTutorialCreatedProjectId`（案件一覧等） |

---

## 4. 状態管理の全洗い出し

### 4.1 グローバル（永続 + 購読）

| 名前 | 仕組み | ファイル |
|------|--------|----------|
| projects | `useSyncExternalStore` | `lib/useProjectsRepo.ts` |
| memos | 同上 | `lib/useMemos.ts` |
| shifts / templates | 同上 | `lib/useShiftData.ts` |
| theme | 同上 + `THEME_CHANGE_EVENT` | `lib/useThemeSettings.ts` |
| onboarding settings | 同上 | `lib/useOnboardingSettings.ts` + OnboardingProvider 内 |

### 4.2 Context

| 名前 | ファイル |
|------|----------|
| `OnboardingContext` / `useOnboarding()` | `components/onboarding/OnboardingProvider.tsx` |

`ThemeProvider` は Context を持たない。

### 4.3 Local `useState`（ファイル別）

| ファイル | state |
|----------|-------|
| `app/page.tsx` | `weekOffset`, `selectedDay`, `calendarOpen` |
| `app/month/page.tsx` | `currentDate`, `name`, `start`, `end`, `templateKind`, `noTime`, `editMode`, `selectedTemplateId` |
| `app/memos/page.tsx` | `editingMemoId`, `editContent`, `editDate`, `editImportance`, `exitingMemoIds` + prefs は `useSyncExternalStore` |
| `app/settings/page.tsx` | `message` |
| `app/create/page.tsx` | `title`, `deadline`, `tasks` |
| `app/projects/new/page.tsx` | `client`, `title`, `deadline`, `color`, `tasks`, `taskTitle`, `taskDate`, `editingTaskId`, `editTitle`, `editDate`, `exampleApplied` |
| `app/projects/[id]/page.tsx` | `editingTaskId`, `editTitle`, `editDate` |
| `app/projects/[id]/edit/page.tsx` | `project`, `newTask`, `newTaskDate` |
| `app/projects/page.tsx` | prefs のみ external store |
| `AddProjectForm` | `title` |
| `AddTaskForm` | `title`, `projectId` |
| `BackgroundImagePicker` | `error` |
| `DeadlineField` | `wantsDate` |
| `MemoDateField` | `wantsDate` |
| `TaskScheduleDateInput` | `wantsDate` |
| `ThemeColorPicker` | `hexInput`, `r`, `g`, `b`, `hexError`, `customOpen` |
| `SimpleDatePicker` | `viewMonth` |
| `QuickMemoComposer` | `content`, `noDate`, `date`, `importance` |
| `ProjectScheduleReschedule` | `open`, `removeDate`, `addDate` |
| `OnboardingProvider` | step/target/transition 関連多数（`currentStepId`, `targetRect`, `isTransitioning`, …） |
| `TutorialOverlay` | `layout`, `nudge`, `debugOpen` |
| `WelcomeOverlay` | `mounted` |

`useReducer` の使用はリポジトリ内にない。

### 4.4 sessionStorage 依存状態

チュートリアル活性・スナップショット・作成案件 ID（上記キー）。OnboardingProvider および各ページのチュートリアル分岐が参照。

---

## 5. 【分析】型の読み分け

- **編集・永続化の正本**: 常に `lib/storage.ts`
- `types.ts` を新規コードから import すると、id 型・フィールドが食い違う
- `Task.date === ""` は「予定なし」として UI（`TaskScheduleDateInput`）と `taskPlan` が扱う
|
