"use client";

import { useCallback } from "react";

import { useOnboarding } from "@/components/onboarding/OnboardingProvider";
import { executeTourAction } from "@/lib/tutorialActionRegistry";

export function useTourAction(
  tourId?: string,
  action?: () => void
) {
  const { runTourAction } = useOnboarding();

  return useCallback(() => {
    if (!tourId) {
      return;
    }

    if (action) {
      action();
      runTourAction(tourId, { skipExecute: true });
      return;
    }

    runTourAction(tourId);
  }, [action, runTourAction, tourId]);
}

/** Proxy click on the real UI element, then advance tutorial. */
export function useTourProxy(tourId?: string) {
  const { runTourAction } = useOnboarding();

  return useCallback(() => {
    if (!tourId) {
      return;
    }

    runTourAction(tourId);
  }, [runTourAction, tourId]);
}

export { executeTourAction };
