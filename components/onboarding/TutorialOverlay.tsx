"use client";

import {
  memo,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { tutorialTheme } from "@/lib/tutorialTheme";
import type { GuidedStep } from "@/lib/tutorialSteps";
import {
  computeTooltipLayout,
  prefersReducedMotion,
  type TooltipLayoutResult,
} from "@/lib/tutorialPositioning";
import { getTutorialTimeline } from "@/lib/tutorialTimeline";

import { useOnboarding } from "@/components/onboarding/OnboardingProvider";

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const OVERLAY_Z = 50;
const LAYOUT_DEBOUNCE_MS = 48;

type TutorialOverlayProps = {
  step: GuidedStep;
  targetRect: Rect | null;
  targetMissing: boolean;
  targetVisibleRatio: number;
  isTransitioning: boolean;
  isCompleting: boolean;
  stepProgress: {
    current: number;
    total: number;
    tabLabel: string;
  };
  onRetryTarget: () => void;
};

function clampHoleRect(rect: Rect, vw: number, vh: number): Rect {
  const top = Math.max(0, rect.top);
  const left = Math.max(0, rect.left);
  const width = Math.min(rect.width, vw - left);
  const height = Math.min(rect.height, vh - top);

  return { top, left, width, height };
}

const SpotlightMask = memo(function SpotlightMask({
  hole,
  onBlockedClick,
  nudge,
}: {
  hole: Rect;
  onBlockedClick: () => void;
  nudge: boolean;
}) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const safe = clampHoleRect(hole, vw, vh);

  const panels: Rect[] = [
    { top: 0, left: 0, width: vw, height: safe.top },
    {
      top: safe.top,
      left: 0,
      width: safe.left,
      height: safe.height,
    },
    {
      top: safe.top,
      left: safe.left + safe.width,
      width: Math.max(0, vw - safe.left - safe.width),
      height: safe.height,
    },
    {
      top: safe.top + safe.height,
      left: 0,
      width: vw,
      height: Math.max(0, vh - safe.top - safe.height),
    },
  ];

  const nudgeClass =
    nudge && !prefersReducedMotion()
      ? " tutorial-mask-nudge"
      : "";

  return (
    <>
      {panels.map((panel, index) => (
        <div
          key={index}
          className={`${tutorialTheme.maskPanel} tutorial-mask-surface${nudgeClass}`}
          style={{
            top: panel.top,
            left: panel.left,
            width: panel.width,
            height: panel.height,
            zIndex: OVERLAY_Z,
          }}
          aria-hidden="true"
          onClick={onBlockedClick}
        />
      ))}

      <div
        className={`${tutorialTheme.maskRing} tutorial-mask-surface`}
        style={{
          top: safe.top,
          left: safe.left,
          width: safe.width,
          height: safe.height,
          zIndex: OVERLAY_Z,
        }}
        aria-hidden="true"
      />
    </>
  );
});

function TooltipArrow({
  layout,
}: {
  layout: TooltipLayoutResult;
}) {
  const base: CSSProperties = {
    left: `calc(50% + ${layout.arrowOffsetX}px)`,
  };

  if (layout.arrowSide === "bottom") {
    return (
      <span
        className={tutorialTheme.tooltipArrow}
        style={{
          ...base,
          top: 4,
          borderBottomColor: "transparent",
          borderRightColor: "transparent",
        }}
        aria-hidden="true"
      />
    );
  }

  if (layout.arrowSide === "top") {
    return (
      <span
        className={tutorialTheme.tooltipArrow}
        style={{
          ...base,
          bottom: 4,
          borderTopColor: "transparent",
          borderLeftColor: "transparent",
        }}
        aria-hidden="true"
      />
    );
  }

  return null;
}

