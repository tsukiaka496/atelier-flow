import type { Project, Task } from "@/lib/storage";

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

export type DateGroup = {
  date: string;
  count: number;
};

export type TaskPlanSegment = {
  task: Task;
  index: number;
};

/** 作業順で、連続する同日を1グループに（予定なしはグループを分断） */
export function splitDateGroups(
  taskDates: string[]
): DateGroup[] {
  const groups: DateGroup[] = [];

  for (const date of taskDates) {
    if (!date) {
      groups.push({ date: "", count: 1 });
      continue;
    }

    const last = groups[groups.length - 1];

    if (last && last.date === date) {
      last.count += 1;
      continue;
    }

    groups.push({ date, count: 1 });
  }

  return groups;
}

export function flattenDateGroups(
  groups: DateGroup[]
): string[] {
  return groups.flatMap((group) =>
    Array.from(
      { length: group.count },
      () => group.date
    )
  );
}

/** 案件で使っている予定日（作業順・重複なし・予定なしは除く） */
export function getProjectScheduleDates(
  tasks: Task[]
): string[] {
  return splitDateGroups(
    tasks.map((task) => task.date)
  )
    .map((group) => group.date)
    .filter(Boolean);
}

export function isAddDateAllowed(
  tasks: Task[],
  addDate: string
): boolean {
  if (!addDate) {
    return false;
  }

  return !getProjectScheduleDates(tasks).includes(
    addDate
  );
}

function findChronologicalInsertIndex(
  dates: string[],
  newDate: string
): number {
  for (let i = 0; i < dates.length; i++) {
    if (newDate < dates[i]) {
      return i;
    }
  }

  return dates.length;
}

type DateGroupWithTasks = {
  date: string;
  tasks: TaskPlanSegment[];
};

/** 予定ありの作業だけを、作業順でグループ化 */
function buildDatedGroups(
  tasks: Task[]
): DateGroupWithTasks[] {
  const groups: DateGroupWithTasks[] = [];

  tasks.forEach((task, index) => {
    if (!task.date) {
      return;
    }

    const last = groups[groups.length - 1];

    if (last && last.date === task.date) {
      last.tasks.push({ task, index });
      return;
    }

    groups.push({
      date: task.date,
      tasks: [{ task, index }],
    });
  });

  return groups;
}

/** 予定ありの枠だけを、日付の早い順に並べ替え（予定なしの位置はそのまま） */
export function reorderDatedTasksChronologically(
  tasks: Task[]
): Task[] {
  const datedSlots = tasks
    .map((task, index) => ({
      task,
      index,
    }))
    .filter((item) => item.task.date);

  if (datedSlots.length === 0) {
    return tasks;
  }

  const sorted = [...datedSlots].sort((a, b) => {
    const byDate = a.task.date.localeCompare(
      b.task.date
    );

    if (byDate !== 0) {
      return byDate;
    }

    return a.index - b.index;
  });

  const result = [...tasks];

  datedSlots.forEach((slot, order) => {
    result[slot.index] = sorted[order].task;
  });

  return result;
}

export function areTaskDatesMonotonic(
  tasks: Task[]
): boolean {
  let last = "";

  for (const task of tasks) {
    if (!task.date) {
      continue;
    }

    if (last && task.date < last) {
      return false;
    }

    last = task.date;
  }

  return true;
}

export type RescheduleValidation = {
  ok: boolean;
  reason?: string;
};

export function validateRescheduleInput(
  tasks: Task[],
  removeDate: string,
  addDate: string
): RescheduleValidation {
  if (!removeDate || !addDate) {
    return {
      ok: false,
      reason: "外す日と足す日を選んでください。",
    };
  }

  if (removeDate === addDate) {
    return {
      ok: false,
      reason: "外す日と足す日は別の日にしてください。",
    };
  }

  const scheduleDates =
    getProjectScheduleDates(tasks);

  if (!scheduleDates.includes(removeDate)) {
    return {
      ok: false,
      reason: "外す日が案件の予定にありません。",
    };
  }

  if (!isAddDateAllowed(tasks, addDate)) {
    return {
      ok: false,
      reason:
        "足す日は、まだこの案件で使っていない日だけ選べます。",
    };
  }

  const datedGroups = buildDatedGroups(tasks);

  if (datedGroups.length === 0) {
    return {
      ok: false,
      reason:
        "予定日が付いた作業がないため、組み直せません。",
    };
  }

  return { ok: true };
}

/**
 * 外す日を案件の予定列から除き、足す日を時系列で入れる。
 * 未完了の作業だけ日付を更新。完了済み・予定なしはそのまま。
 */
