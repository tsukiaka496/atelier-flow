# Atelier Flow — 将来拡張の影響範囲

> **事実**（現状コード）と**分析**（拡張時に触る範囲）を分離する。  
> 「メモ」「ヒント」は既に実装済みである。未実装前提の設計は書かない。

関連: [data-model.md](./data-model.md) / [data-flow.md](./data-flow.md) / [screens.md](./screens.md) / [technical-debt.md](./technical-debt.md)

---

## 1. メモ機能

### 1.1 【事実】現状

既に実装されている。

| 要素 | 場所 |
|------|------|
| 型 `Memo` | `lib/storage.ts` |
| 永続キー | `atelier-flow-memos` |
| Repo / Hook | `lib/memosRepo.ts`, `lib/useMemos.ts` |
| 画面 | `/memos`, ホームでの日付連動表示 |
| UI | `QuickMemoComposer`, `MemoEditorSheet`, `MemoDateField`, `ImportanceSelect` |
| バックアップ | `BackupData.memos?`（v2） |
| チュートリアル | tab `memo`, `tutorialMemoDraft`, QuickMemo の tour 連携 |
| ヒント | `memo-quick-add` |

### 1.2 【分析】「メモ機能の追加」ではなく「メモ機能の拡張」をする場合の影響範囲

| 変更例 | 影響が及ぶ事実上の接点 |
|--------|------------------------|
| フィールド追加（例: タグ） | `Memo` 型, `normalizeMemo`, `addQuickMemo` / `saveMemoEdits`, `MemoEditorSheet`, `BackupData` / import, ホームの表示条件 |
| メモ専用ルート（`/memos/[id]`） | `app/memos/**`, BottomNav は変更不要の可能性、チュートリアル `matchesGuidedRoute` |
| ホーム以外への表示 | 現状ホームは date 一致でフィルタ（`app/page.tsx`） |
| チュートリアル案件と同様の除外 | `isTutorial` フラグは既にある。除外ロジックは未実装 |

**触らなくてよい可能性が高いもの（現状依存なし）**: Shift 保存経路、案件 progress 計算（メモは非参照）。

---

## 2. タイムスケジュール

### 2.1 【事実】現状にある「時間」関連

| 要素 | 内容 |
|------|------|
| `ShiftTemplate.start` / `end` | 文字列。月面で入力可能。`noTime` 時は空文字で保存 |
| `Shift` | **日付 + templateId（+ kind）のみ**。開始終了時刻はテンプレ側 |
| 表示 | `lib/shiftDisplay.ts` の `formatShiftTimeRange` / `hasShiftTime` |
| 未使用の旧モデル | `lib/workStorage.ts` の `Work` に `startTime` / `endTime` / `date`（**呼出ゼロ**） |
| 未使用の旧カレンダー種別 | `lib/monthStorage.ts` の `DaySchedule.type: "バイト" \| "仕事" \| "休み"`（**呼出ゼロ**） |
| Task | **時刻フィールドなし**。`date`（日）のみ |
| Memo | **時刻フィールドなし**。`date` のみ |

ホームはシフトをテンプレの時間情報とともに表示する経路を持つ（`useShiftTemplates` + シフト解決）。

### 2.2 【分析】「タイムスケジュール」を足す場合の分岐と影響

コード上、時間を持つ現行エンティティは **ShiftTemplate** である。拡張の意味によって影響範囲が変わる。

#### A. シフトの時間表現を強化（テンプレまたは Shift に時刻を持たせる）

| 影響範囲 | ファイル / キー |
|----------|-----------------|
| 型・正規化・バックアップ | `Shift`/`ShiftTemplate`, `normalizeShift*`, `BackupData`, import |
| UI | `app/month/page.tsx` のフォーム、`MonthDayShiftBadges`, `shiftDisplay`, ホームのシフト表示 |
| 永続 | `atelier-flow-shifts` / `atelier-flow-shift-templates` |
| 注意 | 同一日に work/schedule を両方置ける現行仕様（`kind`）との整合 |

#### B. 作業（Task）に時刻を持たせる

| 影響範囲 | ファイル |
|----------|----------|
| 型 | `Task` |
| 入力 UI | `TaskScheduleDateInput`（日付のみ）, `TaskEditorSheet`, new/edit/detail |
| ホーム週・日表示 | `app/page.tsx`, `HomeWorkPlanSections` |
| 日程組み直し | `lib/taskPlan.ts`, `ProjectScheduleReschedule`（現状は日付列ベース） |
| バックアップ | projects 配下のため version/normalize |

#### C. 旧 `Work` / `DaySchedule` を復活

| 事実 | 現行の Shift 系とはキーも型も別 |
|------|----------------------------------|
| 影響 | 新規に画面を繋がない限り Dead Code のまま。繋ぐ場合は月面・ホームの二重モデル化リスク |

**【分析】推奨の読み**: 現行プロダクトのデータパスに載せるなら A または B。C は並行レガシーの再導入になる。

---

## 3. ヒント機能

### 3.1 【事実】現状

