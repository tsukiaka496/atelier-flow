import { clearTutorialCreatedProjectId } from "@/lib/tutorialCreatedProject";

export type TutorialSessionStatus =
  | "idle"
  | "modal-open";

export type TutorialSessionSnapshot = {
  active: boolean;
  currentStepId: string | null;
  pendingStepId: string | null;
  tutorialStatus: TutorialSessionStatus;
  pathname: string;
  pinnedSelector: string | null;
  pinnedInstanceId: string | null;
};

const SESSION_FLAG_KEY = "tutorial-session";
const SESSION_STATE_KEY = "tutorial-session-state";

let tutorialSessionActive = false;

function readSnapshot(): TutorialSessionSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(
    SESSION_STATE_KEY
  );

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(
      raw
    ) as TutorialSessionSnapshot;
  } catch {
    return null;
  }
}

export function isTutorialSessionActive() {
  if (tutorialSessionActive) {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  return (
    sessionStorage.getItem(SESSION_FLAG_KEY) ===
    "true"
  );
}

export function loadTutorialSessionSnapshot():
  | TutorialSessionSnapshot
  | null {
  if (!isTutorialSessionActive()) {
    return null;
  }

  return readSnapshot();
}

export function persistTutorialSessionSnapshot(
  snapshot: TutorialSessionSnapshot
) {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(
    SESSION_FLAG_KEY,
    snapshot.active ? "true" : "false"
  );
  sessionStorage.setItem(
    SESSION_STATE_KEY,
    JSON.stringify(snapshot)
  );
}

export function startTutorialSession() {
  tutorialSessionActive = true;

  if (typeof window !== "undefined") {
    sessionStorage.setItem(
      SESSION_FLAG_KEY,
      "true"
    );
  }
}

export function endTutorialSession() {
  tutorialSessionActive = false;

  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(SESSION_FLAG_KEY);
  sessionStorage.removeItem(SESSION_STATE_KEY);
  clearTutorialCreatedProjectId();
}
