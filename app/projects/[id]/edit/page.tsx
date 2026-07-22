"use client";

import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { useState } from "react";

import {
  normalizeProject,
  normalizeProjectColor,
  type Project,
  type ScheduleSlot,
  type Task,
} from "@/lib/storage";
import {
  getProjectsRepo,
  saveProjectsRepo,
} from "@/lib/projectsRepo";
import {
  createScheduleSlot,
  ensureTaskScheduleSlots,
  getOrderedTaskSlots,
  pairTasksWithScheduleSlots,
  removeSlotsForTask,
} from "@/lib/scheduleHelpers";
import { appSurfaces } from "@/lib/appSurfaces";
import { theme } from "@/lib/themeClasses";

import PageShell from "@/components/PageShell";
import DeadlineField from "@/components/DeadlineField";
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

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(() => {
    const id = String(params.id);
    const found = getProjectsRepo().find((item) => item.id === id);
    if (!found) {
      return null;
    }
    const normalized = normalizeProject(found);
    return {
      ...normalized,
      schedule: ensureTaskScheduleSlots(
        normalized.tasks,
        normalized.schedule
      ),
    };
  });

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(
    null
  );
  const [editTitle, setEditTitle] = useState("");

  if (!project) {
    const exists = getProjectsRepo().some(
      (item) => item.id === String(params.id)
    );

    if (!exists) {
      return (
        <PageShell title="案件編集" showNav={false}>
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

    return (
      <PageShell title="案件編集" showNav={false}>
        <p className={appSurfaces.subtleText}>読み込み中...</p>
      </PageShell>
    );
  }

  function updateField(
    key: "client" | "title" | "deadline" | "color",
    value: string
  ) {
    setProject({
      ...project!,
      [key]: value,
    });
  }

  function addTask() {
    if (!newTaskTitle.trim()) return;

    const taskId = crypto.randomUUID();
    const nextTasks: Task[] = [
      ...project!.tasks,
      {
        id: taskId,
        title: newTaskTitle.trim(),
        completed: false,
      },
    ];

    setProject({
      ...project!,
      tasks: nextTasks,
      schedule: [
        ...ensureTaskScheduleSlots(
          project!.tasks,
          project!.schedule
        ),
        createScheduleSlot("", taskId),
      ],
    });
    setNewTaskTitle("");
  }

  function setScheduleDateAtIndex(
    index: number,
    date: string
  ) {
    const next = ensureTaskScheduleSlots(
      project!.tasks,
      project!.schedule
    );
    const taskSlots = getOrderedTaskSlots(
      project!.tasks,
      next
    );
    const others = next.filter((slot) => !slot.taskId);

    if (!taskSlots[index]) {
      return;
    }

    const nextSlots = taskSlots.map((slot, slotIndex) =>
      slotIndex === index ? { ...slot, date } : slot
    );

    setProject({
      ...project!,
      schedule: pairTasksWithScheduleSlots(
        project!.tasks,
        nextSlots,
        others
      ),
    });
  }

  function reorderTasks(index: number, direction: -1 | 1) {
    const nextTasks = moveItem(
      project!.tasks,
      index,
      direction
    );
    const next = ensureTaskScheduleSlots(
      project!.tasks,
      project!.schedule
    );
    const taskSlots = getOrderedTaskSlots(
      project!.tasks,
      next
    );
    const others = next.filter((slot) => !slot.taskId);

    setProject({
      ...project!,
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
    const next = ensureTaskScheduleSlots(
      project!.tasks,
      project!.schedule
    );
    const taskSlots = getOrderedTaskSlots(
      project!.tasks,
      next
    );
    const others = next.filter((slot) => !slot.taskId);

    setProject({
      ...project!,
      schedule: pairTasksWithScheduleSlots(
        project!.tasks,
        moveItem(taskSlots, index, direction),
        others
      ),
    });
  }

  function deleteTask(taskId: string) {
    const confirmed = window.confirm("この作業を削除しますか？");
    if (!confirmed) return;

    setProject({
      ...project!,
      tasks: project!.tasks.filter((task) => task.id !== taskId),
      schedule: removeSlotsForTask(project!.schedule, taskId),
    });

    if (editingTaskId === taskId) {
      closeTaskEditor();
    }
  }

  function openTaskEditor(taskId: string) {
    const task = project!.tasks.find(
      (item) => item.id === taskId
    );

    if (!task) {
      return;
    }

    setEditingTaskId(task.id);
    setEditTitle(task.title);
  }

  function closeTaskEditor() {
    setEditingTaskId(null);
    setEditTitle("");
  }

  function saveTaskEdits() {
    if (!editingTaskId) {
      return;
    }

    if (!editTitle.trim()) {
      alert("作業名を入力してください");
      return;
    }

    setProject({
      ...project!,
      tasks: project!.tasks.map((task) =>
        task.id === editingTaskId
          ? { ...task, title: editTitle.trim() }
          : task
      ),
    });

    closeTaskEditor();
  }

  function saveProject() {
    const normalized = normalizeProject({
      ...project!,
      schedule: ensureTaskScheduleSlots(
        project!.tasks,
        project!.schedule
      ),
    });
    const projects = getProjectsRepo();

    saveProjectsRepo(
      projects.map((item) =>
        item.id === normalized.id ? normalized : item
      )
    );

    router.push(`/projects/${project!.id}`);
  }

  return (
    <PageShell title="案件編集" showNav={false}>
      <div className="mx-auto max-w-xl">
        <Link
          href={`/projects/${project.id}`}
          className={`mb-6 inline-flex items-center gap-2 ${appSurfaces.roundButtonMd}`}
        >
          ← 戻る
        </Link>

        <div className={appSurfaces.heroCardLg}>
          <div className={appSurfaces.heroSheen} />

          <div className="relative z-10">
            <div className="mb-6">
              <p className={`mb-2 ${appSurfaces.mutedLabel}`}>
                依頼主
              </p>
              <input
                value={project.client}
                onChange={(event) =>
                  updateField("client", event.target.value)
                }
                className={`px-4 py-4 ${appSurfaces.input}`}
              />
            </div>

            <div className="mb-6">
              <p className={`mb-2 ${appSurfaces.mutedLabel}`}>
                依頼内容
              </p>
              <input
                value={project.title}
                onChange={(event) =>
                  updateField("title", event.target.value)
                }
                className={`px-4 py-4 ${appSurfaces.input}`}
              />
            </div>

            <DeadlineField
              value={project.deadline}
              onChange={(value) => updateField("deadline", value)}
            />

            <div className="mb-8">
              <p className={`mb-3 ${appSurfaces.mutedLabel}`}>
                イメージカラー
              </p>
              <input
                type="color"
                value={project.color}
                onChange={(event) =>
                  updateField(
                    "color",
                    normalizeProjectColor(event.target.value)
                  )
                }
                className="h-14 w-full cursor-pointer rounded-2xl border-0 bg-transparent"
              />
            </div>

            <div className="mb-10">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                  作業と日付
                </p>
                <p className={`text-[11px] ${appSurfaces.subtleText}`}>
                  {project.tasks.length}件
                </p>
              </div>

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

              {project.tasks.length === 0 ? (
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
                      project.tasks,
                      project.schedule
                    );

                    return project.tasks.map((task, index) => (
                      <TaskWorkScheduleRow
                        key={task.id}
                        title={task.title}
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
                        onEditTask={() => openTaskEditor(task.id)}
                        onDeleteTask={() => deleteTask(task.id)}
                      />
                    ));
                  })()}
                </div>
              )}
            </div>

          </div>
        </div>

        <button
          type="button"
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