既に実装されている。

| 要素 | 場所 |
|------|------|
| 設定 | `OnboardingSettings.hintMode`（`"on" \| "off"`） |
| UI トグル | `HintModeToggle`（設定画面） |
| 表示 | `HintLabel` + `lib/hints.ts` の辞書 |
| 判定 | `useOnboarding().shouldShowHints` |
| 定義済み ID | `home-date`, `home-work`, `week-day`, `month-calendar`, `month-template-add`, `month-edit`, `projects-add`, `project-card`, `project-schedule-reschedule`, `memo-quick-add` |

### 3.2 【分析】ヒントを拡張する場合の影響範囲

| 変更 | 影響 |
|------|------|
| 文言追加・ID 追加 | `lib/hints.ts` の `hints` と `HintId`、配置先 JSX に `<HintLabel hintId=…>` |
| デフォルト on/off | `getDefaultOnboarding`（`storage.ts`） |
| チュートリアル中の表示ルール | `OnboardingProvider` 内 `shouldShowHints` の計算 |
| 永続 | `atelier-flow-onboarding`（バックアップ対象外: `BackupData` に onboarding フィールドは無い） |

**【事実】** `BackupData` 型に `onboarding` は含まれない。テーマ・メモは optional で含まれる。ヒント設定はバックアップ JSON には乗らない。

---

## 4. 作業と日付の分離

### 4.1 【事実】現状の結合度

| 事実 | 根拠 |
|------|------|
| Task は常に Project 配下 | `Project.tasks: Task[]`。Task 用 localStorage キーなし |
| 日付は Task のフィールド | `Task.date: string` |
| 日付なしが許容される | `date: ""`。UI 文言「予定なし（あとから載せる）」（`TaskScheduleDateInput`） |
| 並びと日付は独立と明記 | 同コンポーネントの説明文「案件の並びは変わりません」 |
| 日程組み直しは「日付スロット」操作 | `getProjectScheduleDates` / `isAddDateAllowed` / reschedule 適用が `task.date` を書き換える |
| ホーム表示は日付でグルーピング | `app/page.tsx` + `HomeWorkPlanSections` + `taskPlan` ヘルパ |
| 未使用 autoSchedule | 未完了タスクへ日付を機械割当する関数だが **import ゼロ** |

つまり現状は「作業エンティティと日付エンティティの完全分離」ではなく、**同一オブジェクト上の optional 日付**である。

### 4.2 【分析】「分離」の意味ごとの影響

#### A. 現状維持の強化（空日付の UX / 未割当一覧のみ）

影響は主に表示層: ホームの backlog セクション、案件詳細、ヒント文言。ストレージスキーマ変更は不要な場合が多い。

#### B. Task から date を外し、別コレクション（例: assignments）へ

| 層 | 影響範囲 |
|----|----------|
| 型 | `Task`, 新型, `normalize*`, マイグレーション（既存 localStorage JSON） |
| 保存 | `saveProjects` 経路すべて、バックアップ v2→v3 検討 |
| UI | new / edit / detail / TaskEditorSheet / TaskScheduleDateInput / Reschedule |
| 計算 | `taskPlan.ts` 全体、`projectProgress`（日付非依存なら影響小） |
| ホーム | 日別作業の結合クエリが必要 |
| チュートリアル | 作業日付を前提とする step / sample draft |

#### C. 旧 `autoSchedule` を接続

| 事実 | `lib/autoSchedule.ts` は `getProjects`/`saveProjects` を直接呼ぶ（repo の `projects-changed` を経由しない） |
|------|------|
| 分析 | 接続時は `saveProjectsRepo` に置き換えないと hook が更新されない可能性が高い |

---

## 5. 横断影響マトリクス（分析）

| 拡張テーマ | storage.ts | repos/hooks | 主要 page | onboarding/tutorial | backup |
|------------|------------|-------------|-----------|---------------------|--------|
| メモ拡張 | Memo 正規化 | memosRepo | memos, home | memo tab | memos フィールド |
| シフト時間強化 | Shift* | useShiftData | month, home | month tab | shifts/templates |
| Task に時刻 | Task | projectsRepo | projects*, home | tasks tab | projects |
| ヒント追加 | 不要（辞書のみの場合） | 不要 | 配置ページ | shouldShowHints | **含まない** |
| Task↔日付の完全分離 | 大 | projectsRepo | projects*, home | 大 | 大（要 version） |

---

## 6. 【事実】拡張前に読むべき正本ファイル

1. `lib/storage.ts` — 型・キー・normalize・backup・clear  
2. `lib/taskPlan.ts` — 日付と作業の現関係  
3. `lib/tutorialSteps.ts` — UI 変更時のツアー結合  
4. `components/BottomNav.tsx` — 情報アーキテクチャ  
5. 本ディレクトリの残り 5 資料  

---

## 7. 記載しないこと（方針）

- 「ユーザーが次に欲しそう」といった推測ニーズ
- 未調査のパフォーマンス数値
- コードに存在しない同期サーバー / マルチユーザー設計
|
