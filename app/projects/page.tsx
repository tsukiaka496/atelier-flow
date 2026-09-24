"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import type { Project } from "@/lib/storage";
import { isHobbyProject } from "@/lib/storage";
import { useProjectsRepo } from "@/lib/useProjectsRepo";
import { appSurfaces } from "@/lib/appSurfaces";
import {
  getProjectProgress,
  isProjectFullyCompleted,
} from "@/lib/projectProgress";

import PageShell from "@/components/PageShell";

type SortType = "deadline" | "progress";
type SortDir = "asc" | "desc";

const SORT_KEY = "atelier-sort";
const SORT_DIR_KEY = "atelier-sort-dir";
const SHOW_COMPLETED_KEY = "atelier-show-completed";
const PREFS_CHANGED_EVENT = "atelier-flow:projects-list-prefs";

function subscribeListPrefs(onChange: () => void) {
  window.addEventListener(PREFS_CHANGED_EVENT, onChange);

  return () => {
    window.removeEventListener(PREFS_CHANGED_EVENT, onChange);
  };
}

function notifyListPrefsChanged() {
  window.dispatchEvent(new Event(PREFS_CHANGED_EVENT));
}

function getSortTypeSnapshot(): SortType {
  const savedSort = localStorage.getItem(SORT_KEY);

  if (savedSort === "deadline" || savedSort === "progress") {
    return savedSort;
  }

  return "deadline";
}

function getSortDirSnapshot(): SortDir {
  const savedDir = localStorage.getItem(SORT_DIR_KEY);

  if (savedDir === "asc" || savedDir === "desc") {
    return savedDir;
  }

  return getSortTypeSnapshot() === "progress" ? "desc" : "asc";
}

function getShowCompletedSnapshot(): boolean {
  return localStorage.getItem(SHOW_COMPLETED_KEY) === "true";
}

