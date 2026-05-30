"use client";

import Link from "next/link";

import {
  useState,
  type ButtonHTMLAttributes,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  Project,
} from "@/lib/storage";
import {
  getProjectsRepo,
  saveProjectsRepo,
} from "@/lib/projectsRepo";
import { useProjectsRepo } from "@/lib/useProjectsRepo";

import ThemedMain from "@/components/ThemedMain";
import BottomNav from "@/components/BottomNav";
import TaskEditorSheet from "@/components/TaskEditorSheet";
import { useOnboarding } from "@/components/onboarding/OnboardingProvider";
import { appSurfaces } from "@/lib/appSurfaces";
import { useTourAction } from "@/lib/useTourAction";
import {
  getProjectProgress,
  isProjectFullyCompleted,
} from "@/lib/projectProgress";

export default function ProjectDetailPage() {
  const params = useParams();
  const { setTutorialModalOpen } = useOnboarding();
  const triggerTaskToggle = useTourAction("project-task-toggle");
  const triggerTaskEdit = useTourAction("project-task-edit");
  const triggerTaskSave = useTourAction("project-task-save");

  const router = useRouter();
  const projects = useProjectsRepo();
  const projectId = String(params.id);
  const project =
    projects.find((item) => item.id === projectId) ??
    null;

  const [editingTaskId, setEditingTaskId] =
    useState<string | null>(null);

  const [editTitle, setEditTitle] =
    useState("");

  const [editDate, setEditDate] =
    useState("");

  if (!project) {
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

        <BottomNav />
      </ThemedMain>
    );
  }

  const currentProject = project;

  function getProgress() {
    return getProjectProgress(currentProject);
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

  function toggleAllTasks() {
    let updatedProject: Project;

    if (currentProject.tasks.length === 0) {
      updatedProject = {
        ...currentProject,
        manualCompleted:
          !currentProject.manualCompleted,
      };
    } else {
      const markComplete =
        !isProjectFullyCompleted(currentProject);

      updatedProject = {
        ...currentProject,
        tasks: currentProject.tasks.map((task) => ({
          ...task,
          completed: markComplete,
        })),
      };
    }

    const projects = getProjectsRepo();
    const updatedProjects = projects.map((p) =>
      p.id === updatedProject.id ? updatedProject : p
    );

    saveProjectsRepo(updatedProjects);
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

    const projects = getProjectsRepo();

    const updatedProjects =
      projects.map((p) =>
        p.id === updatedProject.id
          ? updatedProject
          : p
      );

    saveProjectsRepo(updatedProjects);
  }

  function openTaskEditor(taskId: string) {
    const task =
      currentProject.tasks.find((t) => t.id === taskId) ??
      null;
    if (!task) return;

    setEditingTaskId(taskId);
    setEditTitle(task.title);
    setEditDate(task.date);
    setTutorialModalOpen(true);
  }

  function closeTaskEditor() {
    setEditingTaskId(null);
    setEditTitle("");
    setEditDate("");
    setTutorialModalOpen(false);
  }

  function saveTaskEdits() {
    if (!editingTaskId) return;

    if (!editTitle.trim()) {
      alert("作業名を入力してください");
      return;
    }

    const updatedProject: Project = {
      ...currentProject,
      tasks: currentProject.tasks.map((t) => {
        if (t.id !== editingTaskId) return t;
        return {
          ...t,
          title: editTitle.trim(),
          date: editDate,
        };
      }),
    };

    const projects = getProjectsRepo();
    const updatedProjects = projects.map((p) =>
      p.id === updatedProject.id ? updatedProject : p
    );

    saveProjectsRepo(updatedProjects);
    closeTaskEditor();
  }

  function deleteTask(taskId: string) {
    const confirmed = window.confirm("この作業を削除しますか？");
    if (!confirmed) return;

    const updatedProject: Project = {
      ...currentProject,
      tasks: currentProject.tasks.filter((t) => t.id !== taskId),
    };

    const projects = getProjectsRepo();
    const updatedProjects = projects.map((p) =>
      p.id === updatedProject.id ? updatedProject : p
    );

    saveProjectsRepo(updatedProjects);

    if (editingTaskId === taskId) {
      closeTaskEditor();
    }
  }

  function deleteProject() {
    const confirmDelete =
      confirm(
        "この案件を削除しますか？"
      );

    if (!confirmDelete) return;

    const projects = getProjectsRepo();

    const filtered =
      projects.filter(
        (p) =>
          p.id !==
          currentProject.id
      );

    saveProjectsRepo(filtered);

    router.push("/projects");
  }

  const progress = getProgress();

  const daysLeft = getDaysLeft();

  const isFullyCompleted =
    isProjectFullyCompleted(currentProject);
  const bulkActionLabel = isFullyCompleted
    ? "全解除"
    : "全完了";

  return (
    <ThemedMain className="px-5 py-8 pb-32">

      <div className="mx-auto max-w-md">

        {/* 上 */}
        <div className="mb-6 flex items-center justify-between">

          <Link
            href="/projects"
            className="
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

          <div className="flex gap-2">

            <Link
              href={`/projects/${currentProject.id}/edit`}
              className="
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
        <div className={appSurfaces.heroCardLg}>

          <div className={appSurfaces.heroSheen} />

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

                  <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
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

                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">

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
                  bg-white/70 dark:bg-zinc-900/75
                  px-4
                  py-2
                  text-sm
                  text-zinc-500 dark:text-zinc-400 dark:text-zinc-500
                  shadow-[0_2px_10px_rgba(0,0,0,0.03)]
                "
              >
                <span>納期</span>

                <span className="text-zinc-800 dark:text-zinc-100">
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
                  bg-white dark:bg-zinc-900
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

          <div className="mb-4 flex items-center justify-between gap-3">

            <h2 className="text-lg font-semibold">
              作業
            </h2>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleAllTasks}
                className="
                  rounded-full
                  bg-white/80 dark:bg-zinc-900/85
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  text-zinc-600 dark:text-zinc-300
                  border border-white/60 dark:border-zinc-700/50
                "
                style={{
                  borderColor: `${currentProject.color}50`,
                  color: currentProject.color,
                }}
              >
                {bulkActionLabel}
              </button>

              <p className="text-sm text-zinc-400 dark:text-zinc-500 shrink-0">
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

          </div>

          <div className="space-y-3">

            {currentProject.tasks.map(
              (task, index) => {

                const taskDaysLeft =
                  getTaskDaysLeft(
                    task.date
                  );

                return (

                  <div
                    key={task.id}
                    data-tour={index === 0 ? "project-task-toggle" : undefined}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      toggleTask(task.id);
                      if (index === 0) {
                        triggerTaskToggle();
                      }
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();
                        toggleTask(task.id);
                        if (index === 0) {
                          triggerTaskToggle();
                        }
                      }
                    }}
                    className="
                      w-full
                      cursor-pointer
                      rounded-[24px]
                      border border-white/60 dark:border-zinc-700/50
                      bg-white/70 dark:bg-zinc-900/75
                      p-4
                      text-left
                      backdrop-blur-xl
                      transition-all
                    "
                    style={{
                      borderColor: task.completed
                        ? `${currentProject.color}50`
                        : undefined,
                      background: task.completed
                        ? `${currentProject.color}12`
                        : undefined,
                    }}
                  >

                    <div className="flex items-start justify-between">

                      <div className="min-w-0 flex-1">

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

                          <p className="text-xs text-zinc-400 dark:text-zinc-500">

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
                                text-zinc-500 dark:text-zinc-400 dark:text-zinc-500
                              "
                            >

                              {taskDaysLeft === 0
                                ? "今日"
                                : `あと${taskDaysLeft}日`}

                            </div>

                          )}

                        </div>

                      </div>

                      <div className="ml-4 flex items-start gap-2">
                        <button
                          type="button"
                          data-tour={
                            index === 0 ? "project-task-edit" : undefined
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            openTaskEditor(task.id);
                            if (index === 0) {
                              triggerTaskEdit();
                            }
                          }}
                          className="
                            rounded-full
                            bg-white/80 dark:bg-zinc-900/85
                            px-3
                            py-1.5
                            text-xs
                            text-zinc-600 dark:text-zinc-300
                            border border-white/60 dark:border-zinc-700/50
                          "
                        >
                          編集
                        </button>

                        <div
                          className="
                            flex
                            h-6
                            w-6
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            border
                            text-xs
                            transition-all
                            pointer-events-none
                          "
                          style={{
                            background: task.completed
                              ? currentProject.color
                              : "transparent",
                            borderColor: task.completed
                              ? currentProject.color
                              : "#d4d4d8",
                            color: task.completed ? "white" : "transparent",
                          }}
                        >
                          ✓
                        </div>
                      </div>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        </div>

        <TaskEditorSheet
          open={Boolean(editingTaskId)}
          title={editTitle}
          date={editDate}
          onTitleChange={setEditTitle}
          onDateChange={setEditDate}
          onSave={() => {
            saveTaskEdits();
            triggerTaskSave();
          }}
          onClose={closeTaskEditor}
          onDelete={
            editingTaskId
              ? () => deleteTask(editingTaskId)
              : undefined
          }
          saveButtonProps={
            {
              "data-tour": "project-task-save",
            } as ButtonHTMLAttributes<HTMLButtonElement>
          }
        />

      </div>

      <BottomNav />

    </ThemedMain>
  );
}