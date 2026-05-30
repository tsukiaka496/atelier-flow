"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  DEFAULT_PROJECT_COLOR,
  normalizeProjectColor,
  Task,
} from "@/lib/storage";
import { addProjectRepo } from "@/lib/projectsRepo";
import { isTutorialSessionActive } from "@/lib/tutorialSession";
import { createTutorialProjectDraft } from "@/lib/tutorialProjectDraft";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import ThemedMain from "@/components/ThemedMain";
import { theme } from "@/lib/themeClasses";
import DeadlineField from "@/components/DeadlineField";
import TaskScheduleDateInput from "@/components/TaskScheduleDateInput";
import TaskEditorSheet from "@/components/TaskEditorSheet";
import { scrollTourTargetIntoView } from "@/lib/tutorialPositioning";
import {
  registerTutorialAction,
  registerTutorialHook,
  registerTutorialReadyCheck,
} from "@/lib/tutorialActionRegistry";
import { useTourAction } from "@/lib/useTourAction";
import {
  tourInstanceProps,
  useTourInstanceId,
} from "@/lib/useTourInstanceId";
import { useOnboarding } from "@/components/onboarding/OnboardingProvider";

export default function NewProjectPage() {
  const router = useRouter();
  const { bumpTutorialReady } = useOnboarding();

  const fillExampleInstance = useTourInstanceId(
    "tutorial-fill-example"
  );
  const createProjectInstance = useTourInstanceId(
    "create-project"
  );

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

  const [editingTaskId, setEditingTaskId] =
    useState<string | null>(null);

  const [editTitle, setEditTitle] =
    useState("");

  const [editDate, setEditDate] =
    useState("");

  const [exampleApplied, setExampleApplied] =
    useState(false);

  const applyTutorialExample = useCallback(() => {
    const draft = createTutorialProjectDraft(new Date());
    setClient(draft.project.client);
    setTitle(draft.project.title);
    setDeadline(draft.project.deadline);
    setColor(draft.project.color);
    setTasks(
      draft.tasks.map((t) => ({
        id: crypto.randomUUID(),
        title: t.title,
        completed: false,
        date: t.date,
      }))
    );
    setExampleApplied(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const createButton = document.querySelector(
          '[data-tour="create-project"]'
        );

        if (createButton instanceof HTMLElement) {
          scrollTourTargetIntoView(createButton);
        }

        bumpTutorialReady();
      });
    });
  }, [bumpTutorialReady]);

  const handleFillExample = useTourAction(
    "tutorial-fill-example",
    applyTutorialExample
  );

  useEffect(() => {
    return registerTutorialAction(
      "tutorial-fill-example",
      applyTutorialExample
    );
  }, [applyTutorialExample]);

  useEffect(() => {
    return registerTutorialHook(
      "project-form-auto-fill",
      () => {
        if (!exampleApplied) {
          applyTutorialExample();
        }
      }
    );
  }, [applyTutorialExample, exampleApplied]);

  useEffect(() => {
    return registerTutorialReadyCheck(
      "project-form-filled",
      () => exampleApplied
    );
  }, [exampleApplied]);

  useEffect(() => {
    bumpTutorialReady();
  }, [exampleApplied, bumpTutorialReady]);

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

  function openTaskEditor(taskId: string) {
    const task =
      tasks.find((item) => item.id === taskId) ??
      null;

    if (!task) {
      return;
    }

    setEditingTaskId(taskId);
    setEditTitle(task.title);
    setEditDate(task.date);
  }

  function closeTaskEditor() {
    setEditingTaskId(null);
    setEditTitle("");
    setEditDate("");
  }

  function saveTaskEdits() {
    if (!editingTaskId) {
      return;
    }

    if (!editTitle.trim()) {
      alert("作業名を入力してください");
      return;
    }

    setTasks(
      tasks.map((task) => {
        if (task.id !== editingTaskId) {
          return task;
        }

        return {
          ...task,
          title: editTitle.trim(),
          date: editDate,
        };
      })
    );

    closeTaskEditor();
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
    const tutorialFlag =
      isTutorialSessionActive() && exampleApplied;

    addProjectRepo({
      id: crypto.randomUUID(),
      client: client.trim(),
      title: title.trim(),
      deadline,
      color: normalizeProjectColor(color),
      tasks,
      isTutorial: tutorialFlag ? true : undefined,
    });

    router.push("/projects");
  }

  const handleCreateProject = useTourAction(
    "create-project",
    createProject
  );

  return (
    <ThemedMain className="px-5 py-8 pb-32">

      <div className="mx-auto min-w-0 max-w-md">

        {/* 戻る */}
        <Link
          href="/projects"
          className="
            mb-6
            inline-flex
            items-center
            gap-2

            rounded-full

            bg-white/70 dark:bg-zinc-900/75 dark:bg-zinc-900/75

            px-4
            py-2

            text-sm
            text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 dark:text-zinc-500

            backdrop-blur-xl

            shadow-[0_2px_10px_rgba(0,0,0,0.04)]
          "
        >
          ← 戻る
        </Link>

        {/* カード */}
        <div
          data-tour="project-form"
          className="
            rounded-[38px]

            border border-white/60 dark:border-zinc-700/50 dark:border-zinc-700/50

            bg-white/75 dark:bg-zinc-900/80 dark:bg-zinc-900/80

            p-6

            backdrop-blur-2xl

            shadow-[0_10px_40px_rgba(0,0,0,0.06)]
          "
        >

          <h1 className="mb-8 text-2xl font-semibold">
            依頼追加
          </h1>

          {isTutorialSessionActive() && (
            <div className="mb-5">
              <button
                type="button"
                {...tourInstanceProps(
                  "tutorial-fill-example",
                  fillExampleInstance
                )}
                onClick={handleFillExample}
                className={`
                  w-full
                  rounded-[24px]
                  border border-zinc-200 dark:border-zinc-700 dark:border-zinc-700
                  bg-white/80 dark:bg-zinc-900/85 dark:bg-zinc-900/85
                  px-4
                  py-4
                  text-sm
                  text-zinc-700 dark:text-zinc-200 dark:text-zinc-200
                  shadow-[0_8px_28px_rgba(0,0,0,0.06)]
                `}
              >
                入力例を見る（自動入力）
              </button>
            </div>
          )}

          {/* 依頼主 */}
          <div className="mb-6">

            <p className="mb-2 text-sm text-zinc-400 dark:text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
              依頼主
            </p>

            <input
              value={client}
              onChange={(e) =>
                setClient(e.target.value)
              }
              placeholder="例: 依頼主の名前"

              className="
                w-full

                rounded-2xl

                border border-zinc-200 dark:border-zinc-700 dark:border-zinc-700

                bg-white/70 dark:bg-zinc-900/75 dark:bg-zinc-900/75

                px-4
                py-4

                outline-none
              "
            />

          </div>

          {/* 内容 */}
          <div className="mb-6">

            <p className="mb-2 text-sm text-zinc-400 dark:text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
              依頼内容
            </p>

            <input
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="例: MVイラスト"

              className="
                w-full

                rounded-2xl

                border border-zinc-200 dark:border-zinc-700 dark:border-zinc-700

                bg-white/70 dark:bg-zinc-900/75 dark:bg-zinc-900/75

                px-4
                py-4

                outline-none
              "
            />

          </div>

          <DeadlineField
            value={deadline}
            onChange={setDeadline}
          />

          {/* 色 */}
          <div className="mb-8">

            <p className="mb-3 text-sm text-zinc-400 dark:text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
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

              <p className="text-xs text-zinc-400 dark:text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
                {tasks.length}件
              </p>

            </div>

            {/* 入力 */}
            <div className="min-w-0 space-y-3">

              <input
                value={taskTitle}

                onChange={(e) =>
                  setTaskTitle(
                    e.target.value
                  )
                }

                placeholder="例: ラフ提出"

                className="
                  w-full

                  rounded-2xl

                  border border-zinc-200 dark:border-zinc-700 dark:border-zinc-700

                  bg-white/70 dark:bg-zinc-900/75 dark:bg-zinc-900/75

                  px-4
                  py-4

                  outline-none
                "
              />

              <TaskScheduleDateInput
                value={taskDate}
                onChange={setTaskDate}
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

                      border border-zinc-200 dark:border-zinc-700 dark:border-zinc-700

                      bg-white/70 dark:bg-zinc-900/75 dark:bg-zinc-900/75

                      p-4
                    "
                  >

                    <div className="flex items-start justify-between">

                      <div>

                        <p className="text-sm font-medium">
                          {task.title}
                        </p>

                        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">

                          {task.date
                            ? `やる日: ${task.date}`
                            : "やる日: 未設定"}

                        </p>

                      </div>

                      <div className="flex gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            openTaskEditor(task.id)
                          }
                          className="
                            rounded-xl
                            bg-zinc-100
                            px-3
                            py-1
                            text-xs
                            dark:bg-zinc-800
                          "
                        >
                          編集
                        </button>

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
                            text-zinc-700
                            dark:bg-zinc-800
                            dark:text-zinc-200
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
                            text-zinc-700
                            dark:bg-zinc-800
                            dark:text-zinc-200
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
          onClick={handleCreateProject}
          {...tourInstanceProps(
            "create-project",
            createProjectInstance
          )}

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

        <TaskEditorSheet
          open={Boolean(editingTaskId)}
          title={editTitle}
          date={editDate}
          onTitleChange={setEditTitle}
          onDateChange={setEditDate}
          onSave={saveTaskEdits}
          onClose={closeTaskEditor}
          onDelete={
            editingTaskId
              ? () => removeTask(editingTaskId)
              : undefined
          }
        />

      </div>

    </ThemedMain>
  );
}