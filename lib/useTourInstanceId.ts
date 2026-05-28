"use client";

import { useId } from "react";

/** Stable per-mount id for tutorial target identity. */
export function useTourInstanceId(
  tourId?: string
) {
  const reactId = useId();

  if (!tourId) {
    return undefined;
  }

  return `${tourId}-${reactId.replace(/:/g, "")}`;
}

export function tourInstanceProps(
  tourId: string | undefined,
  instanceId: string | undefined
) {
  if (!tourId || !instanceId) {
    return {};
  }

  return {
    "data-tour": tourId,
    "data-tour-instance-id": instanceId,
  } as const;
}
