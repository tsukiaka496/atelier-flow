import type {
  OnboardingSettings,
  TutorialTabId,
  TutorialTabProgress,
} from "@/lib/storage";
import {
  getFirstStepIdForTab,
  getStepsForTab,
  TUTORIAL_TAB_ORDER,
} from "@/lib/tutorialSteps";

export function getDefaultTabProgress(): TutorialTabProgress {
  return {
    completed: false,
    skipped: false,
  };
}

export function getTabProgressState(
  settings: OnboardingSettings,
  tab: TutorialTabId
): TutorialTabProgress {
  return (
    settings.tutorialTabProgress?.[tab] ??
    getDefaultTabProgress()
  );
}

export function isTabDone(
  settings: OnboardingSettings,
  tab: TutorialTabId
): boolean {
  const state = getTabProgressState(
    settings,
    tab
  );

  return state.completed || state.skipped;
}

export function areAllTabsDone(
  settings: OnboardingSettings
): boolean {
  return TUTORIAL_TAB_ORDER.every((tab) =>
    isTabDone(settings, tab)
  );
}

export function findNextAvailableTab(
  settings: OnboardingSettings,
  afterTab: TutorialTabId | null
): TutorialTabId | null {
  const startIndex =
    afterTab === null
      ? 0
      : TUTORIAL_TAB_ORDER.indexOf(afterTab) + 1;

  for (
    let index = startIndex;
    index < TUTORIAL_TAB_ORDER.length;
    index += 1
  ) {
    const tab = TUTORIAL_TAB_ORDER[index];

    if (!isTabDone(settings, tab)) {
      return tab;
    }
  }

  return null;
}

export function findFirstIncompleteTab(
  settings: OnboardingSettings
): TutorialTabId | null {
  return findNextAvailableTab(settings, null);
}

export function getTabProgressSummary(
  settings: OnboardingSettings,
  currentStepId: string | null,
  currentTab: TutorialTabId | null
) {
  return TUTORIAL_TAB_ORDER.map((tab) => {
    const total = getStepsForTab(tab).length;
    const state = getTabProgressState(
      settings,
      tab
    );

    if (state.skipped) {
      return {
        tab,
        current: 0,
        total,
        skipped: true,
        completed: false,
      };
    }

    if (state.completed) {
      return {
        tab,
        current: total,
        total,
        skipped: false,
        completed: true,
      };
    }

    if (
      currentTab === tab &&
      currentStepId
    ) {
      const index = getStepsForTab(tab).findIndex(
        (step) => step.id === currentStepId
      );

      return {
        tab,
        current: index >= 0 ? index + 1 : 0,
        total,
        skipped: false,
        completed: false,
      };
    }

    return {
      tab,
      current: 0,
      total,
      skipped: false,
      completed: false,
    };
  });
}

export function mergeTabProgress(
  settings: OnboardingSettings,
  tab: TutorialTabId,
  patch: Partial<TutorialTabProgress>
): OnboardingSettings {
  return {
    ...settings,
    tutorialTabProgress: {
      ...settings.tutorialTabProgress,
      [tab]: {
        ...getTabProgressState(settings, tab),
        ...patch,
      },
    },
  };
}

export function getStartStepForTab(
  tab: TutorialTabId
): string | null {
  return getFirstStepIdForTab(tab);
}
