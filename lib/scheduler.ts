import { getProjects } from "@/lib/storage";

export function getWeekTasks() {
  const projects = getProjects();

  const tasks: any[] = [];

  for (const p of projects) {
    for (const t of p.tasks) {
      if (!t.date) continue;

      tasks.push({
        ...t,
        projectTitle: p.title,
      });
    }
  }

  return tasks;
}