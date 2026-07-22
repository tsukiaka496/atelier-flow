"use client";

import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { useState } from "react";

import type { Project } from "@/lib/storage";
import {
  getProjectsRepo,
  saveProjectsRepo,
} from "@/lib/projectsRepo";
import { useProjectsRepo } from "@/lib/useProjectsRepo";
import { createScheduleSlot, ensureTaskScheduleSlots, getOrderedTaskSlots, getPrimarySlotForTask, pairTasksWithScheduleSlots, removeSlotsForTask } from "@/lib/scheduleHelpers";
import {
  getProjectProgress,
  isProjectFullyCompleted,
} from "@/lib/projectProgress";
import { formatLocalDate } from "@/lib/taskPlan";
import { appSurfaces } from "@/lib/appSurfaces";
import { theme } from "@/lib/themeClasses";

import PageShell from "@/components/PageShell";
import TaskEditorSheet from "@/components/TaskEditorSheet";
import TaskWorkScheduleRow from "@/components/TaskWorkScheduleRow";

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const next = index + direction;

  if (next < 0 || next >= items.length) {
    return items;
  }

  const copied = [...items];
  [copied[index], copied[next]] = [copied[next], copied[index]];
  return copied;
}

function formatDeadline(deadline: string) {
  if (!deadline) {
    return "納期なし";
  }

  const date = new Date(deadline);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatPlanDateLabel(date: string, today: string) {
  if (!date) {
    return "未定";
  }

  if (date === today) {
    return "今日";
  }

  const parsed = new Date(`${date}T12:00:00`);
  return `${parsed.getMonth() + 1}月${parsed.getDate()}日`;
}

function getTaskDaysLeft(date: string) {
  if (!date) {
    return null;
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const target = new Date(`${date}T12:00:00`);
  const diff = target.getTime() - today.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function persistProject(
  projects: Project[],
  updated: Project
) {
  saveProjectsRepo(
    projects.map((item) =>
      item.id === updated.id ? updated : item
    )
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projects = useProjectsRepo();
  const projectId = String(params.id);
  const project =
    projects.find((item) => item.id === projectId) ?? null;

  const [editingTaskId, setEditingTaskId] = useState<string | null>(
    null
  );
  const [editTitle, setEditTitle] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  if (!project) {
    return (
      <PageShell title="案件">
        <div className="mx-auto max-w-md text-center">
          <p className={appSurfaces.subtleText}>
            案件が見つかりません
          </p>
          <Link
            href="/projects"
            className="mt-4 inline-block text-sm text-sky-600 dark:text-sky-400"
          >
            案件一覧へ戻る
          </Link>
        </div>
      </PageShell>
    );
  }

  const currentProject = project;
  const progress = getProjectProgress(currentProject);
  const isFullyCompleted = isProjectFullyCompleted(currentProject);
  const bulkActionLabel = isFullyCompleted ? "全解除" : "全完了";

  function getDaysLeft() {
    if (!currentProject.deadline) {
      return null;
    }

    const today = new Date();
    const end = new Date(currentProject.deadline);
    const diff = end.getTime() - today.getTime();

    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function toggleAllTasks() {
    let updatedProject: Project;

    if (currentProject.tasks.length === 0) {
      updatedProject = {
        ...currentProject,
        manualCompleted: !currentProject.manualCompleted,
      };
    } else {
      const markComplete = !isProjectFullyCompleted(currentProject);

      updatedProject = {
        ...currentProject,
        tasks: currentProject.tasks.map((task) => ({
          ...task,
          completed: markComplete,
        })),
      };
    }

    persistProject(getProjectsRepo(), updatedProject);
  }

  function toggleTask(taskId: string) {
    const updatedProject: Project = {
      ...currentProject,
      tasks: currentProject.tasks.map((task) =>
        task.id === taskId
          ? { ...task, completed: !task.completed }
          : task
      ),
    };

    persistProject(getProjectsRepo(), updatedProject);
  }

  function openTaskEditor(taskId: string) {
    const task = currentProject.tasks.find((item) => item.id === taskId);

    if (!task) return;

    setEditingTaskId(taskId);
    setEditTitle(task.title);
  }

  function closeTaskEditor() {
    setEditingTaskId(null);
    setEditTitle("");
  }

  function saveTaskEdits() {
    if (!editingTaskId) return;

    if (!editTitle.trim()) {
      alert("作業名を入力してください");
      return;
    }

    const updatedProject: Project = {
      ...currentProject,
      tasks: currentProject.tasks.map((task) =>
        task.id === editingTaskId
          ? { ...task, title: editTitle.trim() }
          : task
      ),
    };

    persistProject(getProjectsRepo(), updatedProject);
    closeTaskEditor();
  }

  function deleteTask(taskId: string) {
    const confirmed = window.confirm("この作業を削除しますか？");

    if (!confirmed) return;

    const updatedProject: Project = {
      ...currentProject,
      tasks: currentProject.tasks.filter((task) => task.id !== taskId),
      schedule: removeSlotsForTask(
        currentProject.schedule,
        taskId
      ),
    };

    persistProject(getProjectsRepo(), updatedProject);

    if (editingTaskId === taskId) {
      closeTaskEditor();
    }
  }

  function addTask() {
    const title = newTaskTitle.trim();

    if (!title) {
      alert("作業名を入力してください");
      return;
    }

    const taskId = crypto.randomUUID();
    const updatedProject: Project = {
      ...currentProject,
      tasks: [
        ...currentProject.tasks,
        {
          id: taskId,
          title,
          completed: false,
        },
      ],
      schedule: [
        ...ensureTaskScheduleSlots(
          currentProject.tasks,
          currentProject.schedule
        ),
        createScheduleSlot("", taskId),
      ],
    };

    persistProject(getProjectsRepo(), updatedProject);
    setNewTaskTitle("");
  }

  function setScheduleDateAtIndex(
    index: number,
    date: string
  ) {
    const schedule = ensureTaskScheduleSlots(
      currentProject.tasks,
      currentProject.schedule
    );
    const taskSlots = getOrderedTaskSlots(
      currentProject.tasks,
      schedule
    );
    const others = schedule.filter(
      (slot) => !slot.taskId
    );

    if (!taskSlots[index]) {
      return;
    }

    const nextSlots = taskSlots.map((slot, slotIndex) =>
      slotIndex === index ? { ...slot, date } : slot
    );

    persistProject(getProjectsRepo(), {
      ...currentProject,
      schedule: pairTasksWithScheduleSlots(
        currentProject.tasks,
        nextSlots,
        others
      ),
    });
  }

  function reorderTasks(index: number, direction: -1 | 1) {
    const nextTasks = moveItem(
      currentProject.tasks,
      index,
      direction
    );
    const schedule = ensureTaskScheduleSlots(
      currentProject.tasks,
      currentProject.schedule
    );
    const taskSlots = getOrderedTaskSlots(
      currentProject.tasks,
      schedule
    );
    const others = schedule.filter(
      (slot) => !slot.taskId
    );

    persistProject(getProjectsRepo(), {
      ...currentProject,
      tasks: nextTasks,
      schedule: pairTasksWithScheduleSlots(
        nextTasks,
        taskSlots,
        others
      ),
    });
  }

  function reorderScheduleSlots(
    index: number,
    direction: -1 | 1
  ) {
    const schedule = ensureTaskScheduleSlots(
      currentProject.tasks,
      currentProject.schedule
    );
    const taskSlots = getOrderedTaskSlots(
      currentProject.tasks,
      schedule
    );
    const others = schedule.filter(
      (slot) => !slot.taskId
    );

    persistProject(getProjectsRepo(), {
      ...currentProject,
      schedule: pairTasksWithScheduleSlots(
        currentProject.tasks,
        moveItem(taskSlots, index, direction),
        others
      ),
    });
  }

  function deleteProject() {
    const confirmDelete = confirm("この案件を削除しますか？");

    if (!confirmDelete) return;

    saveProjectsRepo(
      getProjectsRepo().filter((item) => item.id !== currentProject.id)
    );

    router.push("/projects");
  }

  const daysLeft = getDaysLeft();
  const todayString = formatLocalDate(new Date());

  return (
    <PageShell title={currentProject.title || "案件"}>
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/projects"
            className={appSurfaces.roundButtonMd}
          >
            ← 戻る
          </Link>

          <div className="flex gap-2">
            <Link
              href={`/projects/${currentProject.id}/edit`}
              className={appSurfaces.roundButtonMd}
            >
              編集
            </Link>

            <button
              type="button"
              onClick={deleteProject}
              className="rounded-full bg-red-100 px-4 py-2 text-sm text-red-500"
            >
              削除
            </button>
          </div>
        </div>

        <div className={appSurfaces.heroCardLg}>
          <div className={appSurfaces.heroSheen} />

          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div
                  className="mt-1 h-3 w-3 rounded-full"
                  style={{ background: currentProject.color }}
                />

                <div>
                  <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
                    {currentProject.client || "依頼主なし"}
                  </h1>
                  <p className={`mt-2 text-sm ${appSurfaces.subtleText}`}>
                    {currentProject.title || "依頼内容なし"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p
                  className="text-lg font-semibold"
                  style={{ color: currentProject.color }}
                >
                  {progress}%
                </p>
                <p className={`mt-1 text-xs ${appSurfaces.subtleText}`}>
                  {daysLeft !== null ? `あと${daysLeft}日` : "納期なし"}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className={appSurfaces.glassBadge}>
                <span>納期</span>
                <span className="ml-2 text-zinc-800 dark:text-zinc-100">
                  {formatDeadline(currentProject.deadline)}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <div className="h-3 overflow-hidden rounded-full bg-white shadow-inner dark:bg-zinc-900">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progress}%`,
                    background: currentProject.color,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
              作業
            </h2>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsAdjusting((value) => !value)}
                className="
                  rounded-full
                  border border-white/60
                  bg-white/80
                  px-2.5
                  py-1
                  text-[10px]
                  font-medium
                  text-zinc-600
                  dark:border-zinc-700/50
                  dark:bg-zinc-900/85
                  dark:text-zinc-300
                "
                style={
                  isAdjusting
                    ? {
                        borderColor: `${currentProject.color}50`,
                        color: currentProject.color,
                        background: `${currentProject.color}14`,
                      }
                    : undefined
                }
              >
                {isAdjusting ? "調整を終了" : "調整"}
              </button>

              <button
                type="button"
                onClick={toggleAllTasks}
                className="
                  rounded-full
                  border border-white/60
                  bg-white/80
                  px-2
                  py-1
                  text-[10px]
                  font-medium
                  dark:border-zinc-700/50
                  dark:bg-zinc-900/85
                "
                style={{
                  borderColor: `${currentProject.color}50`,
                  color: currentProject.color,
                }}
              >
                {bulkActionLabel}
              </button>

              <p className={`shrink-0 text-[11px] ${appSurfaces.subtleText}`}>
                {
                  currentProject.tasks.filter(
                    (task) => task.completed
                  ).length
                }
                /{currentProject.tasks.length}
              </p>
            </div>
          </div>

          {isAdjusting ? (
            <>
              <div className="mb-3 flex gap-2">
                <input
                  value={newTaskTitle}
                  onChange={(event) =>
                    setNewTaskTitle(event.target.value)
                  }
                  placeholder="作業を追加"
                  className={`min-w-0 flex-1 px-3 py-2.5 text-sm ${appSurfaces.input}`}
                />
                <button
                  type="button"
                  onClick={addTask}
                  className={`shrink-0 px-4 py-2.5 text-sm ${theme.btnSolid}`}
                >
                  追加
                </button>
              </div>

              {currentProject.tasks.length === 0 ? (
                <div className={`${appSurfaces.emptyPanel} text-xs`}>
                  作業を追加すると、同じ行に日付も表示されます
                </div>
              ) : (
                <div className="space-y-2">
                  <p className={`px-0.5 text-[11px] leading-relaxed ${appSurfaces.subtleText}`}>
                    左右の↑↓で、作業と日付を別々に並べ替えできます
                  </p>
                  {(() => {
                    const scheduleSlots = getOrderedTaskSlots(
                      currentProject.tasks,
                      currentProject.schedule
                    );

                    return currentProject.tasks.map((task, index) => (
                      <TaskWorkScheduleRow
                        key={task.id}
                        title={task.title}
                        completed={task.completed}
                        accentColor={currentProject.color}
                        date={scheduleSlots[index]?.date ?? ""}
                        onDateChange={(date) =>
                          setScheduleDateAtIndex(index, date)
                        }
                        onMoveTask={(direction) =>
                          reorderTasks(index, direction)
                        }
                        onMoveSchedule={(direction) =>
                          reorderScheduleSlots(index, direction)
                        }
                        onToggleComplete={() => toggleTask(task.id)}
                        onEditTask={() => openTaskEditor(task.id)}
                        onDeleteTask={() => deleteTask(task.id)}
                        showComplete
                      />
                    ));
                  })()}
                </div>
              )}
            </>
          ) : currentProject.tasks.length === 0 ? (
            <div className={`${appSurfaces.emptyPanel} text-xs`}>
              作業はまだありません。「調整」から追加できます
            </div>
          ) : (
            <div className="space-y-3">
              {currentProject.tasks.map((task) => {
                const taskDate =
                  getPrimarySlotForTask(
                    currentProject.schedule,
                    task.id
                  )?.date ?? "";
                const taskDaysLeft = getTaskDaysLeft(taskDate);

                return (
                  <div
                    key={task.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleTask(task.id)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();
                        toggleTask(task.id);
                      }
                    }}
                    className={`
                      w-full
                      cursor-pointer
                      p-4
                      text-left
                      transition-all
                      ${appSurfaces.cardSm}
                    `}
                    style={{
                      borderColor: task.completed
                        ? `${currentProject.color}50`
                        : undefined,
                      background: task.completed
                        ? `${currentProject.color}12`
                        : undefined,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-base font-semibold leading-snug text-zinc-800 dark:text-zinc-100"
                          style={{
                            color: task.completed
                              ? currentProject.color
                              : undefined,
                          }}
                        >
                          {task.title}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <p className={`text-xs ${appSurfaces.subtleText}`}>
                            やる予定:{" "}
                            {formatPlanDateLabel(
                              taskDate,
                              todayString
                            )}
                          </p>

                          {taskDate ? (
                            <div className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                              {taskDaysLeft === 0
                                ? "今日"
                                : taskDaysLeft !== null &&
                                    taskDaysLeft < 0
                                  ? "予定を過ぎています"
                                  : `あと${taskDaysLeft}日`}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-start gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openTaskEditor(task.id);
                          }}
                          className="
                            rounded-full
                            border border-white/60
                            bg-white/80
                            px-3
                            py-1.5
                            text-xs
                            text-zinc-600
                            dark:border-zinc-700/50
                            dark:bg-zinc-900/85
                            dark:text-zinc-300
                          "
                        >
                          編集
                        </button>

                        <div
                          className="
                            pointer-events-none
                            flex
                            h-6
                            w-6
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            border
                            text-xs
                          "
                          style={{
                            background: task.completed
                              ? currentProject.color
                              : "transparent",
                            borderColor: task.completed
                              ? currentProject.color
                              : "#d4d4d8",
                            color: task.completed
                              ? "white"
                              : "transparent",
                          }}
                        >
                          ✓
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <TaskEditorSheet
          open={Boolean(editingTaskId)}
          title={editTitle}
          onTitleChange={setEditTitle}
          onSave={saveTaskEdits}
          onClose={closeTaskEditor}
          onDelete={
            editingTaskId
              ? () => deleteTask(editingTaskId)
              : undefined
          }
        />
      </div>
    </PageShell>
  );
}
