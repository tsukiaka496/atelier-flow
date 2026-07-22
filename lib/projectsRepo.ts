import {
  addProject as addPersistentProject,
  getProjects as getPersistentProjects,
  invalidateStorageCacheFromEvent,
  saveProjects as savePersistentProjects,
  updateProject as updatePersistentProject,
  type Project,
} from "@/lib/storage";

const PROJECTS_CHANGED_EVENT = "atelier-flow:projects-changed";

function emitProjectsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PROJECTS_CHANGED_EVENT));
}

export function notifyProjectsChanged() {
  emitProjectsChanged();
}

export function subscribeProjectsChanged(
  onChange: () => void
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    invalidateStorageCacheFromEvent(event.key);
    onChange();
  };

  window.addEventListener(
    PROJECTS_CHANGED_EVENT,
    onChange
  );
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(
      PROJECTS_CHANGED_EVENT,
      onChange
    );
    window.removeEventListener(
      "storage",
      onStorage
    );
  };
}

export function getProjectsRepo(): Project[] {
  return getPersistentProjects();
}

export function saveProjectsRepo(projects: Project[]) {
  savePersistentProjects(projects);
  emitProjectsChanged();
}

export function addProjectRepo(project: Project) {
  addPersistentProject(project);
  emitProjectsChanged();
}

export function updateProjectRepo(updated: Project) {
  updatePersistentProject(updated);
  emitProjectsChanged();
}

