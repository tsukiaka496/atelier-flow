"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  getProjects,
  saveProjects,
  Project,
} from "@/lib/storage";

import ThemedMain from "@/components/ThemedMain";

export default function ProjectDetailPage() {
  const params = useParams();

  const router = useRouter();

  const [project, setProject] =
    useState<Project | null>(null);

  useEffect(() => {
    const projects = getProjects();

    const found = projects.find(
      (p) => p.id === params.id
    );

    if (found) {
      setProject(found);
    }
  }, [params.id]);

  if (!project) {
    return (
      <ThemedMain className="p-6">
        <p className="text-zinc-400">
          読み込み中...
        </p>
      </ThemedMain>
    );
  }

  const currentProject = project;

  function getProgress() {
    if (
      currentProject.tasks.length === 0
    ) {
      return 0;
    }

    const completed =
      currentProject.tasks.filter(
        (task) => task.completed
      ).length;

    return Math.round(
      (
        completed /
        currentProject.tasks.length
      ) *
        100
    );
  }

  function getDaysLeft() {
    if (!currentProject.deadline) {
      return null;
    }

    const today = new Date();

    const end = new Date(
      currentProject.deadline
    );

    const diff =
      end.getTime() - today.getTime();

    return Math.ceil(
      diff / (1000 * 60 * 60 * 24)
    );
  }

  function getTaskDaysLeft(
    date: string
  ) {
    if (!date) return null;

    const today = new Date();

    const target = new Date(date);

    const diff =
      target.getTime() -
      today.getTime();

    return Math.ceil(
      diff / (1000 * 60 * 60 * 24)
    );
  }

  function formatDeadline(
    deadline: string
  ) {
    if (!deadline) {
      return "納期なし";
    }

    const date = new Date(deadline);

    const month =
      date.getMonth() + 1;

    const day = date.getDate();

    return `${month}月${day}日`;
  }

  function toggleTask(taskId: string) {
    const updatedProject: Project = {
      ...currentProject,

      tasks:
        currentProject.tasks.map(
          (task) => {

            if (
              task.id !== taskId
            ) {
              return task;
            }

            return {
              ...task,

              completed:
                !task.completed,
            };
          }
        ),
    };

    const projects = getProjects();

    const updatedProjects =
      projects.map((p) =>
        p.id === updatedProject.id
          ? updatedProject
          : p
      );

    saveProjects(updatedProjects);

    setProject(updatedProject);
  }

  function deleteProject() {
    const confirmDelete =
      confirm(
        "この案件を削除しますか？"
      );

    if (!confirmDelete) return;

    const projects = getProjects();

    const filtered =
      projects.filter(
        (p) =>
          p.id !==
          currentProject.id
      );

    saveProjects(filtered);

    router.push("/projects");
  }

  const progress = getProgress();

  const daysLeft = getDaysLeft();

  return (
    <ThemedMain className="px-5 py-8 pb-32">

      <div className="mx-auto max-w-md">

        {/* 上 */}
        <div className="mb-6 flex items-center justify-between">

          <Link
            href="/projects"
            className="
              rounded-full
              bg-white/70
              px-4
              py-2
              text-sm
              text-zinc-500
              backdrop-blur-xl
              shadow-[0_2px_10px_rgba(0,0,0,0.04)]
            "
          >
            ← 戻る
          </Link>

          <div className="flex gap-2">

            <Link
              href={`/projects/${currentProject.id}/edit`}
              className="
                rounded-full
                bg-white/70
                px-4
                py-2
                text-sm
                text-zinc-500
                backdrop-blur-xl
                shadow-[0_2px_10px_rgba(0,0,0,0.04)]
              "
            >
              編集
            </Link>

            <button
              onClick={deleteProject}
              className="
                rounded-full
                bg-red-100
                px-4
                py-2
                text-sm
                text-red-500
              "
            >
              削除
            </button>

          </div>

        </div>

        {/* メイン */}
        <div
          className="
            relative
            overflow-hidden
            rounded-[38px]
            border border-white/60
            bg-white/75
            p-6
            backdrop-blur-2xl
            shadow-[0_10px_40px_rgba(0,0,0,0.06)]
          "
        >

          {/* 背景 */}
          <div
            className="
              pointer-events-none
              absolute
              inset-0
              bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_35%)]
              opacity-80
            "
          />

          <div className="relative z-10">

            {/* 上 */}
            <div className="flex items-start justify-between">

              <div className="flex gap-3">

                <div
                  className="
                    mt-1
                    h-3
                    w-3
                    rounded-full
                  "
                  style={{
                    background:
                      currentProject.color,
                  }}
                />

                <div>

                  <h1 className="text-xl font-semibold">
                    {currentProject.client}
                  </h1>

                  <p className="mt-2 text-sm text-zinc-400">
                    {currentProject.title}
                  </p>

                </div>

              </div>

              {/* 進捗 */}
              <div className="text-right">

                <p
                  className="text-lg font-semibold"
                  style={{
                    color:
                      currentProject.color,
                  }}
                >
                  {progress}%
                </p>

                <p className="mt-1 text-xs text-zinc-400">

                  {daysLeft !== null
                    ? `あと${daysLeft}日`
                    : "納期なし"}

                </p>

              </div>

            </div>

            {/* 納期 */}
            <div className="mt-6">

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  bg-white/70
                  px-4
                  py-2
                  text-sm
                  text-zinc-500
                  shadow-[0_2px_10px_rgba(0,0,0,0.03)]
                "
              >
                <span>納期</span>

                <span className="text-zinc-800">
                  {formatDeadline(
                    currentProject.deadline
                  )}
                </span>

              </div>

            </div>

            {/* バー */}
            <div className="mt-6">

              <div
                className="
                  h-3
                  overflow-hidden
                  rounded-full
                  bg-white
                  shadow-inner
                "
              >

                <div
                  className="
                    h-full
                    rounded-full
                    transition-all
                  "
                  style={{
                    width: `${progress}%`,
                    background:
                      currentProject.color,
                  }}
                />

              </div>

            </div>

          </div>

        </div>

        {/* 作業 */}
        <div className="mt-6">

          <div className="mb-4 flex items-center justify-between">

            <h2 className="text-lg font-semibold">
              作業
            </h2>

            <p className="text-sm text-zinc-400">
              {
                currentProject.tasks.filter(
                  (task) =>
                    task.completed
                ).length
              }
              /
              {currentProject.tasks.length}
            </p>

          </div>

          <div className="space-y-3">

            {currentProject.tasks.map(
              (task) => {

                const taskDaysLeft =
                  getTaskDaysLeft(
                    task.date
                  );

                return (

                  <button
                    key={task.id}

                    onClick={() =>
                      toggleTask(
                        task.id
                      )
                    }

                    className="
                      w-full
                      rounded-[24px]
                      border border-white/60
                      bg-white/70
                      p-4
                      text-left
                      backdrop-blur-xl
                      transition-all
                    "

                    style={{
                      borderColor:
                        task.completed
                          ? `${currentProject.color}50`
                          : undefined,

                      background:
                        task.completed
                          ? `${currentProject.color}12`
                          : undefined,
                    }}
                  >

                    <div className="flex items-start justify-between">

                      <div>

                        <p
                          className="
                            text-sm
                            font-medium
                            transition-all
                          "

                          style={{
                            color:
                              task.completed
                                ? currentProject.color
                                : undefined,
                          }}
                        >
                          {task.title}
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <p className="text-xs text-zinc-400">

                            {task.date
                              ? task.date
                              : "日付なし"}

                          </p>

                          {task.date && (

                            <div
                              className="
                                rounded-full
                                bg-zinc-100
                                px-2
                                py-1
                                text-[10px]
                                text-zinc-500
                              "
                            >

                              {taskDaysLeft === 0
                                ? "今日"
                                : `あと${taskDaysLeft}日`}

                            </div>

                          )}

                        </div>

                      </div>

                      {/* チェック */}
                      <div
                        className="
                          flex
                          h-6
                          w-6
                          items-center
                          justify-center
                          rounded-full
                          border
                          text-xs
                          transition-all
                        "

                        style={{
                          background:
                            task.completed
                              ? currentProject.color
                              : "transparent",

                          borderColor:
                            task.completed
                              ? currentProject.color
                              : "#d4d4d8",

                          color:
                            task.completed
                              ? "white"
                              : "transparent",
                        }}
                      >
                        ✓
                      </div>

                    </div>

                  </button>

                );
              }
            )}

          </div>

        </div>

      </div>

    </ThemedMain>
  );
}