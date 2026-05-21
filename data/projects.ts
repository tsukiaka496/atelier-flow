import {
  DEFAULT_PROJECT_COLOR,
  type Project,
} from "@/lib/storage";

/** サンプルデータ（未使用・型の正本は lib/storage.ts） */
export const initialProjects: Project[] = [
  {
    id: "sample-1",
    client: "サンプル依頼主",
    title: "サンプル案件",
    color: DEFAULT_PROJECT_COLOR,
    deadline: "",
    tasks: [
      {
        id: "sample-task-1",
        title: "ラフ1",
        completed: false,
        date: "",
      },
      {
        id: "sample-task-2",
        title: "ラフ2",
        completed: false,
        date: "",
      },
      {
        id: "sample-task-3",
        title: "仕上げ",
        completed: false,
        date: "",
      },
    ],
  },
];
