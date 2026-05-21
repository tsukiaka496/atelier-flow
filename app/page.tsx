"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getProjects,
  saveProjects,
  getShifts,
  getShiftTemplates,
} from "@/lib/storage";

import ThemedMain from "@/components/ThemedMain";
import { theme } from "@/lib/themeClasses";

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

  const [projects, setProjects] =
    useState(getProjects());

  const [shifts, setShifts] =
    useState<any[]>([]);

  const [templates, setTemplates] =
    useState<any[]>([]);

  const [selectedDay, setSelectedDay] =
    useState<string | null>(null);

  useEffect(() => {
    setProjects(getProjects());

    setShifts(getShifts());

    setTemplates(
      getShiftTemplates()
    );
  }, []);

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

    setProjects(updatedProjects);

    saveProjects(updatedProjects);
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

            <p className="text-sm text-zinc-400">
              illustrator workflow
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-wide">
              atelier-flow
            </h1>

          </div>

          <div
            className="
              rounded-full
              border border-white/60
              bg-white/70
              px-4
              py-2
              text-sm
              text-zinc-500
              backdrop-blur-xl
              shadow-[0_2px_10px_rgba(0,0,0,0.04)]
            "
          >
            {today.getMonth() + 1}/
            {today.getDate()}
          </div>

        </div>

        {/* 詳細表示 */}
        <div
          className="
            relative
            mb-6
            overflow-hidden
            rounded-[34px]
            border border-white/60
            bg-white/75
            p-5
            backdrop-blur-2xl
            shadow-[0_10px_30px_rgba(0,0,0,0.05)]
          "
        >

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_35%)]
              opacity-80
            "
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

                <div
                  className="
                    rounded-full
                    bg-zinc-100
                    px-3
                    py-1
                    text-xs
                    text-zinc-500
                  "
                >
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

                <p className="mt-1 text-sm font-medium text-zinc-700">
                  {activeTemplate.start}
                  〜
                  {activeTemplate.end}
                </p>

              </div>

            )}

            <div className="space-y-3">

              {activeTasks.length ===
                0 && !activeTemplate && (

                <div
                  className="
                    rounded-2xl
                    border border-dashed border-zinc-200
                    bg-white/70
                    px-4
                    py-5
                    text-center
                    text-sm
                    text-zinc-400
                  "
                >
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
                    w-full
                    rounded-2xl
                    border border-white/60
                    bg-white/70
                    px-4
                    py-4
                    text-left
                    backdrop-blur-xl
                    transition-all
                    duration-300

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
                                ? "line-through text-zinc-400"
                                : "text-zinc-700"
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
        <div className="mb-4 flex items-center justify-between">

          <button
            onClick={() =>
              setWeekOffset(
                (v) => v - 1
              )
            }

            className="
              rounded-full
              bg-white/70
              px-3
              py-2
              text-sm
              text-zinc-500
              shadow-[0_2px_10px_rgba(0,0,0,0.03)]
            "
          >
            ←
          </button>

          <p className="text-sm text-zinc-500">
            {weekText}
          </p>

          <button
            onClick={() =>
              setWeekOffset(
                (v) => v + 1
              )
            }

            className="
              rounded-full
              bg-white/70
              px-3
              py-2
              text-sm
              text-zinc-500
              shadow-[0_2px_10px_rgba(0,0,0,0.03)]
            "
          >
            →
          </button>

        </div>

        {/* 上段 */}
        <div className="mb-3 grid grid-cols-4 gap-3">

          {topDays.map((date) => {

            const dayTasks =
              getTasksForDate(date);

            const shift =
              getShiftForDate(date);

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
                        bg-white
                        ${theme.shadowSoft}
                      `
                      : `
                        border-zinc-200
                        bg-white/90
                        shadow-[0_2px_10px_rgba(0,0,0,0.03)]
                      `
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

                    <p className="text-xs text-zinc-300">
                      {date.getDate()}
                    </p>

                  </div>

                </div>

                {shift && (
                  <div className={`mb-2 rounded-xl px-2 py-1 ${theme.bgSoft} ${theme.text10}`}>
                    仕事
                  </div>
                )}

                <div className="space-y-1 overflow-hidden">

                  {dayTasks.length ===
                    0 && !shift && (

                    <p className="text-[10px] text-zinc-300">
                      予定なし
                    </p>

                  )}

                  {dayTasks
                    .slice(0, 2)
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
                          className="h-2.5 w-2.5 rounded-full shrink-0"
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

              </button>

            );
          })}

        </div>

        {/* 下段 */}
        <div className="flex justify-center gap-3">

          {bottomDays.map((date) => {

            const dayTasks =
              getTasksForDate(date);

            const shift =
              getShiftForDate(date);

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
                        bg-white
                        ${theme.shadowSoft}
                      `
                      : `
                        border-zinc-200
                        bg-white/90
                        shadow-[0_2px_10px_rgba(0,0,0,0.03)]
                      `
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

                    <p className="text-xs text-zinc-300">
                      {date.getDate()}
                    </p>

                  </div>

                </div>

                {shift && (
                  <div className={`mb-2 rounded-xl px-2 py-1 ${theme.bgSoft} ${theme.text10}`}>
                    仕事
                  </div>
                )}

                <div className="space-y-1 overflow-hidden">

                  {dayTasks.length ===
                    0 && !shift && (

                    <p className="text-[10px] text-zinc-300">
                      予定なし
                    </p>

                  )}

                  {dayTasks
                    .slice(0, 2)
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
                          className="h-2.5 w-2.5 rounded-full shrink-0"
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

              </button>

            );
          })}

        </div>

      </div>

      {/* 下バー */}
      <div
        className="
          fixed
          bottom-5
          left-1/2
          -translate-x-1/2
          flex
          items-center
          justify-between
          w-[92%]
          max-w-md
          rounded-[30px]
          border border-white/60
          bg-white/70
          px-6
          py-4
          backdrop-blur-xl
          shadow-[0_8px_30px_rgba(0,0,0,0.08)]
        "
      >

        <Link
          href="/"
          className={theme.navActive}
        >
          ホーム
        </Link>

        <Link
          href="/projects"
          className="text-sm text-zinc-500"
        >
          案件
        </Link>

        <Link
          href="/month"
          className="text-sm text-zinc-500"
        >
          月
        </Link>

        <Link
          href="/settings"
          className="text-sm text-zinc-500"
        >
          設定
        </Link>

      </div>

    </ThemedMain>
  );
}