"use client";

import type { ReactNode } from "react";

import {
  hints,
  type HintId,
} from "@/lib/hints";

import { useOnboarding } from "@/components/onboarding/OnboardingProvider";

type HintLabelProps = {
  hintId: HintId;
  children: ReactNode;
};

export default function HintLabel({
  hintId,
  children,
}: HintLabelProps) {
  const { shouldShowHints, isTutorialActive } =
    useOnboarding();

  const text = hints[hintId];

  if (
    !shouldShowHints ||
    isTutorialActive ||
    !text
  ) {
    return children;
  }

  return (
    <div>
      {children}
      <p className="mt-1 text-center text-[10px] leading-snug text-zinc-400 dark:text-zinc-500">
        {text}
      </p>
    </div>
  );
}
