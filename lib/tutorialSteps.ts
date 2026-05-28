import type { TutorialTabId } from "@/lib/storage";

export type GuidedAdvance =
  | { type: "click"; tourId: string }
  | { type: "route"; pathname: string }
  | { type: "manual" };

export type GuidedCta = {
  label: string;
  tourId: string;
};

export type GuidedStep = {
  id: string;
  tab: TutorialTabId;
  route: string;
  target: string;
  title: string;
  body: string;
  placement?: "top" | "bottom" | "auto";
  /** true のとき route は pathname と完全一致のみ */
  routeExact?: boolean;
  /** 下ナビが表示される主要画面ならどこでも有効 */
  routeScope?: "any-nav";
  advance: GuidedAdvance;
  cta?: GuidedCta;
  enterWhenReadyKey?: string;
  advanceWhenReadyKey?: string;
  beforeEnterKey?: string;
  afterEnterKey?: string;
  beforeLeaveKey?: string;
};

export const TUTORIAL_TAB_ORDER: TutorialTabId[] = [
  "tasks",
  "month",
  "memo",
  "settings",
];

export const TUTORIAL_TAB_LABELS: Record<
  TutorialTabId,
  string
> = {
  tasks: "案件・作業",
  month: "月表示",
  memo: "メモ",
  settings: "設定",
};

const TASKS_STEPS: GuidedStep[] = [
  {
    id: "nav-projects",
    tab: "tasks",
    route: "/",
    target: '[data-tour="nav-projects"]',
    title: "案件タブを開いてみよう",
    body: "下の「案件」を押して、一覧を開きます。",
    placement: "top",
    advance: { type: "click", tourId: "nav-projects" },
  },
  {
    id: "projects-add",
    tab: "tasks",
    route: "/projects",
    target: '[data-tour="projects-add"]',
    title: "＋を押してみよう",
    body: "「＋」を押して、案件追加画面を開きます。",
    placement: "bottom",
    advance: { type: "click", tourId: "projects-add" },
  },
  {
    id: "project-new-intro",
    tab: "tasks",
    route: "/projects/new",
    target: '[data-tour="tutorial-fill-example"]',
    title: "入力例を見てみよう",
    body: "「入力例を見る」を押すと、サンプルが自動入力されます。",
    placement: "bottom",
    advance: { type: "click", tourId: "tutorial-fill-example" },
    advanceWhenReadyKey: "project-form-filled",
  },
  {
    id: "project-new-filled",
    tab: "tasks",
    route: "/projects/new",
    target: '[data-tour="create-project"]',
    title: "作成してみよう",
    body: "「依頼作成」を押して、案件を作成します。",
    placement: "top",
    advance: { type: "click", tourId: "create-project" },
  },
  {
    id: "open-created-project",
    tab: "tasks",
    route: "/projects",
    target: '[data-tour="project-card"]',
    title: "作った案件を開いてみよう",
    body: "一番上のカードを押して、詳細を開きます。",
    placement: "bottom",
    advance: { type: "click", tourId: "project-card" },
  },
  {
    id: "task-toggle",
    tab: "tasks",
    route: "/projects/:id",
    target: '[data-tour="project-task-toggle"]',
    title: "作業はタップで完了できます",
    body: "試しに1つ、作業をタップしてみよう。",
    placement: "bottom",
    advance: { type: "click", tourId: "project-task-toggle" },
  },
  {
    id: "task-edit-open",
    tab: "tasks",
    route: "/projects/:id",
    target: '[data-tour="project-task-edit"]',
    title: "後から編集もできます",
    body: "右の「編集」を押して、名前や日付を変えられます。",
    placement: "bottom",
    advance: { type: "click", tourId: "project-task-edit" },
  },
  {
    id: "task-edit-save",
    tab: "tasks",
    route: "/projects/:id",
    target: '[data-tour="project-task-save"]',
    title: "編集を確定しよう",
    body: "保存を押して編集を確定しよう",
    placement: "top",
    advance: { type: "click", tourId: "project-task-save" },
    advanceWhenReadyKey: "modal-closed",
  },
];

