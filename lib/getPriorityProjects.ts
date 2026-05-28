import { getProjects, type Project } from "@/lib/storage";

export function getPriorityProjects() {
  const projects: Project[] = getProjects();

  function daysLeft(deadline: string) {
    if (!deadline) return 999;
    const today = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  return [...projects].sort((a, b) => {
    const aRemainingTasks = a.tasks.filter(
      (task) => !task.completed
    ).length;

    const bRemainingTasks = b.tasks.filter(
      (task) => !task.completed
    ).length;

    const aPriority = daysLeft(a.deadline) - aRemainingTasks;

    const bPriority = daysLeft(b.deadline) - bRemainingTasks;

    return aPriority - bPriority;
  });
}