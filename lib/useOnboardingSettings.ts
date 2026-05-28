"use client";

import { useSyncExternalStore } from "react";

import {
  getDefaultOnboarding,
  getOnboarding,
  subscribeOnboardingChanged,
  type OnboardingSettings,
} from "@/lib/storage";

export function useOnboardingSettings(): OnboardingSettings {
  return useSyncExternalStore(
    subscribeOnboardingChanged,
    getOnboarding,
    getDefaultOnboarding
  );
}