const MONTH_STEPS: GuidedStep[] = [
  {
    id: "nav-month",
    tab: "month",
    route: "/",
    routeScope: "any-nav",
    target: '[data-tour="nav-month"]',
    title: "月表示へ移動しよう",
    body: "下の「月」を押して移動します。",
    placement: "top",
    advance: { type: "click", tourId: "nav-month" },
    enterWhenReadyKey: "modal-closed",
  },
  {
    id: "month-add-template",
    tab: "month",
    route: "/month",
    target: '[data-tour="month-template-add"]',
    title: "仕事を追加しよう",
    body: "「追加」を押して、シフトのテンプレを作ります。",
    placement: "auto",
    advance: { type: "click", tourId: "month-template-add" },
    advanceWhenReadyKey: "month-template-added",
    afterEnterKey: "month-template-prepare",
  },
  {
    id: "month-edit-enable",
    tab: "month",
    route: "/month",
    target: '[data-tour="month-edit-toggle"]',
    title: "編集をONにしよう",
    body: "まずは編集をONにしてみよう",
    placement: "auto",
    advance: { type: "click", tourId: "month-edit-toggle" },
    advanceWhenReadyKey: "month-edit-mode-on",
  },
  {
    id: "month-day-select",
    tab: "month",
    route: "/month",
    target: '[data-tour="month-calendar-day"]',
    title: "日付を選んでみよう",
    body: "日付を押すと予定を追加できます",
    placement: "auto",
    advance: { type: "click", tourId: "month-calendar-day" },
    enterWhenReadyKey: "month-edit-mode-on",
  },
];

const MEMO_STEPS: GuidedStep[] = [
  {
    id: "nav-memos",
    tab: "memo",
    route: "/",
    routeScope: "any-nav",
    target: '[data-tour="nav-memos"]',
    title: "メモタブを開こう",
    body: "下の「メモ」を押して、メモ一覧を開きます。",
    placement: "top",
    advance: { type: "click", tourId: "nav-memos" },
  },
  {
    id: "memo-quick-add",
    tab: "memo",
    route: "/memos",
    routeExact: true,
    target: '[data-tour="memo-quick-add"]',
    title: "メモを追加しよう",
    body: "内容を確認して「追加」を押して保存します。",
    placement: "auto",
    advance: {
      type: "click",
      tourId: "memo-quick-add",
    },
    afterEnterKey: "memo-form-prepare",
  },
];

const SETTINGS_STEPS: GuidedStep[] = [
  {
    id: "nav-settings",
    tab: "settings",
    route: "/",
    routeScope: "any-nav",
    target: '[data-tour="nav-settings"]',
    title: "設定を開いてみよう",
    body: "下の「設定」を押して移動します。",
    placement: "auto",
    advance: { type: "click", tourId: "nav-settings" },
  },
  {
    id: "finish",
    tab: "settings",
    route: "/settings",
    target: '[data-tour="settings-guide"]',
    title: "完了",
    body: "あとは自由に触ってみてください。",
    placement: "bottom",
    advance: { type: "manual" },
  },
];

export const TUTORIAL_STEPS_BY_TAB: Record<
  TutorialTabId,
  GuidedStep[]
> = {
  tasks: TASKS_STEPS,
  month: MONTH_STEPS,
  memo: MEMO_STEPS,
  settings: SETTINGS_STEPS,
};

export const GUIDED_STEPS: GuidedStep[] =
  TUTORIAL_TAB_ORDER.flatMap(
    (tab) => TUTORIAL_STEPS_BY_TAB[tab]
  );

export function getTutorialTabForStep(
  stepId: string
): TutorialTabId | null {
  const step = GUIDED_STEPS.find(
    (item) => item.id === stepId
  );

  return step?.tab ?? null;
}

export function getStepsForTab(
  tab: TutorialTabId
): GuidedStep[] {
  return TUTORIAL_STEPS_BY_TAB[tab] ?? [];
}

export function getFirstStepIdForTab(
  tab: TutorialTabId
): string | null {
  return getStepsForTab(tab)[0]?.id ?? null;
}

export function getNextTab(
  tab: TutorialTabId
): TutorialTabId | null {
  const index = TUTORIAL_TAB_ORDER.indexOf(tab);

  if (index < 0) {
    return null;
  }

  return TUTORIAL_TAB_ORDER[index + 1] ?? null;
}