export function rescheduleByRemoveAndAdd(
  tasks: Task[],
  removeDate: string,
  addDate: string
): string[] | null {
  const validation = validateRescheduleInput(
    tasks,
    removeDate,
    addDate
  );

  if (!validation.ok) {
    return null;
  }

  const datedGroups = buildDatedGroups(tasks);
  const timeline = datedGroups.map(
    (group) => group.date
  );
  const withoutRemoved = timeline.filter(
    (date) => date !== removeDate
  );
  const insertIndex = findChronologicalInsertIndex(
    withoutRemoved,
    addDate
  );
  const nextTimeline = [...withoutRemoved];

  nextTimeline.splice(insertIndex, 0, addDate);

  if (nextTimeline.length !== datedGroups.length) {
    return null;
  }

  const dateByOldGroup = new Map(
    datedGroups.map((group, index) => [
      group.date,
      nextTimeline[index],
    ])
  );

  return tasks.map((task) => {
    if (task.completed || !task.date) {
      return task.date;
    }

    const nextGroupDate = dateByOldGroup.get(
      task.date
    );

    return nextGroupDate ?? task.date;
  });
}

export type ReschedulePreviewRow = {
  taskId: string;
  title: string;
  completed: boolean;
  currentDate: string;
  nextDate: string;
  changed: boolean;
  skipped: boolean;
};

export function buildReschedulePreview(
  tasks: Task[],
  removeDate: string,
  addDate: string
): {
  rows: ReschedulePreviewRow[];
  validation: RescheduleValidation;
  nextTimelineLabel: string | null;
} {
  const validation = validateRescheduleInput(
    tasks,
    removeDate,
    addDate
  );

  if (!validation.ok) {
    return {
      rows: [],
      validation,
      nextTimelineLabel: null,
    };
  }

  const nextDates = rescheduleByRemoveAndAdd(
    tasks,
    removeDate,
    addDate
  );

  if (!nextDates) {
    return {
      rows: [],
      validation: {
        ok: false,
        reason: "組み直しを計算できませんでした。",
      },
      nextTimelineLabel: null,
    };
  }

  const datedGroups = buildDatedGroups(tasks);
  const timeline = datedGroups.map(
    (g) => g.date
  );
  const withoutRemoved = timeline.filter(
    (d) => d !== removeDate
  );
  const insertIndex = findChronologicalInsertIndex(
    withoutRemoved,
    addDate
  );
  const nextTimeline = [...withoutRemoved];

  nextTimeline.splice(insertIndex, 0, addDate);

  const rows = tasks.map((task, index) => {
    const nextDate =
      nextDates[index] ?? task.date;
    const skipped =
      task.completed || !task.date;

    return {
      taskId: task.id,
      title: task.title,
      completed: task.completed,
      currentDate: task.date,
      nextDate,
      changed:
        !skipped && nextDate !== task.date,
      skipped,
    };
  });

  return {
    rows,
    validation,
    nextTimelineLabel:
      formatPlanDayGroupSequence(nextDates),
  };
}

export function applyRescheduleToProject(
  project: Project,
  rows: ReschedulePreviewRow[]
): Project {
  const nextById = new Map(
    rows.map((row) => [
      row.taskId,
      row.nextDate,
    ])
  );

  const withDates = project.tasks.map(
    (task) => ({
      ...task,
      date:
        nextById.get(task.id) ?? task.date,
    })
  );

  return {
    ...project,
    tasks: reorderDatedTasksChronologically(
      withDates
    ),
  };
}

/** 予定日の並び（同日は 6/10×2、予定なしは ?） */
export function formatPlanDayGroupSequence(
  taskDates: string[]
): string {
  return splitDateGroups(taskDates)
    .map((group) => {
      if (!group.date) {
        return group.count > 1
          ? `?×${group.count}`
          : "?";
      }

      const month = Number(
        group.date.split("-")[1]
      );
      const day = Number(
        group.date.split("-")[2]
      );

      const label = `${month}/${day}`;

      return group.count > 1
        ? `${label}×${group.count}`
        : label;
    })
    .join(" → ");
}

export function suggestNewAddDate(
  tasks: Task[],
  today: string
): string {
  const used = new Set(
    getProjectScheduleDates(tasks)
  );

  let candidate = today;

  for (let i = 0; i < 366; i++) {
    if (!used.has(candidate)) {
      return candidate;
    }

    candidate = addDaysToDateString(
      candidate,
      1
    );
  }

  return today;
}

export function isTaskPlannedOn(
  task: Pick<Task, "date" | "completed">,
  day: string
): boolean {
  return Boolean(task.date) && task.date === day;
}

export function isTaskUnscheduled(
  task: Pick<Task, "date" | "completed">
): boolean {
  return !task.completed && !task.date;
}

export function isTaskOverdue(
  task: Pick<Task, "date" | "completed">,
  today: string
): boolean {
  return (
    Boolean(task.date) &&
    !task.completed &&
    task.date < today
  );
}

export function formatPlanDateLabel(
  dateStr: string,
  referenceDay: string
): string {
  if (!dateStr) {
    return "予定なし";
  }

  if (dateStr === referenceDay) {
    return "今日";
  }

  const tomorrow = addDaysToDateString(
    referenceDay,
    1
  );

  if (dateStr === tomorrow) {
    return "明日";
  }

  const [, month, day] = dateStr.split("-");

  return `${Number(month)}/${Number(day)}`;
}
