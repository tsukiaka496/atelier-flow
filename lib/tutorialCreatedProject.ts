const CREATED_PROJECT_KEY =
  "tutorial-created-project-id";

export function setTutorialCreatedProjectId(
  projectId: string
) {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(
    CREATED_PROJECT_KEY,
    projectId
  );
}

export function getTutorialCreatedProjectId():
  | string
  | null {
  if (typeof window === "undefined") {
    return null;
  }

  return sessionStorage.getItem(
    CREATED_PROJECT_KEY
  );
}

export function clearTutorialCreatedProjectId() {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(
    CREATED_PROJECT_KEY
  );
}