export function getStepProgress(stepId: string | null): {
  tab: TutorialTabId | null;
  tabLabel: string;
  current: number;
  total: number;
} {
  if (!stepId) {
    return {
      tab: null,
      tabLabel: "",
      current: 0,
      total: 0,
    };
  }

  const tab = getTutorialTabForStep(stepId);

  if (!tab) {
    return {
      tab: null,
      tabLabel: "",
      current: 0,
      total: 0,
    };
  }

  const steps = getStepsForTab(tab);
  const index = steps.findIndex(
    (step) => step.id === stepId
  );

  return {
    tab,
    tabLabel: TUTORIAL_TAB_LABELS[tab],
    current: index >= 0 ? index + 1 : 0,
    total: steps.length,
  };
}

export function isTabFinished(
  tab: TutorialTabId,
  progress: Partial<
    Record<
      string,
      { completed?: boolean; skipped?: boolean }
    >
  >
): boolean {
  const state = progress[tab];
  return Boolean(state?.completed || state?.skipped);
}

/** チュートorial step の route が現在 pathname と一致するか */
export function matchesGuidedRoute(
  stepRoute: string,
  pathname: string,
  exact = false
): boolean {
  if (stepRoute === pathname) {
    return true;
  }

  if (exact) {
    return false;
  }

  if (stepRoute === "/projects/:id") {
    return (
      /^\/projects\/[^/]+$/.test(pathname) &&
      pathname !== "/projects/new"
    );
  }

  if (stepRoute === "/memos") {
    return (
      pathname === "/memos" ||
      pathname.startsWith("/memos/")
    );
  }

  return false;
}

export function matchesAnyNavRoute(
  pathname: string
): boolean {
  if (pathname === "/") {
    return true;
  }

  if (pathname.startsWith("/projects")) {
    return true;
  }

  if (pathname.startsWith("/memos")) {
    return true;
  }

  if (pathname === "/month") {
    return true;
  }

  if (pathname === "/settings") {
    return true;
  }

  return false;
}

export function matchesGuidedStepRoute(
  step: Pick<
    GuidedStep,
    "route" | "routeExact" | "routeScope"
  >,
  pathname: string
): boolean {
  if (step.routeScope === "any-nav") {
    return matchesAnyNavRoute(pathname);
  }

  return matchesGuidedRoute(
    step.route,
    pathname,
    step.routeExact
  );
}

export function getGuidedNavigateTargetForStep(
  step: Pick<
    GuidedStep,
    "route" | "routeExact" | "routeScope"
  >,
  pathname: string
): string | null {
  if (matchesGuidedStepRoute(step, pathname)) {
    return null;
  }

  if (step.routeScope === "any-nav") {
    return "/";
  }

  return getGuidedNavigateTarget(
    step.route,
    pathname,
    step.routeExact
  );
}

export function getGuidedNavigateTarget(
  stepRoute: string,
  pathname: string,
  exact = false
): string | null {
  if (matchesGuidedRoute(stepRoute, pathname, exact)) {
    return null;
  }

  if (stepRoute.includes(":")) {
    return null;
  }

  return stepRoute;
}

/** Manual route jump recovery: pick nearest valid step for pathname. */
export function recoverStepForPathname(
  pathname: string,
  currentStepId: string | null
): string | null {
  const matching = GUIDED_STEPS.filter((step) =>
    matchesGuidedStepRoute(step, pathname)
  );

  if (matching.length === 0) {
    return (
      currentStepId ??
      GUIDED_STEPS[0]?.id ??
      null
    );
  }

  if (!currentStepId) {
    return matching[0].id;
  }

  const currentIndex = GUIDED_STEPS.findIndex(
    (step) => step.id === currentStepId
  );

  let best: GuidedStep | null = null;
  let bestIndex = Number.POSITIVE_INFINITY;

  for (const step of matching) {
    const index = GUIDED_STEPS.findIndex(
      (item) => item.id === step.id
    );

    if (index < currentIndex - 1) {
      continue;
    }

    if (index < bestIndex) {
      best = step;
      bestIndex = index;
    }
  }

  return best?.id ?? matching[0].id;
}
