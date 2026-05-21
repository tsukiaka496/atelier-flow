"use client";

import AddProjectForm from "@/components/AddProjectForm";
import AddTaskForm from "@/components/AddTaskForm";
import ThemedMain from "@/components/ThemedMain";

export default function Dashboard() {
  return (
    <ThemedMain className="px-5 py-8 pb-28">

      <div className="mx-auto max-w-md">

        <h1 className="mb-6 text-xl font-semibold">
          管理
        </h1>

        <AddProjectForm />
        <AddTaskForm />

      </div>

    </ThemedMain>
  );
}