"use client";

type TutorialActionFn = () => void;
type TutorialReadyFn = () => boolean;
type TutorialHookFn = () => void;

const actionRegistry = new Map<string, TutorialActionFn>();
const readyRegistry = new Map<string, TutorialReadyFn>();
const hookRegistry = new Map<string, TutorialHookFn>();

export function registerTutorialAction(
  tourId: string,
  action: TutorialActionFn
) {
  actionRegistry.set(tourId, action);

  return () => {
    actionRegistry.delete(tourId);
  };
}

export function registerTutorialReadyCheck(
  key: string,
  ready: TutorialReadyFn
) {
  readyRegistry.set(key, ready);

  return () => {
    readyRegistry.delete(key);
  };
}

export function registerTutorialHook(
  key: string,
  hook: TutorialHookFn
) {
  hookRegistry.set(key, hook);

  return () => {
    hookRegistry.delete(key);
  };
}

export function runRegisteredTutorialAction(
  tourId: string
): boolean {
  const action = actionRegistry.get(tourId);

  if (!action) {
    return false;
  }

  action();
  return true;
}

export function clickTourTarget(
  tourId: string
): boolean {
  const element = document.querySelector(
    `[data-tour="${tourId}"]`
  );

  if (!(element instanceof HTMLElement)) {
    return false;
  }

  element.click();
  return true;
}

/** Run the real UI action (registry first, then DOM proxy click). */
export function executeTourAction(
  tourId: string
): boolean {
  if (runRegisteredTutorialAction(tourId)) {
    return true;
  }

  return clickTourTarget(tourId);
}

export function isTutorialReady(
  key: string | undefined
): boolean {
  if (!key) {
    return true;
  }

  const ready = readyRegistry.get(key);

  if (!ready) {
    return true;
  }

  return ready();
}

export function runTutorialHook(
  key: string | undefined
) {
  if (!key) {
    return;
  }

  hookRegistry.get(key)?.();
}