function getDaysLeft(deadline: string) {
  if (!deadline) {
    return 999999;
  }

  const today = new Date();
  const end = new Date(deadline);
  const diff = end.getTime() - today.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function ProjectsPage() {
  const projects = useProjectsRepo();

  const sortType = useSyncExternalStore(
    subscribeListPrefs,
    getSortTypeSnapshot,
    () => "deadline" as SortType
  );

  const showCompleted = useSyncExternalStore(
    subscribeListPrefs,
    getShowCompletedSnapshot,
    () => false
  );

  const sortDir = useSyncExternalStore(
    subscribeListPrefs,
    getSortDirSnapshot,
    () => "asc" as SortDir
  );

  function changeSort(type: SortType) {
    localStorage.setItem(SORT_KEY, type);
    notifyListPrefsChanged();
  }

  function changeSortDir(dir: SortDir) {
    localStorage.setItem(SORT_DIR_KEY, dir);
    notifyListPrefsChanged();
  }

  function toggleCompleted() {
    localStorage.setItem(
      SHOW_COMPLETED_KEY,
      String(!showCompleted)
    );
    notifyListPrefsChanged();
  }

  const filteredProjects = projects.filter((project) => {
    if (!showCompleted) {
      return !isProjectFullyCompleted(project);
    }

    return true;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const direction = sortDir === "desc" ? -1 : 1;

    if (sortType === "deadline") {
      const aHasDeadline = Boolean(a.deadline);
      const bHasDeadline = Boolean(b.deadline);

      if (aHasDeadline && !bHasDeadline) {
        return -1;
      }

      if (!aHasDeadline && bHasDeadline) {
        return 1;
      }

      if (!aHasDeadline && !bHasDeadline) {
        return 0;
      }

      return (
        (getDaysLeft(a.deadline) - getDaysLeft(b.deadline)) *
        direction
      );
    }

    if (sortType === "progress") {
      return (
        (getProjectProgress(a) - getProjectProgress(b)) *
        direction
      );
    }

    return 0;
  });

  return (
    <PageShell title="案件">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => changeSort("deadline")}
            className="rounded-full px-4 py-2 text-sm transition-all"
            style={{
              background:
                sortType === "deadline"
                  ? "var(--theme-accent)"
                  : "rgba(255,255,255,0.7)",
              color:
                sortType === "deadline" ? "white" : "#52525b",
            }}
          >
            納期順 {sortType === "deadline" ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>

          <button
            type="button"
            onClick={() => changeSort("progress")}
            className="rounded-full px-4 py-2 text-sm transition-all"
            style={{
              background:
                sortType === "progress"
                  ? "var(--theme-accent)"
                  : "rgba(255,255,255,0.7)",
              color:
                sortType === "progress" ? "white" : "#52525b",
            }}
          >
            進捗順 {sortType === "progress" ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>

          <button
            type="button"
            onClick={() => changeSortDir("asc")}
            className="rounded-full px-4 py-2 text-sm transition-all"
            style={{
              background:
                sortDir === "asc"
                  ? "var(--theme-accent)"
                  : "rgba(255,255,255,0.7)",
              color: sortDir === "asc" ? "white" : "#52525b",
            }}
          >
            昇順
          </button>

          <button
            type="button"
            onClick={() => changeSortDir("desc")}
            className="rounded-full px-4 py-2 text-sm transition-all"
            style={{
              background:
                sortDir === "desc"
                  ? "var(--theme-accent)"
                  : "rgba(255,255,255,0.7)",
              color: sortDir === "desc" ? "white" : "#52525b",
            }}
          >
            降順
          </button>

          <button
            type="button"
            onClick={toggleCompleted}
            className="rounded-full px-4 py-2 text-sm transition-all"
            style={{
              background: showCompleted
                ? "var(--theme-accent)"
                : "rgba(255,255,255,0.7)",
              color: showCompleted ? "white" : "#52525b",
            }}
          >
            完了済み表示
          </button>
        </div>

        <div className="space-y-4">
          {sortedProjects.length === 0 && (
            <div
              className={`
                border border-dashed border-zinc-300
                p-8
                text-center
                text-sm
                text-zinc-400
                dark:border-zinc-600
                dark:text-zinc-500
                ${appSurfaces.cardSm}
              `}
            >
              表示できる案件がありません
            </div>
          )}

          {sortedProjects.map((project: Project) => {
            const daysLeft = getDaysLeft(project.deadline);
            const progress = getProjectProgress(project);
            const projectDone = isProjectFullyCompleted(project);
            const hobby = isHobbyProject(project);

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={`
                  block p-5
                  ${appSurfaces.card}
                  transition-all
                  ${
                    projectDone
                      ? "opacity-70 saturate-[0.65]"
                      : ""
                  }
                `}
                style={
                  projectDone
                    ? {
                        borderColor:
                          "color-mix(in srgb, var(--theme-accent) 25%, transparent)",
                      }
                    : undefined
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div
                      className="mt-1 h-3 w-3 rounded-full"
                      style={{ background: project.color }}
                    />

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2
                          className={`text-[15px] font-medium ${
                            projectDone
                              ? "text-zinc-400 line-through dark:text-zinc-500"
                              : ""
                          }`}
                        >
                          {hobby
                            ? project.title || "描きたいものなし"
                            : project.client || "依頼主なし"}
                        </h2>

                        <span
                          className="
                            rounded-full
                            px-2
                            py-0.5
                            text-[10px]
                            font-medium
                          "
                          style={{
                            background: hobby
                              ? "rgba(167,139,250,0.18)"
                              : "color-mix(in srgb, var(--theme-accent) 16%, transparent)",
                            color: hobby
                              ? "#7c3aed"
                              : "var(--theme-accent)",
                          }}
                        >
                          {hobby ? "趣味" : "案件"}
                        </span>

                        {projectDone && (
                          <span
                            className="
                              rounded-full
                              px-2
                              py-0.5
                              text-[10px]
                              font-medium
                            "
                            style={{
                              background:
                                "color-mix(in srgb, var(--theme-accent) 18%, transparent)",
                              color: "var(--theme-accent)",
                            }}
                          >
                            完了
                          </span>
                        )}
                      </div>

                      {!hobby && (
                        <p
                          className={`mt-1 text-sm ${appSurfaces.subtleText}`}
                        >
                          {project.title || "依頼内容なし"}
                        </p>
                      )}

                      {hobby && (
                        <p
                          className={`mt-1 text-sm ${appSurfaces.subtleText}`}
                        >
                          描きたいもの
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {project.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="rounded-xl px-3 py-1 text-xs transition-all"
                            style={{
                              background: task.completed
                                ? `${project.color}20`
                                : "#f4f4f5",
                              color: task.completed
                                ? project.color
                                : "#52525b",
                              border: task.completed
                                ? `1px solid ${project.color}`
                                : "none",
                            }}
                          >
                            {task.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className="text-sm font-medium"
                      style={{ color: project.color }}
                    >
                      {progress}%
                    </p>

                    <p
                      className={`mt-1 text-xs ${appSurfaces.subtleText}`}
                    >
                      {project.deadline
                        ? `あと${daysLeft}日`
                        : "納期なし"}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}

          <Link
            href="/projects/new"
            className={`
              flex
              items-center
              justify-center
              border border-dashed border-zinc-300
              py-6
              text-2xl
              text-zinc-400
              dark:border-zinc-600
              dark:text-zinc-500
              ${appSurfaces.cardSm}
            `}
          >
            ＋
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
