"use client";

import { useState } from "react";
import {
  addProject as persistProject,
  DEFAULT_PROJECT_COLOR,
} from "@/lib/storage";
import { theme } from "@/lib/themeClasses";

export default function AddProjectForm() {
  const [title, setTitle] = useState("");

  function addProject() {
    if (!title.trim()) return;

    persistProject({
      id: crypto.randomUUID(),
      title: title.trim(),
      client: "",
      color: DEFAULT_PROJECT_COLOR,
      deadline: "",
      tasks: [],
    });
    setTitle("");
  }

  return (
    <div className="mb-4 space-y-2">

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="プロジェクト追加"
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
        onClick={addProject}
        className={`w-full py-2 ${theme.btnSolid}`}
      >
        追加
      </button>

    </div>
  );
}