function useTooltipPositionEngine(
  step: GuidedStep,
  targetRect: Rect | null,
  targetMissing: boolean,
  targetVisibleRatio: number
) {
  const [layout, setLayout] =
    useState<TooltipLayoutResult>(() =>
      computeTooltipLayout({
        targetRect,
        preferredPlacement: step.placement ?? "auto",
        targetMissing,
        hasCta: Boolean(step.cta),
        targetVisibleRatio,
      })
    );

  const rafRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const frameCommittedRef = useRef(false);

  const recompute = useCallback(() => {
    if (frameCommittedRef.current) {
      return;
    }

    frameCommittedRef.current = true;

    rafRef.current = requestAnimationFrame(() => {
      frameCommittedRef.current = false;

      const next = computeTooltipLayout({
        targetRect,
        preferredPlacement: step.placement ?? "auto",
        targetMissing,
        hasCta: Boolean(step.cta),
        targetVisibleRatio,
      });

      setLayout((prev) => {
        if (
          Math.abs(prev.top - next.top) < 2 &&
          Math.abs(prev.left - next.left) < 2 &&
          Math.abs(prev.width - next.width) < 2 &&
          prev.placement === next.placement &&
          prev.compactMode === next.compactMode
        ) {
          return prev;
        }

        return next;
      });
    });
  }, [
    step.cta,
    step.placement,
    targetMissing,
    targetRect,
    targetVisibleRatio,
  ]);

  const scheduleRecompute = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      recompute();
    }, LAYOUT_DEBOUNCE_MS);
  }, [recompute]);

  useEffect(() => {
    scheduleRecompute();

    const onChange = () => {
      scheduleRecompute();
    };

    window.addEventListener("resize", onChange);
    window.visualViewport?.addEventListener(
      "resize",
      onChange
    );
    window.visualViewport?.addEventListener(
      "scroll",
      onChange
    );
    document.addEventListener("focusin", onChange);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      window.removeEventListener("resize", onChange);
      window.visualViewport?.removeEventListener(
        "resize",
        onChange
      );
      window.visualViewport?.removeEventListener(
        "scroll",
        onChange
      );
      document.removeEventListener("focusin", onChange);
    };
  }, [scheduleRecompute]);

  return layout;
}

