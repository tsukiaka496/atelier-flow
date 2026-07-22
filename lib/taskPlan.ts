import type { Project, ScheduleSlot, Task } from "@/lib/storage";
import {
  getSlotsForDate,
  getTasksForDate,
  getUnscheduledTasks,
} from "@/lib/scheduleHelpers";

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function addDaysToDateString(
  dateStr: string,
  days: number
): string {
  const base = new Date(`${dateStr}T12:00:00`);
  base.setDate(base.getDate() + days);
  return formatLocalDate(base);
}

export type HomeEnrichedTask = {
  task: Task;
  projectId: string;
  projectTitle: string;
  projectColor: string;
  client: string;
};

/** 複数案件から指定日の作業を enrich して返す */
export function getEnrichedTasksForDate(
  projects: Project[],
  date: string
): HomeEnrichedTask[] {
  const result: HomeEnrichedTask[] = [];

  for (const project of projects) {
    const slots = getSlotsForDate(project.schedule, date);

    for (const slot of slots) {
      if (!slot.taskId) continue;
      const task = project.tasks.find((t) => t.id === slot.taskId);
      if (!task) continue;

      result.push({
        task,
        projectId: project.id,
        projectTitle: project.title,
        projectColor: project.color,
        client: project.client,
      });
    }
  }

  return result;
}

export function getEnrichedUnscheduledTasks(
  projects: Project[]
): HomeEnrichedTask[] {
  const result: HomeEnrichedTask[] = [];

  for (const project of projects) {
    const unscheduled = getUnscheduledTasks(project);

    for (const task of unscheduled) {
      result.push({
        task,
        projectId: project.id,
        projectTitle: project.title,
        projectColor: project.color,
        client: project.client,
      });
    }
  }

  return result;
}

export function isTaskOverdue(
  projects: Project[],
  taskId: string,
  today: string
): boolean {
  for (const project of projects) {
    const slots = project.schedule.filter(
      (slot) => slot.taskId === taskId && slot.date
    );

    for (const slot of slots) {
      if (slot.date < today) {
        const task = project.tasks.find((t) => t.id === taskId);
        if (task && !task.completed) {
          return true;
        }
      }
    }
  }

  return false;
}

export function getOverdueEnrichedTasks(
  projects: Project[],
  today: string
): HomeEnrichedTask[] {
  const seen = new Set<string>();
  const result: HomeEnrichedTask[] = [];

  for (const project of projects) {
    for (const slot of project.schedule) {
      if (!slot.taskId || !slot.date || slot.date >= today) {
        continue;
      }

      if (seen.has(slot.taskId)) continue;

      const task = project.tasks.find((t) => t.id === slot.taskId);
      if (!task || task.completed) continue;

      seen.add(slot.taskId);
      result.push({
        task,
        projectId: project.id,
        projectTitle: project.title,
        projectColor: project.color,
        client: project.client,
      });
    }
  }

  return result;
}

export function getTasksForDateFromProjects(
  projects: Project[],
  date: string
): Task[] {
  return getTasksForDate(projects, date);
}

export function sortScheduleByDate(
  schedule: ScheduleSlot[]
): ScheduleSlot[] {
  return [...schedule].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}
