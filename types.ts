export type Task = {
  id: number;
  title: string;
  date: string;

  // 仕事・バイト・休み・未定
  workStatus: "仕事" | "バイト" | "休み" | "未定";
};

export type Project = {
  id: number;

  // 依頼主名
  title: string;

  // 識別カラー
  color: string;

  tasks: Task[];
};