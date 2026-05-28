"use client";

import type { ReactNode } from "react";

import OnboardingProvider from "@/components/onboarding/OnboardingProvider";

export default function OnboardingRoot({
  children,
}: {
  children: ReactNode;
}) {
  return <OnboardingProvider>{children}</OnboardingProvider>;
}

