import { getProjects, saveProjects } from "@/lib/storage";

const MAX_PER_DAY = 2;

export function autoSchedule() {
  const projects = getProjects();

  // 未完了タスクを全部フラット化
  let tasks: any[] = [];

  projects.forEach((p: any) => {
    p.tasks.forEach((t: any) => {
      if (!t.done) {
        tasks.push({
          projectId: p.id,
          taskId: t.id,
          priority: t.priority ?? 1,
        });
      }
    });
  });

  // ★ここが重要：優先度順に並べる
  tasks.sort((a, b) => {
    return b.priority - a.priority;
  });

  const today = new Date();
  let index = 0;

  const updated = projects.map((p: any) => {
    return {
      ...p,
      tasks: p.tasks.map((t: any) => {
        if (t.done) return t;

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