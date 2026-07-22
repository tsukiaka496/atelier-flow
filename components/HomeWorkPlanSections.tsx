"use client";

import Link from "next/link";

import { appSurfaces } from "@/lib/appSurfaces";
import type { HomeEnrichedTask } from "@/lib/taskPlan";

type HomeWorkPlanSectionsProps = {
  isViewingToday: boolean;
  activeTasks: HomeEnrichedTask[];
  overdueTasks: HomeEnrichedTask[];
  onToggleTask: (
    projectId: string,
    taskId: string
  ) => void;
};

function TaskRow({
  item,
  onToggleTask,
}: {
  item: HomeEnrichedTask;
  onToggleTask: HomeWorkPlanSectionsProps["onToggleTask"];
}) {
  const { task, projectId, projectColor, projectTitle, client } =
    item;

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
          onToggleTask(projectId, task.id)
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
                  background: projectColor,
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
                {client}
              </p>

              <p className="mt-1 truncate text-xs text-zinc-400">
                {projectTitle}
              </p>
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
                  ? projectColor
                  : "white",
                borderColor: task.completed
                  ? projectColor
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
  isViewingToday,
  activeTasks,
  overdueTasks,
  onToggleTask,
}: HomeWorkPlanSectionsProps) {
  const rescheduleProjectLinks = (() => {
    const links = new Map<string, string>();

    for (const item of [
      ...overdueTasks,
      ...activeTasks.filter(
        (entry) => !entry.task.completed
      ),
    ]) {
      if (links.has(item.projectId)) {
        continue;
      }

      links.set(
        item.projectId,
        item.client || item.projectTitle || "案件"
      );
    }

    return links;
  })();

  return (
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
          {activeTasks.map((item) => (
            <TaskRow
              key={`${item.projectId}-${item.task.id}`}
              item={item}
              onToggleTask={onToggleTask}
            />
          ))}
        </div>
      )}

      {isViewingToday && overdueTasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
            予定日を過ぎた作業
          </p>

          <div className="space-y-3">
            {overdueTasks.map((item) => (
              <TaskRow
                key={`overdue-${item.projectId}-${item.task.id}`}
                item={item}
                onToggleTask={onToggleTask}
              />
            ))}
          </div>
        </div>
      )}

      {activeTasks.length === 0 &&
        (!isViewingToday || overdueTasks.length === 0) && (
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
  );
}
