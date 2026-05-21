import { getProjects } from "@/lib/storage";

export function getPriorityProjects() {
  const projects: any[] = getProjects();

  return [...projects].sort((a: any, b: any) => {

    const aRemainingTasks =
      a.tasks.filter(
        (task: any) => !task.done
      ).length;

    const bRemainingTasks =
      b.tasks.filter(
        (task: any) => !task.done
      ).length;

    const aPriority =
      (a.daysLeft ?? 999) - aRemainingTasks;

    const bPriority =
      (b.daysLeft ?? 999) - bRemainingTasks;

    return aPriority - bPriority;
  });
}