import type { Project } from "@/lib/storage";

export function getProjectProgress(
  project: Project
): number {
  if (project.tasks.length === 0) {
    return project.manualCompleted ? 100 : 0;
  }

  const completed = project.tasks.filter(
    (task) => task.completed
  ).length;

  return Math.round(
    (completed / project.tasks.length) * 100
  );
}

export function isProjectFullyCompleted(
  project: Project
): boolean {
  return getProjectProgress(project) === 100;
}
