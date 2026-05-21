"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  addProject,
  DEFAULT_PROJECT_COLOR,
  normalizeProjectColor,
  Task,
} from "@/lib/storage";

import { useState } from "react";

import ThemedMain from "@/components/ThemedMain";
import { theme } from "@/lib/themeClasses";

export default function NewProjectPage() {
  const router = useRouter();

  const [client, setClient] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [deadline, setDeadline] =
    useState("");

  const [color, setColor] =
    useState(DEFAULT_PROJECT_COLOR);

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [taskTitle, setTaskTitle] =
    useState("");

  const [taskDate, setTaskDate] =
    useState("");

  function addTask() {
    if (!taskTitle.trim()) return;

    setTasks([
      ...tasks,

      {
        id: crypto.randomUUID(),
        title: taskTitle,
        completed: false,
        date: taskDate,
      },
    ]);

    setTaskTitle("");
    setTaskDate("");
  }

  function removeTask(id: string) {
    setTasks(
      tasks.filter(
        (task) => task.id !== id
      )
    );
  }

  function moveUp(index: number) {
    if (index === 0) return;

    const copied = [...tasks];

    [
      copied[index - 1],
      copied[index],
    ] = [
      copied[index],
      copied[index - 1],
    ];

    setTasks(copied);
  }

  function moveDown(index: number) {
    if (
      index === tasks.length - 1
    ) {
      return;
    }

    const copied = [...tasks];

    [
      copied[index + 1],
      copied[index],
    ] = [
      copied[index],
      copied[index + 1],
    ];

    setTasks(copied);
  }

  function createProject() {
    addProject({
      id: crypto.randomUUID(),
      client: client.trim(),
      title: title.trim(),
      deadline,
      color: normalizeProjectColor(color),
      tasks,
    });

    router.push("/projects");
  }

  return (
    <ThemedMain className="px-5 py-8 pb-32">

      <div className="mx-auto max-w-md">

        {/* 戻る */}
        <Link
          href="/projects"
          className="
            mb-6
            inline-flex
            items-center
            gap-2

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

        {/* カード */}
        <div
          className="
            rounded-[38px]

            border border-white/60

            bg-white/75

            p-6

            backdrop-blur-2xl

            shadow-[0_10px_40px_rgba(0,0,0,0.06)]
          "
        >

          <h1 className="mb-8 text-2xl font-semibold">
            依頼追加
          </h1>

          {/* 依頼主 */}
          <div className="mb-6">

            <p className="mb-2 text-sm text-zinc-400">
              依頼主
            </p>

            <input
              value={client}
              onChange={(e) =>
                setClient(e.target.value)
              }

              className="
                w-full

                rounded-2xl

                border border-zinc-200

                bg-white/70

                px-4
                py-4

                outline-none
              "
            />

          </div>

          {/* 内容 */}
          <div className="mb-6">

            <p className="mb-2 text-sm text-zinc-400">
              依頼内容
            </p>

            <input
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }

              className="
                w-full

                rounded-2xl

                border border-zinc-200

                bg-white/70

                px-4
                py-4

                outline-none
              "
            />

          </div>

          {/* 納期 */}
          <div className="mb-6">

            <p className="mb-2 text-sm text-zinc-400">
              納期
            </p>

            <input
              type="date"

              value={deadline}

              onChange={(e) =>
                setDeadline(
                  e.target.value
                )
              }

              className="
                w-full

                rounded-2xl

                border border-zinc-200

                bg-white/70

                px-4
                py-4

                outline-none
              "
            />

          </div>

          {/* 色 */}
          <div className="mb-8">

            <p className="mb-3 text-sm text-zinc-400">
              イメージカラー
            </p>

            <input
              type="color"

              value={color}

              onChange={(e) =>
                setColor(
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

              <p className="text-xs text-zinc-400">
                {tasks.length}件
              </p>

            </div>

            {/* 入力 */}
            <div className="space-y-3">

              <input
                value={taskTitle}

                onChange={(e) =>
                  setTaskTitle(
                    e.target.value
                  )
                }

                placeholder="作業名"

                className="
                  w-full

                  rounded-2xl

                  border border-zinc-200

                  bg-white/70

                  px-4
                  py-4

                  outline-none
                "
              />

              <input
                type="date"

                value={taskDate}

                onChange={(e) =>
                  setTaskDate(
                    e.target.value
                  )
                }

                className="
                  w-full

                  rounded-2xl

                  border border-zinc-200

                  bg-white/70

                  px-4
                  py-4

                  outline-none
                "
              />

              <button
                onClick={addTask}

                className={`w-full py-4 ${theme.btnSolid}`}
              >
                作業追加
              </button>

            </div>

            {/* 一覧 */}
            <div className="mt-5 space-y-3">

              {tasks.map(
                (task, index) => (

                  <div
                    key={task.id}

                    className="
                      rounded-[24px]

                      border border-zinc-200

                      bg-white/70

                      p-4
                    "
                  >

                    <div className="flex items-start justify-between">

                      <div>

                        <p className="text-sm font-medium">
                          {task.title}
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">

                          {task.date ||
                            "日付なし"}

                        </p>

                      </div>

                      <div className="flex gap-2">

                        <button
                          onClick={() =>
                            moveUp(index)
                          }

                          className="
                            rounded-xl

                            bg-zinc-100

                            px-3
                            py-1

                            text-xs
                          "
                        >
                          ↑
                        </button>

                        <button
                          onClick={() =>
                            moveDown(index)
                          }

                          className="
                            rounded-xl

                            bg-zinc-100

                            px-3
                            py-1

                            text-xs
                          "
                        >
                          ↓
                        </button>

                        <button
                          onClick={() =>
                            removeTask(
                              task.id
                            )
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

        {/* 作成 */}
        <button
          onClick={createProject}

          className={`
            mt-4
            w-full
            rounded-[28px]
            py-5
            shadow-[0_8px_30px_rgba(0,0,0,0.12)]
            ${theme.btnSolid}
          `}
        >
          依頼作成
        </button>

      </div>

    </ThemedMain>
  );
}