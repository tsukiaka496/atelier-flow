"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  getProjects,
  Project,
} from "@/lib/storage";

import ThemedMain from "@/components/ThemedMain";
import { theme } from "@/lib/themeClasses";

type SortType =
  | "deadline"
  | "updated"
  | "progress";

export default function ProjectsPage() {
  const [projects, setProjects] =
    useState<Project[]>([]);

  const [sortType, setSortType] =
    useState<SortType>("deadline");

  const [showCompleted, setShowCompleted] =
    useState(false);

  useEffect(() => {
    setProjects(getProjects());

    const savedSort =
      localStorage.getItem(
        "atelier-sort"
      ) as SortType | null;

    const savedCompleted =
      localStorage.getItem(
        "atelier-show-completed"
      );

    if (savedSort) {
      setSortType(savedSort);
    }

    if (savedCompleted) {
      setShowCompleted(
        savedCompleted === "true"
      );
    }
  }, []);

  function getDaysLeft(deadline: string) {
    if (!deadline) return 999999;

    const today = new Date();

    const end = new Date(deadline);

    const diff =
      end.getTime() - today.getTime();

    return Math.ceil(
      diff / (1000 * 60 * 60 * 24)
    );
  }

  function getProgress(project: Project) {
    if (project.tasks.length === 0) {
      return 0;
    }

    const completed =
      project.tasks.filter(
        (task) => task.completed
      ).length;

    return Math.round(
      (completed / project.tasks.length) *
        100
    );
  }

  function isCompleted(project: Project) {
    return getProgress(project) === 100;
  }

  function changeSort(type: SortType) {
    setSortType(type);

    localStorage.setItem(
      "atelier-sort",
      type
    );
  }

  function toggleCompleted() {
    const newValue = !showCompleted;

    setShowCompleted(newValue);

    localStorage.setItem(
      "atelier-show-completed",
      String(newValue)
    );
  }

  const filteredProjects = projects.filter(
    (project) => {

      if (!showCompleted) {
        return !isCompleted(project);
      }

      return true;
    }
  );

  const sortedProjects = [
    ...filteredProjects,
  ].sort((a, b) => {

    if (sortType === "deadline") {
      return (
        getDaysLeft(a.deadline) -
        getDaysLeft(b.deadline)
      );
    }

    if (sortType === "progress") {
      return (
        getProgress(b) -
        getProgress(a)
      );
    }

    return 0;
  });

  return (
    <ThemedMain className="px-5 py-8 pb-32">

      <div className="mx-auto max-w-md">

        {/* タイトル */}
        <div className="mb-6">

          <h1 className="text-2xl font-semibold">
            案件
          </h1>

        </div>

        {/* フィルター */}
        <div
          className="
            mb-5

            flex
            flex-wrap
            gap-2
          "
        >

          {/* 納期 */}
          <button
            onClick={() =>
              changeSort("deadline")
            }

            className="
              rounded-full

              px-4
              py-2

              text-sm

              transition-all
            "

            style={{
              background:
                sortType === "deadline"
                  ? "var(--theme-accent)"
                  : "rgba(255,255,255,0.7)",

              color:
                sortType === "deadline"
                  ? "white"
                  : "#52525b",
            }}
          >
            納期順
          </button>

          {/* 進捗 */}
          <button
            onClick={() =>
              changeSort("progress")
            }

            className="
              rounded-full

              px-4
              py-2

              text-sm

              transition-all
            "

            style={{
              background:
                sortType === "progress"
                  ? "var(--theme-accent)"
                  : "rgba(255,255,255,0.7)",

              color:
                sortType === "progress"
                  ? "white"
                  : "#52525b",
            }}
          >
            進捗順
          </button>

          {/* 完了表示 */}
          <button
            onClick={toggleCompleted}

            className="
              rounded-full

              px-4
              py-2

              text-sm

              transition-all
            "

            style={{
              background:
                showCompleted
                  ? "var(--theme-accent)"
                  : "rgba(255,255,255,0.7)",

              color:
                showCompleted
                  ? "white"
                  : "#52525b",
            }}
          >
            完了済み表示
          </button>

        </div>

        {/* 案件一覧 */}
        <div className="space-y-4">

          {sortedProjects.length === 0 && (
            <div
              className="
                rounded-[28px]

                border border-dashed border-zinc-300

                bg-white/70

                p-8

                text-center
                text-sm
                text-zinc-400
              "
            >
              表示できる案件がありません
            </div>
          )}

          {sortedProjects.map((project) => {

            const daysLeft =
              getDaysLeft(
                project.deadline
              );

            const progress =
              getProgress(project);

            return (
              <Link
                href={`/projects/${project.id}`}

                key={project.id}

                className="
                  block

                  rounded-[30px]

                  border border-white/60

                  bg-white/75

                  p-5

                  backdrop-blur-xl

                  shadow-[0_6px_24px_rgba(0,0,0,0.04)]

                  transition-all
                "
              >

                <div className="flex items-start justify-between">

                  <div className="flex gap-3">

                    {/* 色 */}
                    <div
                      className="
                        mt-1
                        h-3
                        w-3
                        rounded-full
                      "
                      style={{
                        background:
                          project.color,
                      }}
                    />

                    <div>

                      {/* 依頼主 */}
                      <h2 className="text-[15px] font-medium">
                        {project.client ||
                          "依頼主なし"}
                      </h2>

                      {/* 内容 */}
                      <p className="mt-1 text-sm text-zinc-400">
                        {project.title ||
                          "依頼内容なし"}
                      </p>

                      {/* 作業 */}
                      <div className="mt-3 flex flex-wrap gap-2">

                        {project.tasks.map(
                          (task) => (

                            <div
                              key={task.id}

                              className="
                                rounded-xl

                                px-3
                                py-1

                                text-xs

                                transition-all
                              "

                              style={{
                                background:
                                  task.completed
                                    ? `${project.color}20`
                                    : "#f4f4f5",

                                color:
                                  task.completed
                                    ? project.color
                                    : "#52525b",

                                border:
                                  task.completed
                                    ? `1px solid ${project.color}`
                                    : "none",
                              }}
                            >
                              {task.title}
                            </div>

                          )
                        )}

                      </div>

                    </div>

                  </div>

                  {/* 右 */}
                  <div className="text-right">

                    <p
                      className="text-sm font-medium"
                      style={{
                        color:
                          project.color,
                      }}
                    >
                      {progress}%
                    </p>

                    <p className="mt-1 text-xs text-zinc-400">

                      {project.deadline
                        ? `あと${daysLeft}日`
                        : "納期なし"}

                    </p>

                  </div>

                </div>

              </Link>
            );
          })}

          {/* 追加 */}
          <Link
            href="/projects/new"

            className="
              flex
              items-center
              justify-center

              rounded-[30px]

              border border-dashed border-zinc-300

              bg-white/70

              py-6

              text-2xl
              text-zinc-400
            "
          >
            ＋
          </Link>

        </div>

      </div>

      {/* 下バー */}
<div
  className="
    fixed
    bottom-5
    left-1/2
    -translate-x-1/2

    flex
    items-center
    justify-between

    w-[92%]
    max-w-md

    rounded-[30px]

    border border-white/60
    bg-white/70

    px-6
    py-4

    backdrop-blur-xl

    shadow-[0_8px_30px_rgba(0,0,0,0.08)]
  "
>

  <Link
    href="/"
    className="text-sm text-zinc-500"
  >
    ホーム
  </Link>

  <Link
    href="/projects"
    className={theme.navActive}
  >
    案件
  </Link>

  <Link
    href="/month"
    className="text-sm text-zinc-500"
  >
    月
  </Link>

  <Link
  href="/settings"
  className="text-sm text-zinc-500"
>
  設定
</Link>

</div>

    </ThemedMain>
  );
}