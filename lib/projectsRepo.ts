import {
  addProject as addPersistentProject,
  getProjects as getPersistentProjects,
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

  window.addEventListener(PROJECTS_CHANGED_EVENT, onChange);
  return () => {
    window.removeEventListener(PROJECTS_CHANGED_EVENT, onChange);
  };
}

export function isUsingTutorialProjects() {
  return false;
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

