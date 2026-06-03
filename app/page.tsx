"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";

import {
  saveProjectsRepo,
} from "@/lib/projectsRepo";
import { saveMemosRepo } from "@/lib/memosRepo";
import { getMemoText } from "@/lib/memoDisplay";
import { useProjectsRepo } from "@/lib/useProjectsRepo";
import { useMemos } from "@/lib/useMemos";
import {
  useShifts,
  useShiftTemplates,
} from "@/lib/useShiftData";
import { theme } from "@/lib/themeClasses";
import { appSurfaces } from "@/lib/appSurfaces";

import ThemedMain from "@/components/ThemedMain";
import BottomNav from "@/components/BottomNav";
import SimpleDatePicker from "@/components/SimpleDatePicker";
import HintLabel from "@/components/onboarding/HintLabel";
import { useOnboarding } from "@/components/onboarding/OnboardingProvider";
import { registerTutorialAction } from "@/lib/tutorialActionRegistry";
import {
  formatShiftTimeRange,
  getShiftKindLabel,
} from "@/lib/shiftDisplay";
import { getTemplatesForDate } from "@/lib/shiftUtils";
import HomeWorkPlanSections from "@/components/HomeWorkPlanSections";
import {
  isTaskOverdue,
  isTaskUnscheduled,
} from "@/lib/taskPlan";

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

function getMondayStart(date: Date) {
  const monday = new Date(date);
  const currentDay = monday.getDay();
  const mondayOffset =
    currentDay === 0 ? -6 : 1 - currentDay;

  monday.setDate(
    monday.getDate() + mondayOffset
  );
  monday.setHours(0, 0, 0, 0);

  return monday;
}

function getWeekOffsetForDate(
  targetDateString: string
) {
  const targetMonday = getMondayStart(
    new Date(targetDateString)
  );
  const todayMonday = getMondayStart(
    new Date()
  );
  const diffMs =
    targetMonday.getTime() -
    todayMonday.getTime();

  return Math.round(
    diffMs / (7 * 24 * 60 * 60 * 1000)
  );
}

