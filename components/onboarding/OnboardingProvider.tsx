"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  getDefaultOnboarding,
  getOnboarding,
  saveOnboarding,
  subscribeOnboardingChanged,
  type OnboardingSettings,
} from "@/lib/storage";
import {
  executeTourAction,
  isTutorialReady,
  registerTutorialAction,
  registerTutorialReadyCheck,
  runTutorialHook,
} from "@/lib/tutorialActionRegistry";
import {
  cancelMeasurementQueue,
  enqueueMeasurement,
} from "@/lib/tutorialMeasurementQueue";
import {
  getGuidedNavigateTargetForStep,
  getStepProgress,
  getTutorialTabForStep,
  GUIDED_STEPS,
  matchesGuidedStepRoute,
  recoverStepForPathname,
  type GuidedStep,
} from "@/lib/tutorialSteps";
import type { TutorialTabId } from "@/lib/storage";
import {
  areAllTabsDone,
  findFirstIncompleteTab,
  findNextAvailableTab,
  getStartStepForTab,
  mergeTabProgress,
} from "@/lib/tutorialProgress";
import {
  TUTORIAL_TAB_ORDER,
} from "@/lib/tutorialSteps";

function isTutorialTabId(
  value: unknown
): value is TutorialTabId {
  return (
    typeof value === "string" &&
    TUTORIAL_TAB_ORDER.includes(
      value as TutorialTabId
    )
  );
}

function resolveTutorialNavigation(
  step: GuidedStep,
  pathname: string
): string | null {
  if (matchesGuidedStepRoute(step, pathname)) {
    return null;
  }

  const direct = getGuidedNavigateTargetForStep(
    step,
    pathname
  );

  if (direct) {
    return direct;
  }

  if (step.route === "/projects/:id") {
    const projects = getProjectsRepo();

    if (projects.length > 0) {
      return `/projects/${projects[0].id}`;
    }

    return "/projects";
  }

  const routeHome: Record<string, string> = {
    "/": "/",
    "/projects": "/projects",
    "/projects/new": "/projects/new",
    "/memos": "/memos",
    "/month": "/month",
    "/settings": "/settings",
  };

  return routeHome[step.route] ?? null;
}
import {
  endTutorialSession,
  isTutorialSessionActive,
  loadTutorialSessionSnapshot,
  persistTutorialSessionSnapshot,
  startTutorialSession,
  type TutorialSessionStatus,
} from "@/lib/tutorialSession";
import { logTutorialTimeline } from "@/lib/tutorialTimeline";
import {
  clearPinnedTourTarget,
  getPinnedTourTarget,
  pinTourTarget,
  resolveTourTarget,
} from "@/lib/tutorialTargetIdentity";
import {
  getTargetVisibleRatio,
  isTargetActionable,
  isValidSpotlightRect,
  measureSpotlightRect,
  prefersReducedMotion,
  scrollTourTargetIntoView,
} from "@/lib/tutorialPositioning";
import { waitForElement } from "@/lib/waitForElement";

import TutorialOverlay from "@/components/onboarding/TutorialOverlay";
import WelcomeOverlay from "@/components/onboarding/WelcomeOverlay";
import {
  getProjectsRepo,
  notifyProjectsChanged,
} from "@/lib/projectsRepo";

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type TutorialStatus = TutorialSessionStatus;

type RunTourActionOptions = {
  skipExecute?: boolean;
};

type OnboardingContextValue = {
  settings: OnboardingSettings;
  shouldShowHints: boolean;
  isTutorialActive: boolean;
  currentStepId: string | null;
  tutorialStatus: TutorialStatus;
  isTransitioning: boolean;
  isCompleting: boolean;
  registerTourAction: (tourId: string) => void;
  runTourAction: (
    tourId: string,
    options?: RunTourActionOptions
  ) => void;
  setTutorialModalOpen: (open: boolean) => void;
  bumpTutorialReady: () => void;
  startTutorial: (tab?: TutorialTabId) => void;
  startTutorialTab: (tab: TutorialTabId) => void;
  skipTutorial: () => void;
  skipTutorialTab: () => void;
  skipTutorialTabById: (tab: TutorialTabId) => void;
  completeTutorial: () => void;
  tutorialStepProgress: {
    current: number;
    total: number;
    tabLabel: string;
  };
  refreshOnboarding: () => void;
};

const RECT_EPSILON = 2;
const TARGET_MISSING_MS = 3000;
const MEASURE_DEBOUNCE_MS = 48;
const ACTION_DEDUPE_MS = 300;
const COMPLETE_FADE_MS = 600;
/** 次ステップへ進む前の短い間（画面は暗転させない） */
const STEP_PAUSE_MS = 140;

const NAV_TOUR_IDS = new Set([
  "nav-home",
  "nav-projects",
  "nav-memos",
  "nav-month",
  "nav-settings",
]);

