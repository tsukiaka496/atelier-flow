import {
  DEFAULT_PROJECT_COLOR,
  normalizeProjectColor,
  type Project,
  type Task,
} from "@/lib/storage";
import { addDaysToDateString, formatLocalDate } from "@/lib/taskPlan";

function endOfNextMonth(base: Date) {
  const y = base.getFullYear();
  const m = base.getMonth();

  return new Date(y, m + 2, 0);
}

/** チュートリアル用：日付の間隔と同日グループの例に近い並び */
const TUTORIAL_TASK_PLAN: Array<{
  title: string;
  dayOffset: number;
}> = [
  { title: "ラフ", dayOffset: 0 },
  { title: "線画", dayOffset: 5 },
  { title: "下塗り", dayOffset: 6 },
  { title: "下塗り（仕上げ）", dayOffset: 6 },
  { title: "着色", dayOffset: 7 },
  { title: "その他", dayOffset: 8 },
];

export function createTutorialProjectDraft(now = new Date()): {
  project: Pick<
    Project,
    "client" | "title" | "deadline" | "color" | "isTutorial"
  >;
  tasks: Array<Pick<Task, "title" | "date">>;
} {
  const baseDay = formatLocalDate(now);
  const deadline = formatLocalDate(
    endOfNextMonth(now)
  );

  const tasks = TUTORIAL_TASK_PLAN.map(
    (item) => ({
      title: item.title,
      date: addDaysToDateString(
        baseDay,
        item.dayOffset
      ),
    })
  );

  const pastelPurple =
    normalizeProjectColor("#c4b5fd") ||
    DEFAULT_PROJECT_COLOR;

  return {
    project: {
      client: "月紅りん",
      title: "MVイラスト",
      deadline,
      color: pastelPurple,
      isTutorial: true,
    },
    tasks,
  };
}
