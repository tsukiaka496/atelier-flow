import type {
  Project,
  ScheduleSlot,
  Task,
} from "@/lib/storage";

function asProjects(
  projectOrProjects: Project | Project[]
): Project[] {
  return Array.isArray(projectOrProjects)
    ? projectOrProjects
    : [projectOrProjects];
}

/** 指定日の schedule スロット */
export function getSlotsForDate(
  schedule: ScheduleSlot[],
  date: string
): ScheduleSlot[] {
  return schedule.filter(
    (slot) => slot.date === date
  );
}

/**
 * 指定日に割り当てられた作業。
 * schedule スロットの taskId 経由で解決する。
 */
export function getTasksForDate(
  projectOrProjects: Project | Project[],
  date: string
): Task[] {
  const projects = asProjects(projectOrProjects);
  const result: Task[] = [];

  for (const project of projects) {
    const slots = getSlotsForDate(
      project.schedule,
      date
    );

    for (const slot of slots) {
      if (!slot.taskId) {
        continue;
      }

      const task = project.tasks.find(
        (item) => item.id === slot.taskId
      );

      if (task) {
        result.push(task);
      }
    }
  }

  return result;
}

/** 日付未設定（未定）の作業、またはスロット未作成の作業 */
export function getUnscheduledTasks(
  projectOrProjects: Project | Project[]
): Task[] {
  const projects = asProjects(projectOrProjects);
  const result: Task[] = [];

  for (const project of projects) {
    for (const task of project.tasks) {
      const slot = getPrimarySlotForTask(
        project.schedule,
        task.id
      );

      if (!slot || !slot.date) {
        result.push(task);
      }
    }
  }

  return result;
}

export function createScheduleSlot(
  date: string,
  taskId?: string
): ScheduleSlot {
  const slot: ScheduleSlot = {
    id: crypto.randomUUID(),
    date,
  };

  if (taskId !== undefined) {
    slot.taskId = taskId;
  }

  return slot;
}

/** 作業に紐づく主スロット（日付あり優先） */
export function getPrimarySlotForTask(
  schedule: ScheduleSlot[],
  taskId: string
): ScheduleSlot | undefined {
  const linked = schedule.filter(
    (slot) => slot.taskId === taskId
  );

  if (linked.length === 0) {
    return undefined;
  }

  return (
    linked.find((slot) => Boolean(slot.date)) ??
    linked[0]
  );
}

/** 作業ごとの日程（空文字＝未定）。スロットが無ければ追加 */
export function upsertTaskDate(
  schedule: ScheduleSlot[],
  taskId: string,
  date: string
): ScheduleSlot[] {
  const linked = schedule.filter(
    (slot) => slot.taskId === taskId
  );

  if (linked.length === 0) {
    return [
      ...schedule,
      createScheduleSlot(date, taskId),
    ];
  }

  const primary =
    linked.find((slot) => Boolean(slot.date)) ??
    linked[0];

  return schedule
    .filter(
      (slot) =>
        slot.taskId !== taskId ||
        slot.id === primary.id
    )
    .map((slot) =>
      slot.id === primary.id
        ? {
            ...slot,
            date,
            taskId,
          }
        : slot
    );
}

/** 全作業にスロットが付くよう補完（日付空＝未定） */
export function ensureTaskScheduleSlots(
  tasks: Task[],
  schedule: ScheduleSlot[]
): ScheduleSlot[] {
  let next = [...schedule];

  for (const task of tasks) {
    if (
      !next.some(
        (slot) => slot.taskId === task.id
      )
    ) {
      next.push(
        createScheduleSlot("", task.id)
      );
    }
  }

  return next;
}

/** 作業に紐づくスロットを日程順で（未作成分は補完） */
export function getOrderedTaskSlots(
  tasks: Task[],
  schedule: ScheduleSlot[]
): ScheduleSlot[] {
  return ensureTaskScheduleSlots(
    tasks,
    schedule
  ).filter((slot) => Boolean(slot.taskId));
}

/**
 * 行インデックスで作業と日付を対応付けて保存する。
 * 左右で別々に並べ替えたあとも、表示と taskId の紐づきを揃える。
 */
export function pairTasksWithScheduleSlots(
  tasks: Task[],
  taskSlots: ScheduleSlot[],
  otherSlots: ScheduleSlot[] = []
): ScheduleSlot[] {
  const paired = tasks.map((task, index) => {
    const slot = taskSlots[index];

    if (slot) {
      return {
        ...slot,
        taskId: task.id,
        date: slot.date ?? "",
      };
    }

    return createScheduleSlot("", task.id);
  });

  return [...paired, ...otherSlots];
}

/** 作業削除時に紐づくスロットも除去 */
export function removeSlotsForTask(
  schedule: ScheduleSlot[],
  taskId: string
): ScheduleSlot[] {
  return schedule.filter(
    (slot) => slot.taskId !== taskId
  );
}
