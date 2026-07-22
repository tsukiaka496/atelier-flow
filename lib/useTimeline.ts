"use client";

import { useSyncExternalStore } from "react";

import {
  EMPTY_TIMELINE,
  getTimeline,
  subscribeTimelineChanged,
  type TimelinePlan,
} from "@/lib/storage";

export function useTimeline(): TimelinePlan {
  return useSyncExternalStore(
    subscribeTimelineChanged,
    getTimeline,
    () => EMPTY_TIMELINE
  );
}
