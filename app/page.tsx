"use client";

import {
  useMemo,
  useState,
} from "react";
import Link from "next/link";

import {
  saveProjectsRepo,
} from "@/lib/projectsRepo";
import { useProjectsRepo } from "@/lib/useProjectsRepo";
import {
  useShifts,
  useShiftTemplates,
} from "@/lib/useShiftData";
import { theme } from "@/lib/themeClasses";
import { appSurfaces } from "@/lib/appSurfaces";

import ThemedMain from "@/components/ThemedMain";
import BottomNav from "@/components/BottomNav";
import HintLabel from "@/components/onboarding/HintLabel";

function getWeekDates(offset = 0) {
  const now = new Date();

  const currentDay = now.getDay();

  const mondayOffset =
    currentDay === 0
      ? -6
      : 1 - currentDay;

  const monday = new Date(now);

  monday.setDate(
    now.getDate() +
      mondayOffset +
      offset * 7
  );

  return Array.from(
    { length: 7 },
    (_, i) => {
      const d = new Date(monday);

      d.setDate(
        monday.getDate() + i
      );

      return d;
    }
  );
}

function formatDate(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function Home() {
  const [weekOffset, setWeekOffset] =
    useState(0);

  const projects = useProjectsRepo();
  const shifts = useShifts();
  const templates = useShiftTemplates();

  const [selectedDay, setSelectedDay] =
    useState<string | null>(null);

  const weekDates = useMemo(
    () => getWeekDates(weekOffset),
    [weekOffset]
  );

  const tasks = projects.flatMap(
    (project) =>
      project.tasks.map((task) => ({
        ...task,
        projectId: project.id,
        color: project.color,
        projectTitle:
          project.title,
        client:
          project.client,
      }))
  );

  const today = new Date();

  const todayString =
    formatDate(today);

  const activeDate =
    selectedDay || todayString;

  const isViewingToday =
    activeDate === todayString;

  const activeTasks =
    tasks.filter(
      (task) =>
        task.date === activeDate
    );

  const activeShift =
    shifts.find(
      (shift) =>
        shift.date === activeDate
    );

  const activeTemplate =
    activeShift
      ? templates.find(
          (template) =>
            template.id ===
            activeShift.templateId
        )
      : null;

  const remainingCount =
    activeTasks.filter(
      (task) => !task.completed
    ).length;

  const weekText = `${weekDates[0].getMonth() + 1}/${weekDates[0].getDate()}〜${weekDates[6].getMonth() + 1}/${weekDates[6].getDate()}`;

  function getTasksForDate(
    date: Date
  ) {
    const target =
      formatDate(date);

    return tasks.filter(
      (task) =>
        task.date === target
    );
  }

  function getDeadlinesForDate(
    date: Date
  ) {
    const target =
      formatDate(date);

    return projects.filter(
      (project) =>
        project.deadline === target
    );
  }

  function getShiftForDate(
    date: Date
  ) {
    const target =
      formatDate(date);

    const shift = shifts.find(
      (s) => s.date === target
    );

    if (!shift) {
      return null;
    }

    return templates.find(
      (template) =>
        template.id ===
        shift.templateId
    );
  }

  const activeDeadlines =
    projects.filter(
      (project) =>
        project.deadline ===
        activeDate
    );

  function DayScheduleItems({
    date,
  }: {
    date: Date;
  }) {
    const dayTasks =
      getTasksForDate(date);
    const dayDeadlines =
      getDeadlinesForDate(date);
    const shift =
      getShiftForDate(date);
    const taskLimit =
      dayDeadlines.length > 0
        ? 1
        : 2;

    return (
      <>
        {shift && (
          <div className={`mb-2 rounded-xl px-2 py-1 ${theme.bgSoft} ${theme.text10}`}>
            仕事
          </div>
        )}

        {dayDeadlines
          .slice(0, 1)
          .map((project) => (
            <div
              key={project.id}
              className="
                mb-2
                rounded-xl
                border
                border-amber-200/80
                bg-amber-50/90
                px-2
                py-1
                text-[10px]
                text-amber-800
                dark:border-amber-900/50
                dark:bg-amber-950/50
                dark:text-amber-200
              "
            >
              締切 ·{" "}
              {project.client ||
                project.title}
            </div>
          ))}

        <div className="space-y-1 overflow-hidden">
          {dayTasks.length ===
            0 &&
            !shift &&
            dayDeadlines.length ===
              0 && (
              <p className="text-[10px] text-zinc-300 dark:text-zinc-500">
                予定なし
              </p>
            )}

          {dayTasks
            .slice(0, taskLimit)
            .map((task) => (
              <div
                key={task.id}
                className={`
                  flex
                  items-center
                  gap-1
                  text-[11px]

                  ${
                    task.completed
                      ? "opacity-40"
                      : ""
                  }
                `}
              >
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    background:
                      task.color,
                  }}
                />

                <p className="truncate">
                  {task.title}
                </p>
              </div>
            ))}
        </div>
      </>
    );
  }

  function toggleTask(
    projectId: string,
    taskId: string
  ) {
    const updatedProjects =
      projects.map((project) => {

        if (
          project.id !== projectId
        ) {
          return project;
        }

        return {
          ...project,

          tasks: project.tasks.map(
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
      });

    saveProjectsRepo(updatedProjects);
  }

  const topDays =
    weekDates.slice(0, 4);

  const bottomDays =
    weekDates.slice(4);

  return (
    <ThemedMain className="px-5 py-6 pb-32">
      <div className="mx-auto max-w-md">

        {/* タイトル */}
        <div className="mb-6 flex items-center justify-between">

          <div>

            <p className={appSurfaces.mutedLabel}>
              illustrator workflow
            </p>

            <h1 className={`mt-1 ${appSurfaces.pageTitle}`}>
              atelier-flow
            </h1>

          </div>

          <div className={appSurfaces.glassBadge}>
            {today.getMonth() + 1}/
            {today.getDate()}
          </div>

        </div>

        {/* 詳細表示 */}
        <div
          className={`mb-6 ${appSurfaces.heroCard}`}
        >

          <div
            className={appSurfaces.heroSheen}
          />

          <div className="relative z-10">

            <div className="mb-4 flex items-start justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <p className="text-sm text-zinc-400">
                    {isViewingToday
                      ? "今日やること"
                      : "選択中の日"}
                  </p>

                  {isViewingToday && (

                    <div
                      className={`
                        rounded-full
                        ${theme.bgSoft}
                        px-2 py-1
                        ${theme.text10Medium}
                      `}
                    >
                      TODAY
                    </div>

                  )}

                </div>

                <h2 className="mt-1 text-lg font-semibold">
                  {activeDate}
                </h2>

              </div>

              <div className="flex items-center gap-2">

                <div className={appSurfaces.countChip}>
                  残り
                  {remainingCount}
                  件
                </div>

                <div
                  className={`
                    rounded-full
                    ${theme.bgSoft}
                    px-3
                    py-1
                    ${theme.textXs}
                  `}
                >
                  {activeTasks.length}
                  件
                </div>

              </div>

            </div>

            {activeTemplate && (

              <div
                className={`
                  mb-4
                  rounded-2xl
                  border
                  ${theme.border}
                  ${theme.bgSoft}
                  px-4
                  py-3
                `}
              >

                <p className={theme.textXs}>
                  シフト
                </p>

                <p className={`mt-1 text-sm font-medium ${appSurfaces.bodyText}`}>
                  {activeTemplate.start}
                  〜
                  {activeTemplate.end}
                </p>

              </div>

            )}

            {activeDeadlines.length >
              0 && (
              <div className="mb-4 space-y-2">
                {activeDeadlines.map(
                  (project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="
                        block
                        rounded-2xl
                        border
                        border-amber-200/80
                        bg-amber-50/90
                        px-4
                        py-3
                        transition-all
                        dark:border-amber-900/50
                        dark:bg-amber-950/40
                      "
                    >
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        締切
                      </p>

                      <p className={`mt-1 text-sm font-medium ${appSurfaces.bodyText}`}>
                        {project.client ||
                          "依頼主なし"}
                      </p>

                      <p className={`mt-0.5 text-xs ${appSurfaces.subtleText}`}>
                        {project.title ||
                          "依頼内容なし"}
                      </p>
                    </Link>
                  )
                )}
              </div>
            )}

            <div className="space-y-3">

              {activeTasks.length ===
                0 &&
                !activeTemplate &&
                activeDeadlines.length ===
                  0 && (

                <div className={appSurfaces.emptyPanel}>
                  予定はありません
                </div>

              )}

              {activeTasks.map((task) => (

                <button
                  key={task.id}

                  onClick={() => {
                    toggleTask(
                      task.projectId,
                      task.id
                    );
                  }}

                  className={`
                    ${appSurfaces.taskButton}

                    ${
                      task.completed
                        ? `
                          scale-[0.98]
                          opacity-55
                        `
                        : `
                          hover:scale-[1.01]
                        `
                    }
                  `}
                >

                  <div className="flex items-start justify-between">

                    <div className="min-w-0 flex-1">

                      <div className="flex items-center gap-2">

                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{
                            background:
                              task.color,
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

                      </div>

                    </div>

                    {/* チェック */}
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
                              ? `
                                scale-105
                                text-white
                              `
                              : `
                                bg-white
                                text-transparent
                              `
                          }
                        `}

                        style={{
                          background:
                            task.completed
                              ? task.color
                              : "white",

                          borderColor:
                            task.completed
                              ? task.color
                              : "#d4d4d8",
                        }}
                      >
                        ✓
                      </div>

                    </div>

                  </div>

                </button>

              ))}

            </div>

          </div>

        </div>

        {/* 週移動 */}
        <HintLabel hintId="week-day">
        <div data-tour="week-calendar">
        <div className="mb-4 flex items-center justify-between">

          <button
            onClick={() =>
              setWeekOffset(
                (v) => v - 1
              )
            }

            className={appSurfaces.roundButton}
          >
            ←
          </button>

          <p className={`text-sm ${appSurfaces.subtleText}`}>
            {weekText}
          </p>

          <button
            onClick={() =>
              setWeekOffset(
                (v) => v + 1
              )
            }

            className={appSurfaces.roundButton}
          >
            →
          </button>

        </div>

        {/* 上段 */}
        <div className="mb-3 grid grid-cols-4 gap-3">

          {topDays.map((date) => {
            const targetDate =
              formatDate(date);

            const isToday =
              targetDate ===
              todayString;

            const isSelected =
              targetDate ===
              activeDate;

            return (

              <button
                key={date.toISOString()}

                onClick={() =>
                  setSelectedDay(
                    targetDate
                  )
                }

                className={`
                  aspect-square
                  rounded-[28px]
                  border
                  p-3
                  text-left
                  transition-all

                  ${
                    isSelected
                      ? `
                        ${theme.borderAccent}
                        ${theme.bgSofter}
                        ${theme.shadow}
                      `
                      : isToday
                      ? `
                        ${theme.border}
                        ${appSurfaces.dayCellToday}
                        ${theme.shadowSoft}
                      `
                      : appSurfaces.dayCellIdle
                  }
                `}
              >

                <div className="mb-2 flex items-center justify-between">

                  <p className="text-sm text-zinc-400">
                    {
                      [
                        "月",
                        "火",
                        "水",
                        "木",
                        "金",
                        "土",
                        "日",
                      ][
                        (
                          date.getDay() +
                          6
                        ) % 7
                      ]
                    }
                  </p>

                  <div className="flex items-center gap-1">

                    {isToday && (
                      <div className={`h-2 w-2 rounded-full ${theme.dot}`} />
                    )}

                    <p className="text-xs text-zinc-300 dark:text-zinc-500">
                      {date.getDate()}
                    </p>

                  </div>

                </div>

                <DayScheduleItems
                  date={date}
                />

              </button>

            );
          })}

        </div>

        {/* 下段 */}
        <div className="flex justify-center gap-3">

          {bottomDays.map((date) => {
            const targetDate =
              formatDate(date);

            const isToday =
              targetDate ===
              todayString;

            const isSelected =
              targetDate ===
              activeDate;

            return (

              <button
                key={date.toISOString()}

                onClick={() =>
                  setSelectedDay(
                    targetDate
                  )
                }

                className={`
                  aspect-square
                  w-[22%]
                  rounded-[28px]
                  border
                  p-3
                  text-left
                  transition-all

                  ${
                    isSelected
                      ? `
                        ${theme.borderAccent}
                        ${theme.bgSofter}
                        ${theme.shadow}
                      `
                      : isToday
                      ? `
                        ${theme.border}
                        ${appSurfaces.dayCellToday}
                        ${theme.shadowSoft}
                      `
                      : appSurfaces.dayCellIdle
                  }
                `}
              >

                <div className="mb-2 flex items-center justify-between">

                  <p className="text-sm text-zinc-400">
                    {
                      [
                        "月",
                        "火",
                        "水",
                        "木",
                        "金",
                        "土",
                        "日",
                      ][
                        (
                          date.getDay() +
                          6
                        ) % 7
                      ]
                    }
                  </p>

                  <div className="flex items-center gap-1">

                    {isToday && (
                      <div className={`h-2 w-2 rounded-full ${theme.dot}`} />
                    )}

                    <p className="text-xs text-zinc-300 dark:text-zinc-500">
                      {date.getDate()}
                    </p>

                  </div>

                </div>

                <DayScheduleItems
                  date={date}
                />

              </button>

            );
          })}

        </div>

        </div>
        </HintLabel>

      </div>

      <BottomNav />

    </ThemedMain>
  );
}