export default function Home() {
  const {
    currentStepId,
    isTutorialActive,
    runTourAction,
  } = useOnboarding();

  const [weekOffset, setWeekOffset] =
    useState(0);

  const projects = useProjectsRepo();
  const memos = useMemos();
  const shifts = useShifts();
  const templates = useShiftTemplates();

  const [selectedDay, setSelectedDay] =
    useState<string | null>(null);

  const [calendarOpen, setCalendarOpen] =
    useState(false);

  const handleDatePickerClick =
    useCallback(() => {
      setCalendarOpen((open) => !open);

      if (
        isTutorialActive &&
        currentStepId === "home-date"
      ) {
        runTourAction("home-date-picker", {
          skipExecute: true,
        });
      }
    }, [
      currentStepId,
      isTutorialActive,
      runTourAction,
    ]);

  useEffect(() => {
    return registerTutorialAction(
      "home-date-picker",
      () => {
        setCalendarOpen((open) => !open);
      }
    );
  }, []);

  useEffect(() => {
    if (
      isTutorialActive &&
      currentStepId !== "home-date"
    ) {
      setCalendarOpen(false);
    }
  }, [currentStepId, isTutorialActive]);

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

  const overdueTasks = useMemo(
    () =>
      isViewingToday
        ? tasks.filter((task) =>
            isTaskOverdue(task, todayString)
          )
        : [],
    [isViewingToday, tasks, todayString]
  );

  const backlogTasks = useMemo(
    () => tasks.filter((task) => isTaskUnscheduled(task)),
    [tasks]
  );

  const activeDayShifts =
    getTemplatesForDate(
      activeDate,
      shifts,
      templates
    );

  const activeMemos = memos.filter(
    (memo) => memo.date === activeDate
  );

  const remainingCount =
    activeTasks.filter(
      (task) => !task.completed
    ).length +
    activeMemos.filter(
      (memo) => !memo.isCompleted
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

  function getDayShiftsForDate(
    date: Date
  ) {
    return getTemplatesForDate(
      formatDate(date),
      shifts,
      templates
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
    const dayShifts =
      getDayShiftsForDate(date);
    const taskLimit =
      dayDeadlines.length > 0
        ? 1
        : 2;

    return (
      <>
        {(dayShifts.work ||
          dayShifts.schedule) && (
          <div className="mb-2 flex flex-wrap gap-1">
            {dayShifts.work && (
              <span
                className={`
                  rounded-md
                  px-1.5
                  py-0.5
                  text-[9px]
                  font-medium
                  ${theme.bgSoft}
                  ${theme.text10}
                `}
              >
                仕
              </span>
            )}

            {dayShifts.schedule && (
              <span
                className="
                  rounded-md
                  px-1.5
                  py-0.5
                  text-[9px]
                  font-medium
                  border
                  border-violet-300/70
                  bg-[color-mix(in_srgb,#8b5cf6_14%,transparent)]
                  text-violet-700
                  dark:border-violet-800/55
                  dark:text-violet-300
                "
              >
                予
              </span>
            )}
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
            !dayShifts.work &&
            !dayShifts.schedule &&
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

  function toggleMemo(memoId: string) {
    const updated = memos.map((memo) => {
      if (memo.id !== memoId) {
        return memo;
      }

      return {
        ...memo,
        isCompleted: !memo.isCompleted,
        updatedAt: new Date().toISOString(),
      };
    });

    saveMemosRepo(updated);
  }

  function goToDate(dateString: string) {
    setSelectedDay(dateString);
    setWeekOffset(
      getWeekOffsetForDate(dateString)
    );
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
              home
            </p>

            <h1 className={`mt-1 ${appSurfaces.pageTitle}`}>
              ホーム
            </h1>

          </div>

          <HintLabel hintId="home-date">
            <SimpleDatePicker
              open={calendarOpen}
              onClose={() =>
                setCalendarOpen(false)
              }
              selectedDate={activeDate}
              onSelectDate={goToDate}
            >
              <button
                type="button"
                data-tour="home-date-picker"
                onClick={handleDatePickerClick}
                className={`
                  ${appSurfaces.glassBadge}
                  transition-all
                  hover:scale-[1.02]
                  active:scale-[0.98]
                `}
              >
                {new Date(activeDate).getMonth() + 1}/
                {new Date(activeDate).getDate()}
              </button>
            </SimpleDatePicker>
          </HintLabel>

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

            {(activeDayShifts.work ||
              activeDayShifts.schedule) && (
              <div className="mb-4 flex flex-wrap gap-2">
                {activeDayShifts.work && (
                  <div
                    className={`
                      min-w-0
                      flex-1
                      rounded-2xl
                      border
                      ${theme.border}
                      ${theme.bgSoft}
                      px-3
                      py-2.5
                    `}
                  >
                    <p className={theme.textXs}>
                      {getShiftKindLabel(
                        activeDayShifts.work
                      )}
                    </p>

                    <p
                      className={`mt-0.5 text-xs font-medium ${appSurfaces.bodyText}`}
                    >
                      {formatShiftTimeRange(
                        activeDayShifts.work
                      )}
                    </p>
                  </div>
                )}

                {activeDayShifts.schedule && (
                  <div
                    className="
                      min-w-0
                      flex-1
                      rounded-2xl
                      border
                      border-violet-300/70
                      bg-[color-mix(in_srgb,#8b5cf6_12%,transparent)]
                      px-3
                      py-2.5
                      dark:border-violet-800/55
                    "
                  >
                    <p className="text-xs text-violet-600 dark:text-violet-300">
                      予定
                    </p>

                    <p
                      className={`mt-0.5 text-xs font-medium ${appSurfaces.bodyText}`}
                    >
                      {formatShiftTimeRange(
                        activeDayShifts.schedule
                      )}
                    </p>
                  </div>
                )}
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

              {activeMemos.length === 0 &&
                !activeDayShifts.work &&
                !activeDayShifts.schedule &&
                activeDeadlines.length ===
                  0 &&
                activeTasks.length ===
                  0 &&
                overdueTasks.length ===
                  0 &&
                backlogTasks.length ===
                  0 && (
                  <div className={appSurfaces.emptyPanel}>
                    予定はありません
                  </div>
                )}

              {activeMemos.map((memo) => (
                <button
                  key={memo.id}
                  type="button"
                  onClick={() =>
                    toggleMemo(memo.id)
                  }
                  className={`
                    ${appSurfaces.taskButton}
                    border-violet-200/80
                    dark:border-violet-900/40

                    ${
                      memo.isCompleted
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
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-xs font-medium text-violet-600 dark:text-violet-300">
                        メモ
                      </p>

                      <p
                        className={`
                          mt-1
                          text-sm
                          font-medium
                          transition-all

                          ${
                            memo.isCompleted
                              ? "line-through text-zinc-400 dark:text-zinc-500"
                              : appSurfaces.bodyText
                          }
                        `}
                      >
                        {getMemoText(memo)}
                      </p>
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
                            memo.isCompleted
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
                          background: memo.isCompleted
                            ? "var(--theme-accent)"
                            : "white",
                          borderColor: memo.isCompleted
                            ? "var(--theme-accent)"
                            : "#d4d4d8",
                        }}
                      >
                        ✓
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {(activeTasks.length > 0 ||
                overdueTasks.length > 0 ||
                backlogTasks.length > 0) && (
                <HomeWorkPlanSections
                  todayString={todayString}
                  isViewingToday={isViewingToday}
                  activeTasks={activeTasks}
                  overdueTasks={overdueTasks}
                  backlogTasks={backlogTasks}
                  onToggleTask={toggleTask}
                />
              )}

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
                      ? appSurfaces.weekDaySelected
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
                      ? appSurfaces.weekDaySelected
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