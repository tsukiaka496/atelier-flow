"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  DEFAULT_PROJECT_COLOR,
  normalizeProjectColor,
  type ScheduleSlot,
  type Task,
} from "@/lib/storage";
import { addProjectRepo } from "@/lib/projectsRepo";
import { createProjectTemplateDraft } from "@/lib/projectTemplate";
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

export default function NewProjectPage() {
  const router = useRouter();

  const [client, setClient] = useState("");
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [color, setColor] = useState(DEFAULT_PROJECT_COLOR);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);

  const [taskTitle, setTaskTitle] = useState("");

  const [editingTaskId, setEditingTaskId] = useState<string | null>(
    null
  );
  const [editTitle, setEditTitle] = useState("");

  function applyTemplate() {
    const draft = createProjectTemplateDraft();
    setClient(draft.client);
    setTitle(draft.title);
    setDeadline(draft.deadline);
    setColor(draft.color);
    setTasks(draft.tasks);
    setSchedule(draft.schedule);
  }

  function addTask() {
    if (!taskTitle.trim()) return;

    const taskId = crypto.randomUUID();

    setTasks([
      ...tasks,
      {
        id: taskId,
        title: taskTitle.trim(),
        completed: false,
      },
    ]);
    setSchedule([
      ...ensureTaskScheduleSlots(tasks, schedule),
      createScheduleSlot("", taskId),
    ]);

    setTaskTitle("");
  }

  function removeTask(id: string) {
    setTasks(tasks.filter((task) => task.id !== id));
    setSchedule(removeSlotsForTask(schedule, id));

    if (editingTaskId === id) {
      closeTaskEditor();
    }
  }

  function setScheduleDateAtIndex(
    index: number,
    date: string
  ) {
    const next = ensureTaskScheduleSlots(tasks, schedule);
    const taskSlots = getOrderedTaskSlots(tasks, next);
    const others = next.filter((slot) => !slot.taskId);

    if (!taskSlots[index]) {
      return;
    }

    const nextSlots = taskSlots.map((slot, slotIndex) =>
      slotIndex === index ? { ...slot, date } : slot
    );

    setSchedule(
      pairTasksWithScheduleSlots(tasks, nextSlots, others)
    );
  }

  function reorderTasks(index: number, direction: -1 | 1) {
    const nextTasks = moveItem(tasks, index, direction);
    const next = ensureTaskScheduleSlots(tasks, schedule);
    const taskSlots = getOrderedTaskSlots(tasks, next);
    const others = next.filter((slot) => !slot.taskId);

    setTasks(nextTasks);
    setSchedule(
      pairTasksWithScheduleSlots(nextTasks, taskSlots, others)
    );
  }

  function reorderScheduleSlots(
    index: number,
    direction: -1 | 1
  ) {
    const next = ensureTaskScheduleSlots(tasks, schedule);
    const taskSlots = getOrderedTaskSlots(tasks, next);
    const others = next.filter((slot) => !slot.taskId);
    setSchedule(
      pairTasksWithScheduleSlots(
        tasks,
        moveItem(taskSlots, index, direction),
        others
      )
    );
  }

  function openTaskEditor(taskId: string) {
    const task = tasks.find((item) => item.id === taskId);

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

    setTasks(
      tasks.map((task) =>
        task.id === editingTaskId
          ? { ...task, title: editTitle.trim() }
          : task
      )
    );

    closeTaskEditor();
  }

  function handleCreate() {
    addProjectRepo({
      id: crypto.randomUUID(),
      client: client.trim(),
      title: title.trim(),
      color: normalizeProjectColor(color),
      deadline,
      tasks,
      schedule: ensureTaskScheduleSlots(tasks, schedule),
    });

    router.push("/projects");
  }

  return (
    <PageShell title="案件を作成" showNav={false}>
      <div className="mx-auto min-w-0 max-w-xl">
        <Link
          href="/projects"
          className={`mb-6 inline-flex items-center gap-2 ${appSurfaces.roundButtonMd}`}
        >
          ← 戻る
        </Link>

        <div className={`${appSurfaces.heroCardLg}`}>
          <div className={appSurfaces.heroSheen} />

          <div className="relative z-10">
            <button
              type="button"
              onClick={applyTemplate}
              className={`
                mb-6
                w-full
                rounded-[24px]
                border border-zinc-200
                bg-white/80
                px-4
                py-4
                text-sm
                text-zinc-700
                shadow-[0_8px_28px_rgba(0,0,0,0.06)]
                dark:border-zinc-700
                dark:bg-zinc-900/85
                dark:text-zinc-200
              `}
            >
              テンプレート作成
            </button>

            <div className="mb-6">
              <p className={`mb-2 ${appSurfaces.mutedLabel}`}>
                依頼主
              </p>
              <input
                value={client}
                onChange={(event) => setClient(event.target.value)}
                placeholder="例: 依頼主の名前"
                className={`px-4 py-4 ${appSurfaces.input}`}
              />
            </div>

            <div className="mb-6">
              <p className={`mb-2 ${appSurfaces.mutedLabel}`}>
                依頼内容
              </p>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="例: MVイラスト"
                className={`px-4 py-4 ${appSurfaces.input}`}
              />
            </div>

            <DeadlineField value={deadline} onChange={setDeadline} />

            <div className="mb-8">
              <p className={`mb-3 ${appSurfaces.mutedLabel}`}>
                イメージカラー
              </p>
              <input
                type="color"
                value={color}
                onChange={(event) =>
                  setColor(normalizeProjectColor(event.target.value))
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
                  {tasks.length}件
                </p>
              </div>

              <div className="mb-3 flex gap-2">
                <input
                  value={taskTitle}
                  onChange={(event) =>
                    setTaskTitle(event.target.value)
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

              {tasks.length === 0 ? (
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
                      tasks,
                      schedule
                    );

                    return tasks.map((task, index) => (
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
                        onDeleteTask={() => removeTask(task.id)}
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
          onClick={handleCreate}
          className={`
            mt-4
            w-full
            rounded-[28px]
            py-5
            shadow-[0_8px_30px_rgba(0,0,0,0.12)]
            ${theme.btnSolid}
          `}
        >
          案件作成
        </button>

        <TaskEditorSheet
          open={Boolean(editingTaskId)}
          title={editTitle}
          onTitleChange={setEditTitle}
          onSave={saveTaskEdits}
          onClose={closeTaskEditor}
          onDelete={
            editingTaskId
              ? () => removeTask(editingTaskId)
              : undefined
          }
        />
      </div>
    </PageShell>
  );
}
