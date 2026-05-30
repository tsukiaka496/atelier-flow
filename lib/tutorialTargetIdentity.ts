import {
  findInteractiveTarget,
  isTargetInteractive,
} from "@/lib/tutorialTarget";
import { getTutorialCreatedProjectId } from "@/lib/tutorialCreatedProject";
import { getTargetVisibleRatio } from "@/lib/tutorialPositioning";

type PinnedTarget = {
  selector: string;
  instanceId: string;
};

let pinnedTarget: PinnedTarget | null = null;

export function pinTourTarget(
  selector: string,
  instanceId: string
) {
  pinnedTarget = { selector, instanceId };
}

export function clearPinnedTourTarget() {
  pinnedTarget = null;
}

export function getPinnedTourTarget(): PinnedTarget | null {
  return pinnedTarget;
}

function resolveTutorialProjectCardTarget(): HTMLElement | null {
  const projectId =
    getTutorialCreatedProjectId();

  if (!projectId) {
    return null;
  }

  const selector = `a[data-tour="project-card"][href="/projects/${projectId}"]`;
  const element = document.querySelector(
    selector
  );

  if (
    element instanceof HTMLElement &&
    isTargetInteractive(element)
  ) {
    const instanceId = element.getAttribute(
      "data-tour-instance-id"
    );

    if (instanceId) {
      pinTourTarget(
        '[data-tour="project-card"]',
        instanceId
      );
    }

    return element;
  }

  return null;
}

function resolveMonthCalendarDayTarget(): HTMLElement | null {
  const cells = document.querySelectorAll(
    "[data-tour-day]"
  );

  for (const cell of cells) {
    if (!(cell instanceof HTMLElement)) {
      continue;
    }

    if (!isTargetInteractive(cell)) {
      continue;
    }

    if (getTargetVisibleRatio(cell) < 0.95) {
      continue;
    }

    return cell;
  }

  return null;
}

export function resolveTourTarget(
  selector: string
): HTMLElement | null {
  if (selector === '[data-tour="project-card"]') {
    const tutorialCard =
      resolveTutorialProjectCardTarget();

    if (tutorialCard) {
      return tutorialCard;
    }
  }

  if (selector === '[data-tour="month-calendar-day"]') {
    const monthDay = resolveMonthCalendarDayTarget();

    if (monthDay) {
      const instanceId =
        monthDay.getAttribute(
          "data-tour-instance-id"
        );

      if (instanceId) {
        pinTourTarget(selector, instanceId);
      }

      return monthDay;
    }

    return null;
  }

  if (
    pinnedTarget &&
    pinnedTarget.selector === selector
  ) {
    const pinned = document.querySelector(
      `[data-tour-instance-id="${pinnedTarget.instanceId}"]`
    );

    if (
      pinned instanceof HTMLElement &&
      isTargetInteractive(pinned)
    ) {
      return pinned;
    }
  }

  const element = findInteractiveTarget(selector);

  if (!element) {
    return null;
  }

  const instanceId = element.getAttribute(
    "data-tour-instance-id"
  );

  if (instanceId) {
    pinTourTarget(selector, instanceId);
  }

  return element;
}
