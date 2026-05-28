import {
  DEFAULT_PROJECT_COLOR,
  type Project,
} from "@/lib/storage";

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(
    2,
    "0"
  );
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function createTutorialSampleProjects(): Project[] {
  const today = new Date();
  const in3 = new Date(today);
  in3.setDate(today.getDate() + 3);
  const in7 = new Date(today);
  in7.setDate(today.getDate() + 7);
  const in14 = new Date(today);
  in14.setDate(today.getDate() + 14);

  return [
    {
      id: "tutorial-sample-1",
      client: "歌い手さん",
      title: "歌ってみたMV",
      color: DEFAULT_PROJECT_COLOR,
      deadline: formatDate(in14),
      tasks: [
        {
          id: "tutorial-sample-1-task-1",
          title: "ラフ提出",
          completed: false,
          date: formatDate(in3),
        },
        {
          id: "tutorial-sample-1-task-2",
          title: "線画",
          completed: false,
          date: "",
        },
        {
          id: "tutorial-sample-1-task-3",
          title: "仕上げ",
          completed: false,
          date: formatDate(in7),
        },
      ],
    },
    {
      id: "tutorial-sample-2",
      client: "個人依頼",
      title: "SNSアイコン",
      color: DEFAULT_PROJECT_COLOR,
      deadline: formatDate(in7),
      tasks: [
        {
          id: "tutorial-sample-2-task-1",
          title: "ヒアリング",
          completed: true,
          date: formatDate(today),
        },
        {
          id: "tutorial-sample-2-task-2",
          title: "清書",
          completed: false,
          date: "",
        },
      ],
    },
    {
      id: "tutorial-sample-3",
      client: "ゲーム案件",
      title: "SDキャラ 3体",
      color: DEFAULT_PROJECT_COLOR,
      deadline: "",
      tasks: [
        {
          id: "tutorial-sample-3-task-1",
          title: "表情差分",
          completed: false,
          date: "",
        },
      ],
    },
  ];
}

