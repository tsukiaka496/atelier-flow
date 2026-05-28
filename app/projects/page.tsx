"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import type { Project } from "@/lib/storage";
import { useProjectsRepo } from "@/lib/useProjectsRepo";
import { useTourAction } from "@/lib/useTourAction";
import {
  tourInstanceProps,
  useTourInstanceId,
} from "@/lib/useTourInstanceId";
import { appSurfaces } from "@/lib/appSurfaces";

import ThemedMain from "@/components/ThemedMain";
import BottomNav from "@/components/BottomNav";
import HintLabel from "@/components/onboarding/HintLabel";

type SortType = "deadline" | "progress";

const SORT_KEY = "atelier-sort";
const SHOW_COMPLETED_KEY =
  "atelier-show-completed";
const PREFS_CHANGED_EVENT =
  "atelier-flow:projects-list-prefs";

function subscribeListPrefs(onChange: () => void) {
  window.addEventListener(
    PREFS_CHANGED_EVENT,
    onChange
  );

  return () => {
    window.removeEventListener(
      PREFS_CHANGED_EVENT,
      onChange
    );
  };
}

function notifyListPrefsChanged() {
  window.dispatchEvent(
    new Event(PREFS_CHANGED_EVENT)
  );
}

function getSortTypeSnapshot(): SortType {
  const savedSort = localStorage.getItem(
    SORT_KEY
  );

  if (
    savedSort === "deadline" ||
    savedSort === "progress"
  ) {
    return savedSort;
  }

  return "deadline";
}

function getShowCompletedSnapshot(): boolean {
  return (
    localStorage.getItem(
      SHOW_COMPLETED_KEY
    ) === "true"
  );
}

export default function ProjectsPage() {
  const triggerProjectsAdd =
    useTourAction("projects-add");
  const triggerProjectCard =
    useTourAction("project-card");

  const projectsAddInstance =
    useTourInstanceId("projects-add");
  const projectCardInstance =
    useTourInstanceId("project-card");

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

  function changeSort(type: SortType) {
    localStorage.setItem(SORT_KEY, type);
    notifyListPrefsChanged();
  }

  function toggleCompleted() {
    localStorage.setItem(
      SHOW_COMPLETED_KEY,
      String(!showCompleted)
    );
    notifyListPrefsChanged();
  }

  function getDaysLeft(deadline: string) {
    if (!deadline) {
      return 999999;
    }

    const today = new Date();
    const end = new Date(deadline);
    const diff =
      end.getTime() - today.getTime();

    return Math.ceil(
      diff / (1000 * 60 * 60 * 24)
    );
  }

  function getProgress(project: Project) {
    if (project.tasks.length === 0) {
      return 0;
    }

    const completed =
      project.tasks.filter(
        (task) => task.completed
      ).length;

    return Math.round(
      (completed / project.tasks.length) *
        100
    );
  }

  function isCompleted(project: Project) {
    return getProgress(project) === 100;
  }

  const filteredProjects = projects.filter(
    (project) => {
      if (!showCompleted) {
        return !isCompleted(project);
      }

      return true;
    }
  );

  const sortedProjects = [
    ...filteredProjects,
  ].sort((a, b) => {
    if (sortType === "deadline") {
      return (
        getDaysLeft(a.deadline) -
        getDaysLeft(b.deadline)
      );
    }

    if (sortType === "progress") {
      return (
        getProgress(b) -
        getProgress(a)
      );
    }

    return 0;
  });

  const tourProjectId =
    projects.find(
      (project) => project.isTutorial
    )?.id ?? sortedProjects[0]?.id;

  return (
    <ThemedMain className="px-5 py-8 pb-32">
      <div className="mx-auto max-w-md">
        <div className="mb-6">
          <p className={appSurfaces.mutedLabel}>
            project list
          </p>

          <h1 className={`mt-1 ${appSurfaces.pageTitle}`}>
            案件
          </h1>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <button
            onClick={() =>
              changeSort("deadline")
            }
            className="
              rounded-full
              px-4
              py-2
              text-sm
              transition-all
            "
            style={{
              background:
                sortType === "deadline"
                  ? "var(--theme-accent)"
                  : "rgba(255,255,255,0.7)",
              color:
                sortType === "deadline"
                  ? "white"
                  : "#52525b",
            }}
          >
            納期順
          </button>

          <button
            onClick={() =>
              changeSort("progress")
            }
            className="
              rounded-full
              px-4
              py-2
              text-sm
              transition-all
            "
            style={{
              background:
                sortType === "progress"
                  ? "var(--theme-accent)"
                  : "rgba(255,255,255,0.7)",
              color:
                sortType === "progress"
                  ? "white"
                  : "#52525b",
            }}
          >
            進捗順
          </button>

          <button
            onClick={toggleCompleted}
            className="
              rounded-full
              px-4
              py-2
              text-sm
              transition-all
            "
            style={{
              background:
                showCompleted
                  ? "var(--theme-accent)"
                  : "rgba(255,255,255,0.7)",
              color:
                showCompleted
                  ? "white"
                  : "#52525b",
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

          {sortedProjects.map((project) => {
            const daysLeft =
              getDaysLeft(
                project.deadline
              );
            const progress =
              getProgress(project);
            const isTourCard =
              project.id === tourProjectId;
            const cardTourProps =
              isTourCard
                ? tourInstanceProps(
                    "project-card",
                    projectCardInstance
                  )
                : {};

            const card = (
                <Link
                  href={`/projects/${project.id}`}
                  className={`block p-5 ${appSurfaces.card}`}
                  {...cardTourProps}
                  onClick={
                    isTourCard
                      ? triggerProjectCard
                      : undefined
                  }
                >
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
                            project.color,
                        }}
                      />

                      <div>
                        <h2 className="text-[15px] font-medium">
                          {project.client ||
                            "依頼主なし"}
                        </h2>

                        <p className={`mt-1 text-sm ${appSurfaces.subtleText}`}>
                          {project.title ||
                            "依頼内容なし"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {project.tasks.map(
                            (task) => (
                              <div
                                key={task.id}
                                className="
                                  rounded-xl
                                  px-3
                                  py-1
                                  text-xs
                                  transition-all
                                "
                                style={{
                                  background:
                                    task.completed
                                      ? `${project.color}20`
                                      : "#f4f4f5",
                                  color:
                                    task.completed
                                      ? project.color
                                      : "#52525b",
                                  border:
                                    task.completed
                                      ? `1px solid ${project.color}`
                                      : "none",
                                }}
                              >
                                {task.title}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className="text-sm font-medium"
                        style={{
                          color:
                            project.color,
                        }}
                      >
                        {progress}%
                      </p>

                      <p className={`mt-1 text-xs ${appSurfaces.subtleText}`}>
                        {project.deadline
                          ? `あと${daysLeft}日`
                          : "納期なし"}
                      </p>
                    </div>
                  </div>
                </Link>
            );

            if (isTourCard) {
              return (
                <HintLabel
                  key={project.id}
                  hintId="project-card"
                >
                  {card}
                </HintLabel>
              );
            }

            return (
              <div key={project.id}>
                {card}
              </div>
            );
          })}

          <HintLabel hintId="projects-add">
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
              {...tourInstanceProps(
                "projects-add",
                projectsAddInstance
              )}
              onClick={triggerProjectsAdd}
            >
              ＋
            </Link>
          </HintLabel>
        </div>
      </div>

      <BottomNav />
    </ThemedMain>
  );
}
