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
  "month",
  "tasks",
  "memo",
  "home",
  "settings",
];

export const TUTORIAL_TAB_LABELS: Record<
  TutorialTabId,
  string
> = {
  home: "ホーム",
  month: "月",
  tasks: "案件",
  memo: "メモ",
  settings: "設定",
};

const HOME_STEPS: GuidedStep[] = [
  {
    id: "home-intro",
    tab: "home",
    route: "/",
    target: '[data-tour="week-calendar"]',
    title: "ホーム",
    body: "週で日を選ぶと、この日の作業・メモ・仕事がまとまって見えます。",
    placement: "top",
    advance: {
      type: "click",
      tourId: "tutorial-advance-next",
    },
    cta: {
      label: "次へ",
      tourId: "tutorial-advance-next",
    },
  },
  {
    id: "home-date",
    tab: "home",
    route: "/",
    target: '[data-tour="home-date-picker"]',
    title: "日付ジャンプ",
    body: "右上の日付をタップすることで、好きな日に飛ぶことができます。",
    placement: "bottom",
    advance: {
      type: "click",
      tourId: "home-date-picker",
    },
    cta: {
      label: "次へ",
      tourId: "tutorial-advance-next",
    },
  },
];

const MONTH_STEPS: GuidedStep[] = [
  {
    id: "nav-month",
    tab: "month",
    route: "/",
    routeScope: "any-nav",
    target: '[data-tour="nav-month"]',
    title: "月表示へ",
    body: "下の「月」で、仕事と予定のカレンダーを開きます。",
    placement: "top",
    advance: { type: "click", tourId: "nav-month" },
    enterWhenReadyKey: "modal-closed",
  },
  {
    id: "month-add-template",
    tab: "month",
    route: "/month",
    target: '[data-tour="month-template-add"]',
    title: "テンプレを追加",
    body: "「仕事」か「予定」を選び、時間なしでも追加できます。",
    placement: "top",
    advance: {
      type: "click",
      tourId: "month-template-add",
    },
    advanceWhenReadyKey: "month-template-added",
    afterEnterKey: "month-template-prepare",
  },
  {
    id: "month-edit-enable",
    tab: "month",
    route: "/month",
    target: '[data-tour="month-edit-toggle"]',
    title: "編集ON",
    body: "編集をONにすると、カレンダーに載せられます。",
    placement: "auto",
    advance: {
      type: "click",
      tourId: "month-edit-toggle",
    },
    advanceWhenReadyKey: "month-edit-mode-on",
  },
  {
    id: "month-day-select",
    tab: "month",
    route: "/month",
    target: '[data-tour="month-calendar-day"]',
    title: "日付に載せる",
    body: "日付をタップ。仕事と予定は同じ日に両方付けられます。",
    placement: "auto",
    advance: {
      type: "click",
      tourId: "month-calendar-day",
    },
    enterWhenReadyKey: "month-edit-mode-on",
  },
];

const TASKS_STEPS: GuidedStep[] = [
  {
    id: "nav-projects",
    tab: "tasks",
    route: "/",
    routeScope: "any-nav",
    target: '[data-tour="nav-projects"]',
    title: "案件へ",
    body: "下の「案件」で、依頼と作業を管理します。",
    placement: "top",
    advance: { type: "click", tourId: "nav-projects" },
  },
  {
    id: "projects-add",
    tab: "tasks",
    route: "/projects",
    target: '[data-tour="projects-add"]',
    title: "案件を追加",
    body: "「＋」から依頼を追加します。",
    placement: "bottom",
    advance: { type: "click", tourId: "projects-add" },
  },
  {
    id: "project-new-create",
    tab: "tasks",
    route: "/projects/new",
    target: '[data-tour="create-project"]',
    title: "作成する",
    body: "サンプルには作業と予定日が入っています。「依頼作成」を押してください。",
    placement: "top",
    advance: {
      type: "click",
      tourId: "create-project",
    },
    afterEnterKey: "project-form-auto-fill",
  },
  {
    id: "open-created-project",
    tab: "tasks",
    route: "/projects",
    target: '[data-tour="project-card"]',
    title: "作成した案件を開く",
    body: "今作った案件のカードをタップして詳細へ進みます。",
    placement: "bottom",
    advance: { type: "click", tourId: "project-card" },
    enterWhenReadyKey: "tutorial-project-card-ready",
  },
  {
    id: "task-toggle",
    tab: "tasks",
    route: "/projects/:id",
    target: '[data-tour="project-task-toggle"]',
    title: "作業を完了",
    body: "タップで完了にできます。",
    placement: "bottom",
    advance: {
      type: "click",
      tourId: "project-task-toggle",
    },
  },
  {
    id: "project-reschedule",
    tab: "tasks",
    route: "/projects/:id",
    target:
      '[data-tour="project-schedule-reschedule-panel"]',
    title: "日程を組み直す",
    body: "①外す日（空けたい・過ぎた日）②足す日（まだ使っていない日）。未完了だけ動き、同日の作業はまとまったままです。",
    placement: "top",
    advance: {
      type: "click",
      tourId: "tutorial-advance-next",
    },
    cta: {
      label: "次へ",
      tourId: "tutorial-advance-next",
    },
    afterEnterKey: "tutorial-reschedule-open",
    enterWhenReadyKey:
      "project-schedule-reschedule-open",
  },
];

const MEMO_STEPS: GuidedStep[] = [
  {
    id: "nav-memos",
    tab: "memo",
    route: "/",
    routeScope: "any-nav",
    target: '[data-tour="nav-memos"]',
    title: "メモへ",
    body: "下の「メモ」で、思いつきを残せます。",
    placement: "top",
    advance: { type: "click", tourId: "nav-memos" },
  },
  {
    id: "memo-quick-add",
    tab: "memo",
    route: "/memos",
    routeExact: true,
    target: '[data-tour="memo-quick-compose"]',
    title: "メモを追加",
    body: "内容を書いて追加。ホームでは日付ごとに表示されます。",
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
    title: "設定へ",
    body: "テーマやバックアップは設定から。",
    placement: "auto",
    advance: { type: "click", tourId: "nav-settings" },
  },
  {
    id: "finish",
    tab: "settings",
    route: "/settings",
    target: '[data-tour="settings-guide"]',
    title: "準備完了",
    body: "月・案件（日程の組み直し）・メモ・ホームの流れは以上です。あとは自由に使ってみてください。",
    placement: "bottom",
    advance: { type: "manual" },
  },
];

export const TUTORIAL_STEPS_BY_TAB: Record<
  TutorialTabId,
  GuidedStep[]
> = {
  home: HOME_STEPS,
  month: MONTH_STEPS,
  tasks: TASKS_STEPS,
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

  if (currentIndex < 0) {
    return matching[0].id;
  }

  let bestForward: GuidedStep | null = null;
  let bestForwardIndex = Number.POSITIVE_INFINITY;

  for (const step of matching) {
    const index = GUIDED_STEPS.findIndex(
      (item) => item.id === step.id
    );

    if (index >= currentIndex && index < bestForwardIndex) {
      bestForward = step;
      bestForwardIndex = index;
    }
  }

  if (bestForward) {
    return bestForward.id;
  }

  return currentStepId;
}