const OnboardingContext =
  createContext<OnboardingContextValue | null>(
    null
  );

export function useOnboarding() {
  const context = useContext(
    OnboardingContext
  );

  if (!context) {
    throw new Error(
      "useOnboarding must be used within OnboardingProvider"
    );
  }

  return context;
}

function measureElementRect(
  element: HTMLElement
): TargetRect | null {
  return measureSpotlightRect(element);
}

function rectsNearlyEqual(
  a: TargetRect,
  b: TargetRect
): boolean {
  return (
    Math.abs(a.top - b.top) < RECT_EPSILON &&
    Math.abs(a.left - b.left) < RECT_EPSILON &&
    Math.abs(a.width - b.width) < RECT_EPSILON &&
    Math.abs(a.height - b.height) < RECT_EPSILON
  );
}

function matchesStepAdvanceTourId(
  step: GuidedStep,
  tourId: string
): boolean {
  if (step.advance.type !== "click") {
    return false;
  }

  return (
    step.advance.tourId === tourId ||
    step.cta?.tourId === tourId
  );
}

export default function OnboardingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const measureCleanupRef = useRef<(() => void) | null>(
    null
  );
  const currentStepIdRef = useRef<string | null>(null);
  const lastActionRef = useRef<{
    tourId: string;
    at: number;
  } | null>(null);
  const sessionHydratedRef = useRef(false);
  const completeTimeoutRef = useRef<number | null>(
    null
  );
  const stepAdvanceTimeoutRef = useRef<number | null>(
    null
  );

  const settings = useSyncExternalStore(
    subscribeOnboardingChanged,
    getOnboarding,
    getDefaultOnboarding
  );

  const [currentStepId, setCurrentStepId] =
    useState<string | null>(null);

  const [pendingStepId, setPendingStepId] =
    useState<string | null>(null);

  const [pendingActionTourId, setPendingActionTourId] =
    useState<string | null>(null);

  const [targetRect, setTargetRect] =
    useState<TargetRect | null>(null);

  const [targetMissing, setTargetMissing] =
    useState(false);

  const [targetVisibleRatio, setTargetVisibleRatio] =
    useState(1);

  const [targetRetryKey, setTargetRetryKey] =
    useState(0);

  const [readyTick, setReadyTick] =
    useState(0);

  const [isTransitioning, setIsTransitioning] =
    useState(false);

  const [isCompleting, setIsCompleting] =
    useState(false);

  const [heldTargetRect, setHeldTargetRect] =
    useState<TargetRect | null>(null);

  const [fadeStep, setFadeStep] =
    useState<GuidedStep | null>(null);

  const [tutorialModalOpen, setTutorialModalOpenState] =
    useState(false);

  useEffect(() => {
    currentStepIdRef.current = currentStepId;
  }, [currentStepId]);

  const tutorialStatus: TutorialStatus =
    tutorialModalOpen ? "modal-open" : "idle";

  const refreshOnboarding =
    useCallback(() => {}, []);

  const bumpTutorialReady = useCallback(() => {
    setReadyTick((tick) => tick + 1);
  }, []);

  const runMeasureCleanup = useCallback(() => {
    measureCleanupRef.current?.();
    measureCleanupRef.current = null;
    cancelMeasurementQueue();
  }, []);

  const applyTargetRect = useCallback(
    (next: TargetRect | null) => {
      if (next && !isValidSpotlightRect(next)) {
        return;
      }

      setTargetRect((prev) => {
        if (!next) {
          return prev;
        }

        if (prev && rectsNearlyEqual(prev, next)) {
          return prev;
        }

        setHeldTargetRect(next);
        return next;
      });
    },
    []
  );

  const displayedTargetRect = useMemo(() => {
    if (isValidSpotlightRect(targetRect)) {
      return targetRect;
    }

    if (isValidSpotlightRect(heldTargetRect)) {
      return heldTargetRect;
    }

    return null;
  }, [heldTargetRect, targetRect]);

  const persistSession = useCallback(() => {
    if (!isTutorialSessionActive()) {
      return;
    }

    const pinned = getPinnedTourTarget();

    persistTutorialSessionSnapshot({
      active: true,
      currentStepId: currentStepIdRef.current,
      pendingStepId,
      tutorialStatus,
      pathname,
      pinnedSelector: pinned?.selector ?? null,
      pinnedInstanceId: pinned?.instanceId ?? null,
    });
  }, [pathname, pendingStepId, tutorialStatus]);

  const clearStepAdvanceTimeout = useCallback(() => {
    if (stepAdvanceTimeoutRef.current) {
      window.clearTimeout(
        stepAdvanceTimeoutRef.current
      );
      stepAdvanceTimeoutRef.current = null;
    }
  }, []);

  const resetTutorialRuntime = useCallback(() => {
    clearStepAdvanceTimeout();
    runMeasureCleanup();
    clearPinnedTourTarget();
    setCurrentStepId(null);
    setPendingStepId(null);
    setPendingActionTourId(null);
    setTargetRect(null);
    setTargetMissing(false);
    setTargetVisibleRatio(1);
    setTutorialModalOpenState(false);
    setIsTransitioning(false);
    setHeldTargetRect(null);
    document.documentElement.classList.remove(
      "tutorial-active"
    );
  }, [clearStepAdvanceTimeout, runMeasureCleanup]);

  useEffect(() => {
    return registerTutorialReadyCheck(
      "modal-closed",
      () => !tutorialModalOpen
    );
  }, [tutorialModalOpen]);

  useEffect(() => {
    return registerTutorialAction(
      "tutorial-advance-next",
      () => {}
    );
  }, []);

  useEffect(() => {
    if (sessionHydratedRef.current) {
      return;
    }

    sessionHydratedRef.current = true;

    if (!isTutorialSessionActive()) {
      return;
    }

    const snapshot = loadTutorialSessionSnapshot();

    if (!snapshot) {
      return;
    }

    logTutorialTimeline(
      "session restore",
      snapshot.currentStepId ?? "none"
    );

    let recovered = recoverStepForPathname(
      pathname,
      snapshot.currentStepId
    );

    if (
      recovered &&
      recovered !== snapshot.currentStepId
    ) {
      const recoveredStep =
        GUIDED_STEPS.find(
          (item) => item.id === recovered
        ) ?? null;

      if (
        recoveredStep?.enterWhenReadyKey &&
        !isTutorialReady(
          recoveredStep.enterWhenReadyKey
        )
      ) {
        recovered = snapshot.currentStepId;
      }
    }

    requestAnimationFrame(() => {
      if (recovered) {
        setCurrentStepId(recovered);
      }

      if (snapshot.pendingStepId) {
        setPendingStepId(snapshot.pendingStepId);
      }

      if (snapshot.tutorialStatus === "modal-open") {
        setTutorialModalOpenState(true);
      }
    });

    if (
      snapshot.pinnedSelector &&
      snapshot.pinnedInstanceId
    ) {
      pinTourTarget(
        snapshot.pinnedSelector,
        snapshot.pinnedInstanceId
      );
      logTutorialTimeline(
        "target resolved",
        snapshot.pinnedInstanceId
      );
    }
  }, [pathname]);

  useEffect(() => {
    if (
      !isTutorialSessionActive() ||
      !currentStepId ||
      pendingStepId
    ) {
      return;
    }

    const step =
      GUIDED_STEPS.find(
        (item) => item.id === currentStepId
      ) ?? null;

    if (
      step &&
      !matchesGuidedStepRoute(step, pathname)
    ) {
      let recovered = recoverStepForPathname(
        pathname,
        currentStepId
      );

      if (recovered && recovered !== currentStepId) {
        const recoveredStep =
          GUIDED_STEPS.find(
            (item) => item.id === recovered
          ) ?? null;

        if (
          recoveredStep?.enterWhenReadyKey &&
          !isTutorialReady(
            recoveredStep.enterWhenReadyKey
          )
        ) {
          recovered = currentStepId;
        }
      }

      if (recovered && recovered !== currentStepId) {
        logTutorialTimeline(
          "route recovery",
          recovered
        );
        requestAnimationFrame(() => {
          setIsTransitioning(true);
          setCurrentStepId(recovered);
          setPendingStepId(null);
        });
        return;
      }

      const navTarget =
        getGuidedNavigateTargetForStep(
          step,
          pathname
        ) ??
        resolveTutorialNavigation(
          step,
          pathname
        );

      if (navTarget) {
        logTutorialTimeline(
          "route redirect",
          navTarget
        );
        setIsTransitioning(true);
        setPendingStepId(currentStepId);
        router.push(navTarget);
      }
    }
  }, [
    currentStepId,
    pathname,
    pendingStepId,
    router,
  ]);

  useEffect(() => {
    persistSession();
  }, [
    currentStepId,
    pendingStepId,
    pathname,
    persistSession,
    tutorialStatus,
  ]);

  const finalizeComplete = useCallback(() => {
    const current =
      currentStepIdRef.current
        ? GUIDED_STEPS.find(
            (step) =>
              step.id === currentStepIdRef.current
          ) ?? null
        : null;

    runTutorialHook(current?.beforeLeaveKey);

    let nextSettings = getOnboarding();

    for (const tab of TUTORIAL_TAB_ORDER) {
      nextSettings = mergeTabProgress(
        nextSettings,
        tab,
        { completed: true }
      );
    }

    saveOnboarding({
      ...nextSettings,
      tutorialCompleted: true,
      tutorialCompletedAt: new Date().toISOString(),
    });
    endTutorialSession();
    refreshOnboarding();
    resetTutorialRuntime();
    setIsCompleting(false);
    setFadeStep(null);
    logTutorialTimeline("tutorial complete");
  }, [refreshOnboarding, resetTutorialRuntime]);

  const completeTutorial = useCallback(() => {
    if (isCompleting) {
      return;
    }

    clearStepAdvanceTimeout();

    const step =
      GUIDED_STEPS.find(
        (item) =>
          item.id === currentStepIdRef.current
      ) ?? null;

    setFadeStep(step);
    setIsCompleting(true);
    logTutorialTimeline("complete fade start");

    const delay = prefersReducedMotion()
      ? 0
      : COMPLETE_FADE_MS;

    if (completeTimeoutRef.current) {
      window.clearTimeout(completeTimeoutRef.current);
    }

    completeTimeoutRef.current = window.setTimeout(() => {
      completeTimeoutRef.current = null;
      finalizeComplete();
    }, delay);
  }, [clearStepAdvanceTimeout, finalizeComplete, isCompleting]);

  const skipWelcome = useCallback(() => {
    clearStepAdvanceTimeout();

    if (completeTimeoutRef.current) {
      window.clearTimeout(completeTimeoutRef.current);
      completeTimeoutRef.current = null;
    }

    setIsCompleting(false);
    setFadeStep(null);
    saveOnboarding({
      ...getOnboarding(),
      tutorialCompleted: true,
      tutorialCompletedAt: new Date().toISOString(),
    });
    endTutorialSession();
    refreshOnboarding();
    resetTutorialRuntime();
    logTutorialTimeline("welcome skip");
  }, [
    clearStepAdvanceTimeout,
    refreshOnboarding,
    resetTutorialRuntime,
  ]);

  const isTutorialActive =
    !settings.tutorialCompleted;

  const activeStep = useMemo((): GuidedStep | null => {
    if (
      !isTutorialActive ||
      !isTutorialSessionActive() ||
      !currentStepId
    ) {
      return null;
    }

    const step =
      GUIDED_STEPS.find((s) => s.id === currentStepId) ??
      null;

    if (!step) {
      return null;
    }

    if (!matchesGuidedStepRoute(step, pathname)) {
      return null;
    }

    if (
      step.enterWhenReadyKey &&
      !isTutorialReady(step.enterWhenReadyKey)
    ) {
      return null;
    }

    return step;
    // readyTick forces recomputation when tutorial readiness callbacks fire.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isTutorialReady is imperative, not reactive state
  }, [
    currentStepId,
    isTutorialActive,
    pathname,
    readyTick,
  ]);

  useEffect(() => {
    if (!isTutorialSessionActive()) {
      return;
    }

    if (activeStep || pendingStepId) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      setIsTransitioning(false);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [activeStep, pendingStepId]);

  const shouldShowHints = useMemo(() => {
    if (settings.hintMode !== "on") {
      return false;
    }

    return !isTutorialSessionActive();
  }, [settings.hintMode]);

  const shouldShowWelcome =
    isTutorialActive &&
    !isTutorialSessionActive();

  const scheduleStepAdvance = useCallback(
    (advance: () => void) => {
      clearStepAdvanceTimeout();
      setIsTransitioning(true);
      logTutorialTimeline("step pause");

      const delay = prefersReducedMotion()
        ? 0
        : STEP_PAUSE_MS;

      stepAdvanceTimeoutRef.current =
        window.setTimeout(() => {
          stepAdvanceTimeoutRef.current = null;
          advance();
        }, delay);
    },
    [clearStepAdvanceTimeout]
  );

  const transitionToStep = useCallback(
    (stepId: string) => {
      const previousId = currentStepIdRef.current;
      const previous =
        previousId
          ? GUIDED_STEPS.find(
              (step) => step.id === previousId
            ) ?? null
          : null;
      const next =
        GUIDED_STEPS.find((step) => step.id === stepId) ??
        null;

      setIsTransitioning(true);
      clearPinnedTourTarget();
      setTargetMissing(false);
      logTutorialTimeline("step enter", stepId);

      runTutorialHook(previous?.beforeLeaveKey);
      runTutorialHook(next?.beforeEnterKey);

      requestAnimationFrame(() => {
        setCurrentStepId(stepId);
        setPendingStepId(null);

        requestAnimationFrame(() => {
          runTutorialHook(next?.afterEnterKey);
          bumpTutorialReady();
          logTutorialTimeline("route ready", stepId);
        });
      });
    },
    [bumpTutorialReady]
  );

  useEffect(() => {
    if (!pendingStepId) {
      return;
    }

    const next =
      GUIDED_STEPS.find((s) => s.id === pendingStepId) ??
      null;

    if (!next) {
      requestAnimationFrame(() => {
        setPendingStepId(null);
      });
      return;
    }

    if (!matchesGuidedStepRoute(next, pathname)) {
      return;
    }

    if (
      tutorialModalOpen &&
      next.id === "nav-month" &&
      currentStepIdRef.current ===
        "task-edit-save"
    ) {
      return;
    }

    if (
      next.enterWhenReadyKey &&
      !isTutorialReady(next.enterWhenReadyKey)
    ) {
      runTutorialHook(next.afterEnterKey);
      return;
    }

    const current =
      currentStepIdRef.current
        ? GUIDED_STEPS.find(
            (step) =>
              step.id ===
              currentStepIdRef.current
          ) ?? null
        : null;

    if (
      current?.advanceWhenReadyKey &&
      !isTutorialReady(current.advanceWhenReadyKey)
    ) {
      return;
    }

    transitionToStep(next.id);
  }, [
    pathname,
    pendingStepId,
    readyTick,
    transitionToStep,
    tutorialModalOpen,
  ]);

  const isDuplicateAction = useCallback(
    (tourId: string) => {
      const now = Date.now();
      const last = lastActionRef.current;

      if (
        last &&
        last.tourId === tourId &&
        now - last.at < ACTION_DEDUPE_MS
      ) {
        return true;
      }

      lastActionRef.current = {
        tourId,
        at: now,
      };

      return false;
    },
    []
  );

  const registerTourAction = useCallback(
    (tourId: string) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[tour action]", tourId);
      }

      if (!isTutorialActive) {
        return;
      }

      if (!isTutorialSessionActive()) {
        return;
      }

      if (!currentStepId) {
        return;
      }

      if (isTransitioning) {
        return;
      }

      if (
        tutorialModalOpen &&
        NAV_TOUR_IDS.has(tourId)
      ) {
        return;
      }

      const current =
        GUIDED_STEPS.find((s) => s.id === currentStepId) ??
        null;

      if (!current) {
        return;
      }

      if (!matchesStepAdvanceTourId(current, tourId)) {
        return;
      }

      const index = GUIDED_STEPS.findIndex(
        (s) => s.id === currentStepId
      );
      const next = GUIDED_STEPS[index + 1] ?? null;

      if (!next) {
        if (current.tab) {
          saveOnboarding(
            mergeTabProgress(
              getOnboarding(),
              current.tab,
              { completed: true }
            )
          );
          refreshOnboarding();
        }

        scheduleStepAdvance(() => {
          completeTutorial();
        });
        return;
      }

      if (current.tab !== next.tab) {
        saveOnboarding(
          mergeTabProgress(
            getOnboarding(),
            current.tab,
            { completed: true }
          )
        );
        refreshOnboarding();
      }

      logTutorialTimeline("next step", next.id);

      let navigateTarget =
        getGuidedNavigateTargetForStep(
          next,
          pathname
        );

      if (
        !navigateTarget &&
        !matchesGuidedStepRoute(
          next,
          pathname
        )
      ) {
        navigateTarget =
          resolveTutorialNavigation(
            next,
            pathname
          );
      }

      const performAdvance = () => {
        if (navigateTarget) {
          setIsTransitioning(true);
          setPendingStepId(next.id);
          router.push(navigateTarget);
          return;
        }

        if (matchesGuidedStepRoute(next, pathname)) {
          transitionToStep(next.id);
          return;
        }

        const fallbackNav =
          resolveTutorialNavigation(
            next,
            pathname
          );

        if (fallbackNav) {
          setIsTransitioning(true);
          setPendingStepId(next.id);
          router.push(fallbackNav);
          return;
        }

        setPendingStepId(next.id);
      };

      scheduleStepAdvance(performAdvance);
    },
    [
      bumpTutorialReady,
      completeTutorial,
      currentStepId,
      isTransitioning,
      isTutorialActive,
      pathname,
      refreshOnboarding,
      router,
      scheduleStepAdvance,
      transitionToStep,
      tutorialModalOpen,
    ]
  );

  useEffect(() => {
    if (!pendingActionTourId) {
      return;
    }

    const current =
      GUIDED_STEPS.find(
        (step) => step.id === currentStepId
      ) ?? null;

    if (
      !current ||
      !matchesStepAdvanceTourId(
        current,
        pendingActionTourId
      )
    ) {
      return;
    }

    const readyKey = current.advanceWhenReadyKey;

    if (readyKey && !isTutorialReady(readyKey)) {
      return;
    }

    logTutorialTimeline(
      "ready satisfied",
      readyKey ?? "immediate"
    );

    requestAnimationFrame(() => {
      registerTourAction(pendingActionTourId);
      setPendingActionTourId(null);
    });
  }, [
    currentStepId,
    pendingActionTourId,
    readyTick,
    registerTourAction,
  ]);

  const runTourAction = useCallback(
    (
      tourId: string,
      options?: RunTourActionOptions
    ) => {
      const current =
        GUIDED_STEPS.find(
          (step) => step.id === currentStepId
        ) ?? null;

      if (isTransitioning) {
        return;
      }

      if (isDuplicateAction(tourId)) {
        return;
      }

      if (!options?.skipExecute) {
        executeTourAction(tourId);
      }

      logTutorialTimeline("action executed", tourId);

      const readyKey = current?.advanceWhenReadyKey;

      if (readyKey && !isTutorialReady(readyKey)) {
        setPendingActionTourId(tourId);
        bumpTutorialReady();
        return;
      }

      registerTourAction(tourId);
    },
    [
      bumpTutorialReady,
      currentStepId,
      isDuplicateAction,
      isTransitioning,
      registerTourAction,
    ]
  );

  const retryTargetMeasurement =
    useCallback(() => {
      setTargetMissing(false);
      setTargetRetryKey((key) => key + 1);
    }, []);

  useLayoutEffect(() => {
    runMeasureCleanup();

    if (!activeStep) {
      return;
    }

    let cancelled = false;
    let observer: ResizeObserver | null = null;
    let missingTimeout: ReturnType<typeof setTimeout> | null =
      null;
    let measureDebounce: ReturnType<typeof setTimeout> | null =
      null;

    const cleanup = () => {
      cancelled = true;
      observer?.disconnect();
      observer = null;

      if (missingTimeout) {
        clearTimeout(missingTimeout);
        missingTimeout = null;
      }

      if (measureDebounce) {
        clearTimeout(measureDebounce);
        measureDebounce = null;
      }

      cancelMeasurementQueue();
      window.removeEventListener("resize", onResize);
      window.removeEventListener(
        "scroll",
        onViewportChange
      );
      window.visualViewport?.removeEventListener(
        "resize",
        onViewportChange
      );
      window.visualViewport?.removeEventListener(
        "scroll",
        onViewportChange
      );
      document.removeEventListener(
        "focusin",
        onViewportChange
      );
    };

    measureCleanupRef.current = cleanup;

    const applyMeasurement = (
      element: HTMLElement,
      shouldScroll: boolean,
      retryCount = 0
    ) => {
      if (cancelled) {
        return;
      }

      if (shouldScroll || retryCount > 0) {
        scrollTourTargetIntoView(element);
      }

      enqueueMeasurement(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (cancelled) {
              return;
            }

            const ratio = getTargetVisibleRatio(element);

            setTargetVisibleRatio((prev) =>
              Math.abs(prev - ratio) < 0.01
                ? prev
                : ratio
            );

            const rect =
              measureElementRect(element);

            if (rect) {
              applyTargetRect(rect);
              setIsTransitioning(false);
              logTutorialTimeline(
                "target resolved",
                activeStep.target
              );
              logTutorialTimeline("position computed");
            } else if (retryCount >= 8) {
              setIsTransitioning(false);
              setTargetMissing(true);
            }

            if (
              retryCount < 8 &&
              (!rect ||
                !isTargetActionable(element))
            ) {
              scheduleMeasurement(
                element,
                true,
                retryCount + 1
              );
            }
          });
        });
      });
    };

    const scheduleMeasurement = (
      element: HTMLElement,
      shouldScroll: boolean,
      retryCount = 0
    ) => {
      if (measureDebounce) {
        clearTimeout(measureDebounce);
      }

      measureDebounce = setTimeout(() => {
        measureDebounce = null;
        applyMeasurement(
          element,
          shouldScroll,
          retryCount
        );
      }, MEASURE_DEBOUNCE_MS);
    };

    const updateRect = (
      element: HTMLElement,
      shouldScroll: boolean
    ) => {
      scheduleMeasurement(element, shouldScroll);
    };

    const markTargetMissing = () => {
      if (cancelled) {
        return;
      }

      const element = resolveTourTarget(
        activeStep.target
      );

      if (!element) {
        setTargetMissing(true);
      }
    };

    missingTimeout = setTimeout(
      markTargetMissing,
      TARGET_MISSING_MS
    );

    waitForElement(
      activeStep.target,
      (element) => {
        if (cancelled) {
          return;
        }

        if (missingTimeout) {
          clearTimeout(missingTimeout);
          missingTimeout = null;
        }

        setTargetMissing(false);
        updateRect(element, true);

        if (typeof ResizeObserver !== "undefined") {
          observer = new ResizeObserver(() => {
            const current = resolveTourTarget(
              activeStep.target
            );

            if (!current) {
              return;
            }

            updateRect(current, false);
          });
          observer.observe(element);
        }
      },
      markTargetMissing
    );

    const onResize = () => {
      const element = resolveTourTarget(
        activeStep.target
      );

      if (element) {
        updateRect(element, false);
      }
    };

    const onViewportChange = () => {
      onResize();
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onViewportChange, {
      passive: true,
    });
    window.visualViewport?.addEventListener(
      "resize",
      onViewportChange
    );
    window.visualViewport?.addEventListener(
      "scroll",
      onViewportChange
    );
    document.addEventListener(
      "focusin",
      onViewportChange
    );

    return cleanup;
  }, [
    activeStep,
    applyTargetRect,
    runMeasureCleanup,
    targetRetryKey,
  ]);

  useEffect(() => {
    if (!activeStep) {
      document.documentElement.classList.remove(
        "tutorial-active"
      );
      return;
    }

    document.documentElement.classList.add(
      "tutorial-active"
    );

    return () => {
      document.documentElement.classList.remove(
        "tutorial-active"
      );
    };
  }, [activeStep]);

  const setTutorialModalOpen = useCallback(
    (open: boolean) => {
      setTutorialModalOpenState(open);

      if (!open) {
        requestAnimationFrame(() => {
          bumpTutorialReady();
        });
      }
    },
    [bumpTutorialReady]
  );

  const startTutorialSessionForStep = useCallback(
    (stepId: string | null) => {
      startTutorialSession();

      persistTutorialSessionSnapshot({
        active: true,
        currentStepId: stepId,
        pendingStepId: null,
        tutorialStatus: "idle",
        pathname,
        pinnedSelector: null,
        pinnedInstanceId: null,
      });

      notifyProjectsChanged();
      setPendingStepId(null);
      setPendingActionTourId(null);
      setTargetMissing(false);
      setTargetVisibleRatio(1);
      setTutorialModalOpenState(false);
      setIsTransitioning(false);
      setCurrentStepId(stepId);
      logTutorialTimeline(
        "step enter",
        stepId ?? "none"
      );
    },
    [pathname]
  );

  const goToTutorialStep = useCallback(
    (stepId: string) => {
      const nextStep =
        GUIDED_STEPS.find(
          (step) => step.id === stepId
        ) ?? null;

      if (!nextStep) {
        return;
      }

      const navigateTarget =
        getGuidedNavigateTargetForStep(
          nextStep,
          pathname
        );

      if (navigateTarget) {
        setIsTransitioning(true);
        setPendingStepId(stepId);
        router.push(navigateTarget);
        return;
      }

      transitionToStep(stepId);
    },
    [pathname, router, transitionToStep]
  );

  const skipTutorialTabById = useCallback(
    (tab: TutorialTabId) => {
      const updated = mergeTabProgress(
        getOnboarding(),
        tab,
        { skipped: true }
      );

      saveOnboarding(updated);
      refreshOnboarding();

      if (areAllTabsDone(updated)) {
        saveOnboarding({
          ...updated,
          tutorialCompleted: true,
          tutorialCompletedAt: new Date().toISOString(),
        });
        refreshOnboarding();
      }

      logTutorialTimeline("tab skipped", tab);
    },
    [refreshOnboarding]
  );

  const skipTutorialTab = useCallback(() => {
    const stepId = currentStepIdRef.current;

    if (!stepId) {
      return;
    }

    const tab = getTutorialTabForStep(stepId);

    if (!tab) {
      completeTutorial();
      return;
    }

    const updated = mergeTabProgress(
      getOnboarding(),
      tab,
      { skipped: true }
    );

    saveOnboarding(updated);
    refreshOnboarding();

    const nextTab = findNextAvailableTab(
      updated,
      tab
    );

    if (!nextTab) {
      if (areAllTabsDone(updated)) {
        saveOnboarding({
          ...updated,
          tutorialCompleted: true,
          tutorialCompletedAt: new Date().toISOString(),
        });
        refreshOnboarding();
      }

      completeTutorial();
      return;
    }

    const nextStepId =
      getStartStepForTab(nextTab);

    if (!nextStepId) {
      completeTutorial();
      return;
    }

    const nextStep =
      GUIDED_STEPS.find(
        (step) => step.id === nextStepId
      ) ?? null;

    if (!nextStep) {
      completeTutorial();
      return;
    }

    clearPinnedTourTarget();
    runMeasureCleanup();
    setTutorialModalOpenState(false);

    const navigateTarget = resolveTutorialNavigation(
      nextStep,
      pathname
    );

    scheduleStepAdvance(() => {
      if (navigateTarget) {
        setIsTransitioning(true);
        setPendingStepId(nextStepId);
        router.push(navigateTarget);
        requestAnimationFrame(() => {
          bumpTutorialReady();
        });
        return;
      }

      requestAnimationFrame(() => {
        transitionToStep(nextStepId);
        bumpTutorialReady();
      });
    });

    logTutorialTimeline("tab skipped", tab);
  }, [
    completeTutorial,
    pathname,
    refreshOnboarding,
    router,
    runMeasureCleanup,
    scheduleStepAdvance,
    transitionToStep,
    bumpTutorialReady,
  ]);

  const startTutorialTab = useCallback(
    (tab: TutorialTabId) => {
      if (completeTimeoutRef.current) {
        window.clearTimeout(
          completeTimeoutRef.current
        );
        completeTimeoutRef.current = null;
      }

      setIsCompleting(false);
      setFadeStep(null);
      runMeasureCleanup();
      clearPinnedTourTarget();

      const stepId = getStartStepForTab(tab);

      startTutorialSessionForStep(stepId);

      if (stepId) {
        goToTutorialStep(stepId);
      }
    },
    [
      goToTutorialStep,
      runMeasureCleanup,
      startTutorialSessionForStep,
    ]
  );

  const startTutorial = useCallback(
    (tab?: TutorialTabId) => {
      if (completeTimeoutRef.current) {
        window.clearTimeout(
          completeTimeoutRef.current
        );
        completeTimeoutRef.current = null;
      }

      setIsCompleting(false);
      setFadeStep(null);
      runMeasureCleanup();
      clearPinnedTourTarget();

      const explicitTab = isTutorialTabId(tab)
        ? tab
        : undefined;

      const incompleteTab =
        findFirstIncompleteTab(getOnboarding());

      if (!explicitTab && !incompleteTab) {
        finalizeComplete();
        return;
      }

      const targetTab =
        explicitTab ??
        incompleteTab ??
        TUTORIAL_TAB_ORDER[0];

      const firstStepId =
        getStartStepForTab(targetTab);

      startTutorialSessionForStep(
        firstStepId
      );

      if (!firstStepId) {
        return;
      }

      const firstStep =
        GUIDED_STEPS.find(
          (step) => step.id === firstStepId
        ) ?? null;

      if (
        firstStep &&
        !matchesGuidedStepRoute(
          firstStep,
          pathname
        )
      ) {
        goToTutorialStep(firstStepId);
        return;
      }

      if (
        pathname !== "/" &&
        !tab &&
        firstStep?.routeScope === "any-nav"
      ) {
        router.push("/");
      }
    },
    [
      finalizeComplete,
      goToTutorialStep,
      pathname,
      router,
      runMeasureCleanup,
      startTutorialSessionForStep,
    ]
  );

  const tutorialStepProgress = useMemo(
    () => {
      const progress = getStepProgress(
        currentStepId
      );

      return {
        current: progress.current,
        total: progress.total,
        tabLabel: progress.tabLabel,
      };
    },
    [currentStepId]
  );

  const value = useMemo(
    () => ({
      settings,
      shouldShowHints,
      isTutorialActive,
      currentStepId,
      tutorialStatus,
      isTransitioning,
      isCompleting,
      registerTourAction,
      runTourAction,
      setTutorialModalOpen,
      bumpTutorialReady,
      startTutorial,
      startTutorialTab,
      skipTutorial: completeTutorial,
      skipTutorialTab,
      skipTutorialTabById,
      completeTutorial,
      tutorialStepProgress,
      refreshOnboarding,
    }),
    [
      settings,
      shouldShowHints,
      isTutorialActive,
      completeTutorial,
      currentStepId,
      isCompleting,
      isTransitioning,
      registerTourAction,
      runTourAction,
      setTutorialModalOpen,
      bumpTutorialReady,
      startTutorial,
      startTutorialTab,
      skipTutorialTab,
      skipTutorialTabById,
      tutorialStepProgress,
      refreshOnboarding,
      tutorialStatus,
    ]
  );

  const sessionStep = useMemo((): GuidedStep | null => {
    if (
      !isTutorialSessionActive() ||
      !currentStepId
    ) {
      return null;
    }

    return (
      GUIDED_STEPS.find(
        (step) => step.id === currentStepId
      ) ?? null
    );
  }, [currentStepId]);

  const overlayStep = shouldShowWelcome
    ? null
    : activeStep ??
      sessionStep ??
      fadeStep;

  return (
    <OnboardingContext.Provider
      value={value}
    >
      {children}
      {shouldShowWelcome && (
        <WelcomeOverlay
          onStart={startTutorial}
          onSkip={skipWelcome}
        />
      )}
      {overlayStep && (
        <TutorialOverlay
          step={overlayStep}
          targetRect={displayedTargetRect}
          targetMissing={targetMissing}
          targetVisibleRatio={targetVisibleRatio}
          isTransitioning={isTransitioning}
          isCompleting={isCompleting}
          stepProgress={tutorialStepProgress}
          onRetryTarget={retryTargetMeasurement}
        />
      )}
    </OnboardingContext.Provider>
  );
}
