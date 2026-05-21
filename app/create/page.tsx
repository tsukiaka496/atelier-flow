"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import BottomNav from "@/components/BottomNav";
import ThemedMain from "@/components/ThemedMain";
import { theme } from "@/lib/themeClasses";

import {
  DEFAULT_PROJECT_COLOR,
  getProjects,
  saveProjects,
  type Project,
  type Task,
} from "@/lib/storage";

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

    const projects = getProjects();

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

    saveProjects([
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
            <p className="mb-2 text-sm text-zinc-500">
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
                border border-zinc-200
                bg-white
                px-5
                py-4
                text-sm
                outline-none
              "
            />
          </div>

          {/* 納期 */}
          <div>
            <p className="mb-2 text-sm text-zinc-500">
              納期
            </p>

            <input
              type="date"
              value={deadline}
              onChange={(e) =>
                setDeadline(e.target.value)
              }
              className="
                w-full
                rounded-[24px]
                border border-zinc-200
                bg-white
                px-5
                py-4
                text-sm
                outline-none
              "
            />
          </div>

          {/* 工程 */}
          <div>
            <p className="mb-2 text-sm text-zinc-500">
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
                    border border-zinc-200
                    bg-white
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
                  text-zinc-500
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