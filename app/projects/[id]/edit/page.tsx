"use client";

import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  normalizeProject,
  normalizeProjectColor,
  Project,
  Task,
} from "@/lib/storage";
import { getProjectsRepo, saveProjectsRepo } from "@/lib/projectsRepo";

import {
  useState,
} from "react";

import ThemedMain from "@/components/ThemedMain";
import { theme } from "@/lib/themeClasses";
import DeadlineField from "@/components/DeadlineField";
import TaskScheduleDateInput from "@/components/TaskScheduleDateInput";

export default function EditProjectPage() {
  const params = useParams();

  const router = useRouter();

  const [project, setProject] =
    useState<Project | null>(() => {
      const id = String(params.id);
      const projects = getProjectsRepo();
      const found = projects.find((p) => p.id === id);
      return found ? normalizeProject(found) : null;
    });

  const [newTask, setNewTask] =
    useState("");

  const [newTaskDate, setNewTaskDate] =
    useState("");

  function updateField(
    key: keyof Project,
    value: string
  ) {
    if (!project) return;

    setProject({
      ...project,
      [key]: value,
    });
  }

  function addTask() {
    if (!project) return;

    if (!newTask.trim()) return;

    const task: Task = {
      id: crypto.randomUUID(),
      title: newTask,
      completed: false,
      date: newTaskDate,
    };

    setProject({
      ...project,
      tasks: [...project.tasks, task],
    });

    setNewTask("");
    setNewTaskDate("");
  }

  function deleteTask(taskId: string) {
    if (!project) return;

    setProject({
      ...project,

      tasks: project.tasks.filter(
        (task) => task.id !== taskId
      ),
    });
  }

  function moveTaskUp(index: number) {
    if (!project) return;

    if (index === 0) return;

    const tasks = [...project.tasks];

    [
      tasks[index - 1],
      tasks[index],
    ] = [
      tasks[index],
      tasks[index - 1],
    ];

    setProject({
      ...project,
      tasks,
    });
  }

  function moveTaskDown(index: number) {
    if (!project) return;

    if (
      index ===
      project.tasks.length - 1
    ) {
      return;
    }

    const tasks = [...project.tasks];

    [
      tasks[index + 1],
      tasks[index],
    ] = [
      tasks[index],
      tasks[index + 1],
    ];

    setProject({
      ...project,
      tasks,
    });
  }

  function updateTaskDate(
    taskId: string,
    value: string
  ) {
    if (!project) return;

    setProject({
      ...project,

      tasks: project.tasks.map(
        (task) => {

          if (task.id !== taskId) {
            return task;
          }

          return {
            ...task,
            date: value,
          };
        }
      ),
    });
  }

  function saveProject() {
    if (!project) return;

    const normalized =
      normalizeProject(project);

    const projects = getProjectsRepo();

    const updatedProjects =
      projects.map((p) =>
        p.id === normalized.id
          ? normalized
          : p
      );

    saveProjectsRepo(updatedProjects);

    router.push(
      `/projects/${project.id}`
    );
  }

  if (!project) {
    const exists = getProjectsRepo().some(
      (item) =>
        item.id === String(params.id)
    );

    if (!exists) {
      return (
        <ThemedMain className="px-5 py-8 pb-32">
          <div className="mx-auto max-w-md text-center">
            <p className="text-zinc-500 dark:text-zinc-400">
              案件が見つかりません
            </p>

            <Link
              href="/projects"
              className="mt-4 inline-block text-sm text-sky-600 dark:text-sky-400"
            >
              案件一覧へ戻る
            </Link>
          </div>
        </ThemedMain>
      );
    }

    return (
      <ThemedMain className="p-6">
        <p className="text-zinc-400 dark:text-zinc-500">
          読み込み中...
        </p>
      </ThemedMain>
    );
  }

  return (
    <ThemedMain className="px-5 py-8 pb-32">

      <div className="mx-auto max-w-md">

        {/* 戻る */}
        <Link
          href={`/projects/${project.id}`}
          className="
            mb-6
            inline-flex
            items-center
            gap-2

            rounded-full

            bg-white/70 dark:bg-zinc-900/75

            px-4
            py-2

            text-sm
            text-zinc-500 dark:text-zinc-400 dark:text-zinc-500

            backdrop-blur-xl

            shadow-[0_2px_10px_rgba(0,0,0,0.04)]
          "
        >
          ← 戻る
        </Link>

        {/* カード */}
        <div
          className="
            rounded-[38px]

            border border-white/60 dark:border-zinc-700/50

            bg-white/75 dark:bg-zinc-900/80

            p-6

            backdrop-blur-2xl

            shadow-[0_10px_40px_rgba(0,0,0,0.06)]
          "
        >

          <h1 className="mb-8 text-2xl font-semibold">
            案件編集
          </h1>

          {/* 依頼主 */}
          <div className="mb-6">

            <p className="mb-2 text-sm text-zinc-400 dark:text-zinc-500">
              依頼主
            </p>

            <input
              value={project.client}

              onChange={(e) =>
                updateField(
                  "client",
                  e.target.value
                )
              }

              className="
                w-full

                rounded-2xl

                border border-zinc-200 dark:border-zinc-700

                bg-white/70 dark:bg-zinc-900/75

                px-4
                py-4

                outline-none
              "
            />

          </div>

          {/* 依頼内容 */}
          <div className="mb-6">

            <p className="mb-2 text-sm text-zinc-400 dark:text-zinc-500">
              依頼内容
            </p>

            <input
              value={project.title}

              onChange={(e) =>
                updateField(
                  "title",
                  e.target.value
                )
              }

              className="
                w-full

                rounded-2xl

                border border-zinc-200 dark:border-zinc-700

                bg-white/70 dark:bg-zinc-900/75

                px-4
                py-4

                outline-none
              "
            />

          </div>

          <DeadlineField
            value={project.deadline}
            onChange={(value) =>
              updateField("deadline", value)
            }
          />

          {/* 色 */}
          <div className="mb-8">

            <p className="mb-3 text-sm text-zinc-400 dark:text-zinc-500">
              イメージカラー
            </p>

            <input
              type="color"

              value={project.color}

              onChange={(e) =>
                updateField(
                  "color",
                  normalizeProjectColor(
                    e.target.value
                  )
                )
              }

              className="
                h-14
                w-full

                cursor-pointer

                rounded-2xl
                border-0

                bg-transparent
              "
            />

          </div>

          {/* 作業 */}
          <div>

            <div className="mb-4 flex items-center justify-between">

              <p className="text-sm font-medium">
                作業
              </p>

              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {project.tasks.length}件
              </p>

            </div>

            {/* 作業追加 */}
            <div className="space-y-3">

              <input
                value={newTask}

                onChange={(e) =>
                  setNewTask(
                    e.target.value
                  )
                }

                placeholder="作業を追加"

                className="
                  w-full

                  rounded-2xl

                  border border-zinc-200 dark:border-zinc-700

                  bg-white/70 dark:bg-zinc-900/75

                  px-4
                  py-4

                  outline-none
                "
              />

              <TaskScheduleDateInput
                value={newTaskDate}
                onChange={setNewTaskDate}
              />

              <button
                onClick={addTask}

                className={`w-full py-4 ${theme.btnSolid}`}
              >
                作業追加
              </button>

            </div>

            {/* 作業一覧 */}
            <div className="mt-5 space-y-3">

              {project.tasks.map(
                (task, index) => (

                  <div
                    key={task.id}

                    className="
                      rounded-[24px]

                      border border-zinc-200 dark:border-zinc-700

                      bg-white/70 dark:bg-zinc-900/75

                      p-4
                    "
                  >

                    <div className="flex items-start justify-between">

                      <div className="flex-1">

                        <p className="text-sm font-medium">
                          {task.title}
                        </p>

                        <TaskScheduleDateInput
                          value={task.date}
                          onChange={(date) =>
                            updateTaskDate(
                              task.id,
                              date
                            )
                          }
                        />

                      </div>

                      <div className="ml-3 flex flex-col gap-2">

                        <button
                          onClick={() =>
                            moveTaskUp(index)
                          }

                          className="
                            rounded-xl
                            bg-zinc-100
                            px-3
                            py-1
                            text-xs
                            text-zinc-700
                            dark:bg-zinc-800
                            dark:text-zinc-200
                          "
                        >
                          ↑
                        </button>

                        <button
                          onClick={() =>
                            moveTaskDown(index)
                          }

                          className="
                            rounded-xl
                            bg-zinc-100
                            px-3
                            py-1
                            text-xs
                            text-zinc-700
                            dark:bg-zinc-800
                            dark:text-zinc-200
                          "
                        >
                          ↓
                        </button>

                        <button
                          onClick={() =>
                            deleteTask(task.id)
                          }

                          className="
                            rounded-xl

                            bg-red-100

                            px-3
                            py-1

                            text-xs
                            text-red-500
                          "
                        >
                          削除
                        </button>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>

        </div>

        {/* 保存 */}
        <button
          onClick={saveProject}

          className={`
            mt-4
            w-full
            rounded-[28px]
            py-5
            shadow-[0_8px_30px_rgba(0,0,0,0.12)]
            ${theme.btnSolid}
          `}
        >
          保存
        </button>

      </div>

    </ThemedMain>
  );
}