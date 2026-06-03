"use client";

import Link from "next/link";

import HintLabel from "@/components/onboarding/HintLabel";
import { appSurfaces } from "@/lib/appSurfaces";
import { formatPlanDateLabel } from "@/lib/taskPlan";

export type HomeEnrichedTask = {
  id: string;
  title: string;
  completed: boolean;
  date: string;
  projectId: string;
  color: string;
  projectTitle: string;
  client: string;
};

type HomeWorkPlanSectionsProps = {
  todayString: string;
  isViewingToday: boolean;
  activeTasks: HomeEnrichedTask[];
  overdueTasks: HomeEnrichedTask[];
  backlogTasks: HomeEnrichedTask[];
  onToggleTask: (
    projectId: string,
    taskId: string
  ) => void;
};

function TaskRow({
  task,
  referenceDay,
  onToggleTask,
  showPreviousPlan,
}: {
  task: HomeEnrichedTask;
  referenceDay: string;
  onToggleTask: HomeWorkPlanSectionsProps["onToggleTask"];
  showPreviousPlan?: boolean;
}) {
  return (
    <div
      className={`
        ${appSurfaces.taskButton}

        ${
          task.completed
            ? "scale-[0.98] opacity-55"
            : ""
        }
      `}
    >
      <button
        type="button"
        onClick={() =>
          onToggleTask(
            task.projectId,
            task.id
          )
        }
        className="
          w-full
          text-left
          transition-all
          hover:scale-[1.01]
          active:scale-[0.99]
        "
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 shrink-0 rounded-full"
                style={{
                  background: task.color,
                }}
              />

              <p
                className={`
                  truncate
                  text-sm
                  font-medium
                  transition-all

                  ${
                    task.completed
                      ? "line-through text-zinc-400 dark:text-zinc-500"
                      : appSurfaces.bodyText
                  }
                `}
              >
                {task.title}
              </p>
            </div>

            <div className="mt-2 pl-5">
              <p className="truncate text-xs text-zinc-500">
                {task.client}
              </p>

              <p className="mt-1 truncate text-xs text-zinc-400">
                {task.projectTitle}
              </p>

              {showPreviousPlan &&
                task.date && (
                  <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
                    予定日:{" "}
                    {formatPlanDateLabel(
                      task.date,
                      referenceDay
                    )}
                  </p>
                )}
            </div>
          </div>

          <div className="ml-4 pt-1">
            <div
              className={`
                flex
                h-6
                w-6
                items-center
                justify-center
                rounded-full
                border
                text-[11px]
                font-medium
                transition-all
                duration-300

                ${
                  task.completed
                    ? "scale-105 text-white"
                    : "bg-white text-transparent"
                }
              `}
              style={{
                background: task.completed
                  ? task.color
                  : "white",
                borderColor: task.completed
                  ? task.color
                  : "#d4d4d8",
              }}
            >
              ✓
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

export default function HomeWorkPlanSections({
  todayString,
  isViewingToday,
  activeTasks,
  overdueTasks,
  backlogTasks,
  onToggleTask,
}: HomeWorkPlanSectionsProps) {
  const rescheduleProjectLinks = (() => {
    const links = new Map<
      string,
      string
    >();

    for (const task of [
      ...overdueTasks,
      ...activeTasks.filter(
        (item) => !item.completed
      ),
    ]) {
      if (links.has(task.projectId)) {
        continue;
      }

      links.set(
        task.projectId,
        task.client ||
          task.projectTitle ||
          "案件"
      );
    }

    return links;
  })();

  return (
    <HintLabel hintId="home-work">
    <div className="space-y-4">
      {rescheduleProjectLinks.size > 0 && (
        <div className="flex flex-wrap gap-2">
          {[...rescheduleProjectLinks.entries()].map(
            ([projectId, label]) => (
              <Link
                key={projectId}
                href={`/projects/${projectId}`}
                className={`
                  rounded-full
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  ${appSurfaces.glassBadge}
                  text-[var(--theme-accent)]
                `}
              >
                {label}の日程を組み直す →
              </Link>
            )
          )}
        </div>
      )}

      {activeTasks.length > 0 && (
        <div className="space-y-3">
          {activeTasks.map((task) => (
            <TaskRow
              key={`${task.projectId}-${task.id}`}
              task={task}
              referenceDay={todayString}
              onToggleTask={onToggleTask}
            />
          ))}
        </div>
      )}

      {isViewingToday &&
        overdueTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
              予定日を過ぎた作業
            </p>

            <div className="space-y-3">
              {overdueTasks.map((task) => (
                <TaskRow
                  key={`overdue-${task.projectId}-${task.id}`}
                  task={task}
                  referenceDay={todayString}
                  showPreviousPlan
                  onToggleTask={onToggleTask}
                />
              ))}
            </div>
          </div>
        )}

      {backlogTasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            予定日なしの作業
          </p>

          <div className="space-y-3">
            {backlogTasks.map((task) => (
              <TaskRow
                key={`backlog-${task.projectId}-${task.id}`}
                task={task}
                referenceDay={todayString}
                onToggleTask={onToggleTask}
              />
            ))}
          </div>
        </div>
      )}

      {activeTasks.length === 0 &&
        overdueTasks.length === 0 &&
        backlogTasks.length === 0 && (
          <div className={appSurfaces.emptyPanel}>
            この日に予定された作業はありません。
            <Link
              href="/projects"
              className="mt-2 block text-xs text-[var(--theme-accent)]"
            >
              案件から作業を追加 →
            </Link>
          </div>
        )}
    </div>
    </HintLabel>
  );
}