const TooltipPanel = memo(function TooltipPanel({
  step,
  layout,
  targetMissing,
  nudgeClass,
  isTransitioning,
  bodyId,
  titleId,
  onSkip,
  onSkipTab,
  onComplete,
  onCta,
  onRetry,
  stepProgress,
}: {
  step: GuidedStep;
  layout: TooltipLayoutResult;
  targetMissing: boolean;
  nudgeClass: string;
  isTransitioning: boolean;
  bodyId: string;
  titleId: string;
  onSkip: () => void;
  onSkipTab: () => void;
  onComplete: () => void;
  onCta: () => void;
  onRetry: () => void;
  stepProgress: {
    current: number;
    total: number;
    tabLabel: string;
  };
}) {
  const useCompact =
    layout.compactMode || step.id !== "finish";

  const panelClass = useCompact
    ? tutorialTheme.tooltipPanelCompact
    : tutorialTheme.tooltipPanel;

  const titleClass = useCompact
    ? tutorialTheme.tooltipTitleCompact
    : tutorialTheme.tooltipTitle;

  const bodyClass = useCompact
    ? tutorialTheme.tooltipBodyCompact
    : tutorialTheme.tooltipBody;

  const isLastStep = step.id === "finish";
  const ctaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isTransitioning || targetMissing) {
      return;
    }

    if (step.cta) {
      ctaRef.current?.focus({ preventScroll: true });
      return;
    }

    if (isLastStep) {
      ctaRef.current?.focus({ preventScroll: true });
    }
  }, [isLastStep, isTransitioning, step.cta, targetMissing]);

  return (
    <div
      className={`${panelClass}${nudgeClass}`}
      style={{
        top: layout.top,
        left: layout.left,
        width: layout.width,
        zIndex: OVERLAY_Z + 1,
      }}
      aria-modal="true"
      role="dialog"
      aria-live="polite"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
    >
      {!targetMissing && !layout.debug.collisionDetected && (
        <TooltipArrow layout={layout} />
      )}

      {targetMissing ? (
        <>
          <p
            id={titleId}
            className={tutorialTheme.tooltipTitle}
          >
            対象の読み込みに失敗しました
          </p>
          <p
            id={bodyId}
            className={tutorialTheme.tooltipBody}
          >
            画面の表示が完了するまで少し待ってから、もう一度お試しください。
          </p>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onRetry}
              className={tutorialTheme.primaryButton}
            >
              再試行
            </button>
          </div>
        </>
      ) : (
        <>
          <p id={titleId} className={titleClass}>
            {step.title}
          </p>

          <div className="mt-1 flex items-center gap-2">
            {stepProgress.total > 0 && (
              <span
                className="
                  rounded-full
                  bg-zinc-100
                  px-2
                  py-0.5
                  text-[10px]
                  font-medium
                  text-zinc-500
                  dark:bg-zinc-800
                  dark:text-zinc-400
                "
              >
                {stepProgress.tabLabel}{" "}
                {stepProgress.current}/{stepProgress.total}
              </span>
            )}
          </div>

          <p id={bodyId} className={bodyClass}>
            {step.body}
          </p>

          <div
            className={`flex items-center justify-between gap-2 ${
              useCompact ? "mt-3" : "mt-4"
            }`}
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <button
                type="button"
                onClick={() => onSkipTab()}
                className={`
                  ${tutorialTheme.skipButton}
                  !px-2 !py-1.5 text-left
                `}
              >
                この章をスキップ
              </button>

              <button
                type="button"
                onClick={() => onSkip()}
                className="
                  pointer-events-auto
                  px-2
                  py-0.5
                  text-left
                  text-[10px]
                  text-zinc-400
                  underline-offset-2
                  hover:underline
                "
              >
                ガイドを終了
              </button>
            </div>

            {step.cta ? (
              <button
                ref={ctaRef}
                type="button"
                onClick={onCta}
                disabled={isTransitioning}
                className={tutorialTheme.primaryButton}
              >
                {step.cta.label}
              </button>
            ) : isLastStep ? (
              <button
                ref={ctaRef}
                type="button"
                onClick={onComplete}
                disabled={isTransitioning}
                className={tutorialTheme.primaryButton}
              >
                完了
              </button>
            ) : (
              <p
                className={`
                  ${tutorialTheme.tooltipHint}
                  max-w-[9rem]
                  text-right
                  leading-snug
                `}
              >
                光っている所をタップ
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
});

export default function TutorialOverlay({
  step,
  targetRect,
  targetMissing,
  targetVisibleRatio,
  isTransitioning,
  isCompleting,
  stepProgress,
  onRetryTarget,
}: TutorialOverlayProps) {
  const {
    skipTutorial,
    skipTutorialTab,
    completeTutorial,
    runTourAction,
  } = useOnboarding();

  const [nudge, setNudge] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);

  const titleId = useId();
  const bodyId = useId();

  const layout = useTooltipPositionEngine(
    step,
    targetRect,
    targetMissing,
    targetVisibleRatio
  );

  const showSpotlight =
    Boolean(targetRect) && !targetMissing;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.shiftKey &&
        event.key.toLowerCase() === "t"
      ) {
        setDebugOpen((open) => !open);
      }

      if (event.key === "Escape") {
        skipTutorial();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [skipTutorial]);

  const handleBlockedClick = () => {
    if (isTransitioning || prefersReducedMotion()) {
      return;
    }

    setNudge(true);
    window.setTimeout(() => {
      setNudge(false);
    }, 360);
  };

  const handleCtaClick = () => {
    if (!step.cta) {
      return;
    }

    const canBypassTransition =
      step.cta.tourId === "tutorial-advance-next";

    if (isTransitioning && !canBypassTransition) {
      return;
    }

    runTourAction(step.cta.tourId);
  };

  const nudgeClass =
    nudge && !prefersReducedMotion()
      ? " tutorial-tooltip-nudge"
      : "";

  const rootClass = [
    "tutorial-overlay-root",
    isCompleting ? "tutorial-overlay-completing" : "",
    prefersReducedMotion() ? "" : "tutorial-overlay-enter",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      {showSpotlight && targetRect ? (
        <SpotlightMask
          hole={targetRect}
          onBlockedClick={handleBlockedClick}
          nudge={nudge}
        />
      ) : (
        <div
          className={`${tutorialTheme.maskPanel} tutorial-mask-surface fixed inset-0${
            nudge && !prefersReducedMotion()
              ? " tutorial-mask-nudge"
              : ""
          }${isCompleting ? " tutorial-backdrop-complete" : ""}`}
          style={{ zIndex: OVERLAY_Z }}
          aria-hidden={!targetMissing}
          onClick={handleBlockedClick}
        />
      )}

      <TooltipPanel
        step={step}
        layout={layout}
        targetMissing={targetMissing}
        nudgeClass={nudgeClass}
        isTransitioning={isTransitioning}
        bodyId={bodyId}
        titleId={titleId}
        stepProgress={stepProgress}
        onSkip={skipTutorial}
        onSkipTab={skipTutorialTab}
        onComplete={completeTutorial}
        onCta={handleCtaClick}
        onRetry={onRetryTarget}
      />

      {process.env.NODE_ENV === "development" &&
        debugOpen && (
          <div className={tutorialTheme.debugPanel}>
            <p>placement: {layout.debug.placement}</p>
            <p>
              collision:{" "}
              {layout.debug.collisionDetected
                ? "yes"
                : "no"}
            </p>
            <p>
              compact:{" "}
              {layout.debug.compactMode ? "yes" : "no"}
            </p>
            <p>
              visible:{" "}
              {Math.round(
                layout.debug.targetVisibleRatio * 100
              )}
              %
            </p>
            <p>
              obstacles:{" "}
              {layout.debug.viewportObstacles.length}
            </p>
            <p>transition: {isTransitioning ? "yes" : "no"}</p>
            <hr className="my-1 border-white/20" />
            {getTutorialTimeline()
              .slice(0, 6)
              .map((entry) => (
                <p key={`${entry.ts}-${entry.event}`}>
                  {entry.event}
                  {entry.detail
                    ? `: ${entry.detail}`
                    : ""}
                </p>
              ))}
          </div>
        )}
    </div>
  );
}
