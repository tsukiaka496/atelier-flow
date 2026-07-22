import {
  DEFAULT_PROJECT_COLOR,
  type ScheduleSlot,
  type Task,
} from "@/lib/storage";
import {
  createScheduleSlot,
  ensureTaskScheduleSlots,
} from "@/lib/scheduleHelpers";

const TEMPLATE_TASK_TITLES = [
  "ラフ",
  "線画",
  "着色",
  "納品",
] as const;

/** 案件作成画面用のサンプル下書き（SNSアイコン） */
export function createProjectTemplateDraft(): {
  client: string;
  title: string;
  deadline: string;
  color: string;
  tasks: Task[];
  schedule: ScheduleSlot[];
} {
  const tasks: Task[] = TEMPLATE_TASK_TITLES.map(
    (title) => ({
      id: crypto.randomUUID(),
      title,
      completed: false,
    })
  );

  const schedule = ensureTaskScheduleSlots(
    tasks,
    tasks.map((task) =>
      createScheduleSlot("", task.id)
    )
  );

  return {
    client: "個人依頼",
    title: "SNSアイコン制作",
    deadline: "",
    color: DEFAULT_PROJECT_COLOR,
    tasks,
    schedule,
  };
}
