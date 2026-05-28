import {
  getProjects,
  saveProjects,
  type Project,
  type Task,
} from "@/lib/storage";

const MAX_PER_DAY = 2;

export function autoSchedule() {
  const projects = getProjects();

  const tasks: Array<{ projectId: string; taskId: string }> = [];

  for (const p of projects) {
    for (const t of p.tasks) {
      if (!t.completed) {
        tasks.push({ projectId: p.id, taskId: t.id });
      }
    }
  }

  const today = new Date();
  let index = 0;

  const updated: Project[] = projects.map((p) => {
    return {
      ...p,
      tasks: p.tasks.map((t: Task) => {
        if (t.completed) return t;

        const current = tasks[index];
        if (!current) return t;

        index++;

        const offset = Math.floor(
          index / MAX_PER_DAY
        );

        const d = new Date(today);
        d.setDate(today.getDate() + offset);

        return {
          ...t,
          date: d.toISOString().split("T")[0],
        };
      }),
    };
  });

  saveProjects(updated);
  return updated;
}