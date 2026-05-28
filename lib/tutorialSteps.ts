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
  route: string;
  target: string;
  title: string;
  body: string;
  placement?: "top" | "bottom" | "auto";
  advance: GuidedAdvance;
  cta?: GuidedCta;
  /** Commit pending step only when this ready check passes. */
  enterWhenReadyKey?: string;
  /** After click advance, wait for this ready check before entering next step. */
  advanceWhenReadyKey?: string;
  beforeEnterKey?: string;
  afterEnterKey?: string;
  beforeLeaveKey?: string;
};

/** チュートリアル step の route が現在 pathname と一致するか */
export function matchesGuidedRoute(
  stepRoute: string,
  pathname: string
): boolean {
  if (stepRoute === pathname) {
    return true;
  }

  if (stepRoute === "/projects/:id") {
    return (
      /^\/projects\/[^/]+$/.test(pathname) &&
      pathname !== "/projects/new"
    );
  }

  return false;
}

export function getGuidedNavigateTarget(
  stepRoute: string,
  pathname: string
): string | null {
  if (matchesGuidedRoute(stepRoute, pathname)) {
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
    matchesGuidedRoute(step.route, pathname)
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

export const GUIDED_STEPS: GuidedStep[] = [
  {
    id: "nav-projects",
    route: "/",
    target: '[data-tour="nav-projects"]',
    title: "案件タブを開いてみよう",
    body: "下の「案件」を押して、一覧を開きます。",
    placement: "top",
    advance: { type: "click", tourId: "nav-projects" },
  },
  {
    id: "projects-add",
    route: "/projects",
    target: '[data-tour="projects-add"]',
    title: "＋を押してみよう",
    body: "「＋」を押して、案件追加画面を開きます。",
    placement: "bottom",
    advance: { type: "click", tourId: "projects-add" },
  },
  {
    id: "project-new-intro",
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
    route: "/projects/new",
    target: '[data-tour="create-project"]',
    title: "作成してみよう",
    body: "「依頼作成」を押して、案件を作成します。",
    placement: "top",
    advance: { type: "click", tourId: "create-project" },
  },
  {
    id: "open-created-project",
    route: "/projects",
    target: '[data-tour="project-card"]',
    title: "作った案件を開いてみよう",
    body: "一番上のカードを押して、詳細を開きます。",
    placement: "bottom",
    advance: { type: "click", tourId: "project-card" },
  },
  {
    id: "task-toggle",
    route: "/projects/:id",
    target: '[data-tour="project-task-toggle"]',
    title: "作業はタップで完了できます",
    body: "試しに1つ、作業をタップしてみよう。",
    placement: "bottom",
    advance: { type: "click", tourId: "project-task-toggle" },
  },
  {
    id: "task-edit-open",
    route: "/projects/:id",
    target: '[data-tour="project-task-edit"]',
    title: "後から編集もできます",
    body: "右の「編集」を押して、名前や日付を変えられます。",
    placement: "bottom",
    advance: { type: "click", tourId: "project-task-edit" },
  },
  {
    id: "task-edit-save",
    route: "/projects/:id",
    target: '[data-tour="project-task-save"]',
    title: "編集を確定しよう",
    body: "保存を押して編集を確定しよう",
    placement: "top",
    advance: { type: "click", tourId: "project-task-save" },
    advanceWhenReadyKey: "modal-closed",
  },
  {
    id: "nav-month",
    route: "/projects/:id",
    target: '[data-tour="nav-month"]',
    title: "月表示へ移動しよう",
    body: "下の「月」を押して移動します。",
    placement: "top",
    advance: { type: "click", tourId: "nav-month" },
    enterWhenReadyKey: "modal-closed",
  },
  {
    id: "month-add-template",
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
    route: "/month",
    target: '[data-tour="month-calendar-day"]',
    title: "日付を選んでみよう",
    body: "日付を押すと予定を追加できます",
    placement: "auto",
    advance: { type: "click", tourId: "month-calendar-day" },
    enterWhenReadyKey: "month-edit-mode-on",
  },
  {
    id: "nav-settings",
    route: "/month",
    target: '[data-tour="nav-settings"]',
    title: "設定を開いてみよう",
    body: "下の「設定」を押して移動します。",
    placement: "top",
    advance: { type: "click", tourId: "nav-settings" },
  },
  {
    id: "finish",
    route: "/settings",
    target: '[data-tour="settings-guide"]',
    title: "完了",
    body: "あとは自由に触ってみてください。",
    placement: "bottom",
    advance: { type: "manual" },
  },
];
