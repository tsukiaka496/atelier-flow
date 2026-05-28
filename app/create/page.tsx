"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import BottomNav from "@/components/BottomNav";
import ThemedMain from "@/components/ThemedMain";
import DeadlineField from "@/components/DeadlineField";
import { theme } from "@/lib/themeClasses";

import {
  DEFAULT_PROJECT_COLOR,
  type Project,
  type Task,
} from "@/lib/storage";
import { getProjectsRepo, saveProjectsRepo } from "@/lib/projectsRepo";

export default function CreatePage() {
  const router = useRouter();

  const [title, setTitle] =
    useState("");

  const [deadline, setDeadline] =
    useState("");

  const [tasks, setTasks] =
    useState([""]);

  function updateTask(
    index: number,
    value: string
  ) {
    const newTasks = [...tasks];

    newTasks[index] = value;

    setTasks(newTasks);
  }

  function addTask() {
    setTasks([
      ...tasks,
      "",
    ]);
  }

  function handleSave() {

    if (!title.trim()) {
      alert("タイトルを入力してください");
      return;
    }

    const projects = getProjectsRepo();

    const taskList: Task[] = tasks
      .filter((task) => task.trim())
      .map((task) => ({
        id: crypto.randomUUID(),
        title: task.trim(),
        completed: false,
        date: "",
      }));

    const newProject: Project = {
      id: crypto.randomUUID(),
      title: title.trim(),
      client: "",
      deadline,
      color: DEFAULT_PROJECT_COLOR,
      tasks: taskList,
    };

    saveProjectsRepo([
      ...projects,
      newProject,
    ]);

    router.push("/projects");
  }

  return (
    <ThemedMain className="px-5 py-8 pb-32">
      <div className="mx-auto max-w-md">

        <h1 className="mb-8 text-2xl font-semibold">
          新しい案件
        </h1>

        <div className="space-y-5">

          {/* タイトル */}
          <div>
            <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
              タイトル
            </p>

            <input
              type="text"
              placeholder="Vtuber立ち絵"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              className="
                w-full
                rounded-[24px]
                border border-zinc-200 dark:border-zinc-700 dark:border-zinc-700
                bg-white dark:bg-zinc-900 dark:bg-zinc-900
                px-5
                py-4
                text-sm
                outline-none
              "
            />
          </div>

          <DeadlineField
            value={deadline}
            onChange={setDeadline}
          />

          {/* 工程 */}
          <div>
            <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
              工程
            </p>

            <div className="space-y-3">

              {tasks.map((task, index) => (
                <input
                  key={index}
                  type="text"
                  placeholder={`工程 ${index + 1}`}
                  value={task}
                  onChange={(e) =>
                    updateTask(
                      index,
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    rounded-[20px]
                    border border-zinc-200 dark:border-zinc-700 dark:border-zinc-700
                    bg-white dark:bg-zinc-900 dark:bg-zinc-900
                    px-4
                    py-3
                    text-sm
                    outline-none
                  "
                />
              ))}

              <button
                onClick={addTask}
                className="
                  w-full
                  rounded-[20px]
                  border border-dashed border-zinc-300
                  py-3
                  text-sm
                  text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 dark:text-zinc-500
                "
              >
                ＋ 工程追加
              </button>

            </div>
          </div>

        </div>

        {/* 保存 */}
        <button
          onClick={handleSave}
          className={`mt-10 w-full rounded-[28px] py-4 ${theme.btnSolid}`}
        >
          保存
        </button>

      </div>

      <BottomNav />
    </ThemedMain>
  );
}