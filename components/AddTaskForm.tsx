"use client";

import { useState } from "react";
import {
  getProjects,
  saveProjects,
  type Task,
} from "@/lib/storage";
import { theme } from "@/lib/themeClasses";

export default function AddTaskForm() {
  const projects = getProjects();

  const [title, setTitle] = useState("");
  const [projectId, setProjectId] =
    useState(projects[0]?.id ?? "");

  function addTask() {
    if (!title.trim()) return;

    if (!projectId) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      completed: false,
      date: "",
    };

    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;

      return {
        ...p,
        tasks: [...p.tasks, newTask],
      };
    });

    saveProjects(updated);
    setTitle("");
  }

  return (
    <div className="mb-6 space-y-2">

      {/* プロジェクト選択 */}
      <select
        value={projectId}
        onChange={(e) =>
          setProjectId(e.target.value)
        }
        className="
          w-full
          rounded-[16px]
          border border-zinc-200
          bg-white
          px-3 py-2
          text-sm
        "
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>

      {/* タスク入力 */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="タスク追加"
        className="
          w-full
          rounded-[16px]
          border border-zinc-200
          bg-white
          px-4 py-3
          text-sm
        "
      />

      <button
        onClick={addTask}
        className={`w-full py-2 ${theme.btnSolid}`}
      >
        追加
      </button>

    </div>
  );
}