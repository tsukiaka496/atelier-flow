import {
  DEFAULT_PROJECT_COLOR,
  normalizeProjectColor,
  type Project,
  type Task,
} from "@/lib/storage";

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function endOfNextMonth(base: Date) {
  const y = base.getFullYear();
  const m = base.getMonth();
  // next month last day: (month+2, day 0)
  return new Date(y, m + 2, 0);
}

export function createTutorialProjectDraft(now = new Date()): {
  project: Pick<Project, "client" | "title" | "deadline" | "color" | "isTutorial">;
  tasks: Array<Pick<Task, "title" | "date">>;
} {
  const deadline = formatDate(endOfNextMonth(now));

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const taskTitles = [
    "大ラフ",
    "ラフ",
    "線画",
    "下塗り",
    "着色",
    "予備日",
  ];

  const tasks = taskTitles.map((title, i) => {
    const d = new Date(tomorrow);
    d.setDate(tomorrow.getDate() + i);
    return { title, date: formatDate(d) };
  });

  // pastel-ish purple (project color, NOT tutorial UI)
  const pastelPurple = normalizeProjectColor("#c4b5fd") || DEFAULT_PROJECT_COLOR;

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

