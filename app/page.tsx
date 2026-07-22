"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { saveProjectsRepo } from "@/lib/projectsRepo";
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
import {
  formatShiftTimeRange,
  getShiftKindLabel,
} from "@/lib/shiftDisplay";
import { getTemplatesForDate } from "@/lib/shiftUtils";
import {
  formatLocalDate,
  getEnrichedTasksForDate,
  getEnrichedUnscheduledTasks,
  getOverdueEnrichedTasks,
  type HomeEnrichedTask,
} from "@/lib/taskPlan";

import PageShell from "@/components/PageShell";
import SimpleDatePicker from "@/components/SimpleDatePicker";
import HomeWorkPlanSections from "@/components/HomeWorkPlanSections";

const WEEKDAY_LABELS = [
  "月",
  "火",
  "水",
  "木",
  "金",
  "土",
  "日",
] as const;

function getWeekDates(offset = 0) {
  const now = new Date();
  const currentDay = now.getDay();
  const mondayOffset =
    currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(now);
  monday.setDate(
    now.getDate() + mondayOffset + offset * 7
  );

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getMondayStart(date: Date) {
  const monday = new Date(date);
  const currentDay = monday.getDay();
  const mondayOffset =
    currentDay === 0 ? -6 : 1 - currentDay;

  monday.setDate(monday.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  return monday;
}

function getWeekOffsetForDate(
  targetDateString: string
) {
  const targetMonday = getMondayStart(
    new Date(`${targetDateString}T12:00:00`)
  );
  const todayMonday = getMondayStart(new Date());
  const diffMs =
    targetMonday.getTime() -
    todayMonday.getTime();

  return Math.round(
    diffMs / (7 * 24 * 60 * 60 * 1000)
  );
}

export default function Home() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<
    string | null
  >(null);
  const [calendarOpen, setCalendarOpen] =
    useState(false);

  const projects = useProjectsRepo();
  const memos = useMemos();
  const shifts = useShifts();
  const templates = useShiftTemplates();

  const weekDates = useMemo(
    () => getWeekDates(weekOffset),
    [weekOffset]
  );

  const todayString = formatLocalDate(new Date());
  const activeDate = selectedDay || todayString;
  const isViewingToday = activeDate === todayString;

  const activeTasks = useMemo(
    () =>
      getEnrichedTasksForDate(
        projects,
        activeDate
      ),
    [projects, activeDate]
  );

  const overdueTasks = useMemo(
    () =>
      isViewingToday
        ? getOverdueEnrichedTasks(
            projects,
            todayString
          )
        : [],
    [isViewingToday, projects, todayString]
  );

  const unscheduledTasks = useMemo(
    () => getEnrichedUnscheduledTasks(projects),
    [projects]
  );

  const undatedMemos = useMemo(
    () => memos.filter((memo) => memo.date === ""),
    [memos]
  );

  const activeDayShifts = getTemplatesForDate(
    activeDate,
    shifts,
    templates
  );

  const activeMemos = memos.filter(
    (memo) => memo.date === activeDate
  );

  const activeDeadlines = projects.filter(
    (project) => project.deadline === activeDate
  );

  const remainingCount =
    activeTasks.filter(
      (item) => !item.task.completed
    ).length +
    activeMemos.filter(
      (memo) => !memo.isCompleted
    ).length;

  const weekText = `${weekDates[0].getMonth() + 1}/${weekDates[0].getDate()}〜${weekDates[6].getMonth() + 1}/${weekDates[6].getDate()}`;

  function hasMemoOnDate(dateString: string) {
    return memos.some(
      (memo) => memo.date === dateString
    );
  }

  function getDeadlinesForDate(date: Date) {
    const target = formatLocalDate(date);
    return projects.filter(
      (project) => project.deadline === target
    );
  }

  function getDayShiftsForDate(date: Date) {
    return getTemplatesForDate(
      formatLocalDate(date),
      shifts,
      templates
    );
  }

  function getDayTasksForDate(date: Date) {
    return getEnrichedTasksForDate(
      projects,
      formatLocalDate(date)
    );
  }

  function toggleTask(
    projectId: string,
    taskId: string
  ) {
    const updatedProjects = projects.map(
      (project) => {
        if (project.id !== projectId) {
          return project;
        }

        return {
          ...project,
          tasks: project.tasks.map((task) => {
            if (task.id !== taskId) {
              return task;
            }

            return {
              ...task,
              completed: !task.completed,
            };
          }),
        };
      }
    );

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
    setWeekOffset(getWeekOffsetForDate(dateString));
  }

  function DayScheduleItems({
    date,
  }: {
    date: Date;
  }) {
    const dateString = formatLocalDate(date);
    const dayTasks = getDayTasksForDate(date);
    const dayDeadlines = getDeadlinesForDate(date);
    const dayShifts = getDayShiftsForDate(date);
    const hasMemo = hasMemoOnDate(dateString);
    const taskLimit =
      dayDeadlines.length > 0 || hasMemo ? 1 : 2;

    return (
      <>
        {(dayShifts.work ||
          dayShifts.schedule ||
          hasMemo) && (
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

            {hasMemo && (
              <span
                className="
                  rounded-md
                  px-1.5
                  py-0.5
                  text-[9px]
                  font-medium
                  border
                  border-violet-200/80
                  bg-violet-50/90
                  text-violet-600
                  dark:border-violet-900/40
                  dark:bg-violet-950/40
                  dark:text-violet-300
                "
              >
                メモ
              </span>
            )}
          </div>
        )}

        {dayDeadlines.length > 0 && (
          <div className="mb-1.5 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span className="truncate text-[9px] text-amber-700 dark:text-amber-300">
              締切
            </span>
          </div>
        )}

        <div className="space-y-1 overflow-hidden">
          {dayTasks.length === 0 &&
            !dayShifts.work &&
            !dayShifts.schedule &&
            dayDeadlines.length === 0 &&
            !hasMemo && (
              <p className="text-[10px] text-zinc-300 dark:text-zinc-500">
                予定なし
              </p>
            )}

          {dayTasks.slice(0, taskLimit).map((item) => (
            <div
              key={`${item.projectId}-${item.task.id}`}
              className={`
                flex
                items-center
                gap-1
                text-[11px]

                ${item.task.completed ? "opacity-40" : ""}
              `}
            >
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  background: item.projectColor,
                }}
              />

              <p className="truncate">
                {item.task.title}
              </p>
            </div>
          ))}
        </div>
      </>
    );
  }

  function UnscheduledTaskRow({
    item,
  }: {
    item: HomeEnrichedTask;
  }) {
    return (
      <button
        type="button"
        onClick={() =>
          toggleTask(item.projectId, item.task.id)
        }
        className={`
          ${appSurfaces.taskButton}

          ${
            item.task.completed
              ? "scale-[0.98] opacity-55"
              : "hover:scale-[1.01]"
          }
        `}
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 shrink-0 rounded-full"
                style={{
                  background: item.projectColor,
                }}
              />
              <p
                className={`
                  truncate text-sm font-medium
                  ${
                    item.task.completed
                      ? "line-through text-zinc-400 dark:text-zinc-500"
                      : appSurfaces.bodyText
                  }
                `}
              >
                {item.task.title}
              </p>
            </div>
            <p className="mt-2 pl-5 truncate text-xs text-zinc-500">
              {item.client || item.projectTitle}
            </p>
          </div>

          <div className="ml-4 pt-1">
            <div
              className={`
                flex h-6 w-6 items-center justify-center
                rounded-full border text-[11px] font-medium
                ${
                  item.task.completed
                    ? "scale-105 text-white"
                    : "bg-white text-transparent"
                }
              `}
              style={{
                background: item.task.completed
                  ? item.projectColor
                  : "white",
                borderColor: item.task.completed
                  ? item.projectColor
                  : "#d4d4d8",
              }}
            >
              ✓
            </div>
          </div>
        </div>
      </button>
    );
  }

  const topDays = weekDates.slice(0, 4);
  const bottomDays = weekDates.slice(4);

  const heroIsEmpty =
    activeMemos.length === 0 &&
    !activeDayShifts.work &&
    !activeDayShifts.schedule &&
    activeDeadlines.length === 0 &&
    activeTasks.length === 0 &&
    overdueTasks.length === 0;

  return (
    <PageShell title="ホーム">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex justify-end">
          <SimpleDatePicker
            open={calendarOpen}
            onClose={() => setCalendarOpen(false)}
            selectedDate={activeDate}
            onSelectDate={goToDate}
          >
            <button
              type="button"
              onClick={() =>
                setCalendarOpen((open) => !open)
              }
              className={`
                ${appSurfaces.glassBadge}
                transition-all
                hover:scale-[1.02]
                active:scale-[0.98]
              `}
            >
              {new Date(
                `${activeDate}T12:00:00`
              ).getMonth() + 1}
              /
              {
                new Date(
                  `${activeDate}T12:00:00`
                ).getDate()
              }
            </button>
          </SimpleDatePicker>
        </div>

        <div className={`mb-6 ${appSurfaces.heroCard}`}>
          <div className={appSurfaces.heroSheen} />

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
                  残り{remainingCount}件
                </div>

                <div
                  className={`
                    rounded-full
                    ${theme.bgSoft}
                    px-3 py-1
                    ${theme.textXs}
                  `}
                >
                  {activeTasks.length}件
                </div>
              </div>
            </div>

            {(activeDayShifts.work ||
              activeDayShifts.schedule) && (
              <div className="mb-4 flex flex-wrap gap-2">
                {activeDayShifts.work && (
                  <div
                    className={`
                      min-w-0 flex-1 rounded-2xl border
                      ${theme.border}
                      ${theme.bgSoft}
                      px-3 py-2.5
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
                      min-w-0 flex-1 rounded-2xl border
                      border-violet-300/70
                      bg-[color-mix(in_srgb,#8b5cf6_12%,transparent)]
                      px-3 py-2.5
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

            {activeDeadlines.length > 0 && (
              <div className="mb-4 space-y-2">
                {activeDeadlines.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="
                      block rounded-2xl border
                      border-amber-200/80 bg-amber-50/90
                      px-4 py-3 transition-all
                      dark:border-amber-900/50
                      dark:bg-amber-950/40
                    "
                  >
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      締切
                    </p>
                    <p
                      className={`mt-1 text-sm font-medium ${appSurfaces.bodyText}`}
                    >
                      {project.client ||
                        "依頼主なし"}
                    </p>
                    <p
                      className={`mt-0.5 text-xs ${appSurfaces.subtleText}`}
                    >
                      {project.title ||
                        "依頼内容なし"}
                    </p>
                  </Link>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {heroIsEmpty && (
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
                        ? "scale-[0.98] opacity-55"
                        : "hover:scale-[1.01]"
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
                          mt-1 text-sm font-medium transition-all
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
                          flex h-6 w-6 items-center justify-center
                          rounded-full border text-[11px] font-medium
                          transition-all duration-300
                          ${
                            memo.isCompleted
                              ? "scale-105 text-white"
                              : "bg-white text-transparent"
                          }
                        `}
                        style={{
                          background:
                            memo.isCompleted
                              ? "var(--theme-accent)"
                              : "white",
                          borderColor:
                            memo.isCompleted
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
                overdueTasks.length > 0) && (
                <HomeWorkPlanSections
                  isViewingToday={isViewingToday}
                  activeTasks={activeTasks}
                  overdueTasks={overdueTasks}
                  onToggleTask={toggleTask}
                />
              )}
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              setWeekOffset((v) => v - 1)
            }
            className={appSurfaces.roundButton}
          >
            ←
          </button>

          <p
            className={`text-sm ${appSurfaces.subtleText}`}
          >
            {weekText}
          </p>

          <button
            type="button"
            onClick={() =>
              setWeekOffset((v) => v + 1)
            }
            className={appSurfaces.roundButton}
          >
            →
          </button>
        </div>

        <div className="mb-3 grid grid-cols-4 gap-3">
          {topDays.map((date) => {
            const targetDate =
              formatLocalDate(date);
            const isToday =
              targetDate === todayString;
            const isSelected =
              targetDate === activeDate;

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() =>
                  setSelectedDay(targetDate)
                }
                className={`
                  aspect-square rounded-[28px] border p-3
                  text-left transition-all

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
                      WEEKDAY_LABELS[
                        (date.getDay() + 6) % 7
                      ]
                    }
                  </p>

                  <div className="flex items-center gap-1">
                    {isToday && (
                      <div
                        className={`h-2 w-2 rounded-full ${theme.dot}`}
                      />
                    )}
                    <p className="text-xs text-zinc-300 dark:text-zinc-500">
                      {date.getDate()}
                    </p>
                  </div>
                </div>

                <DayScheduleItems date={date} />
              </button>
            );
          })}
        </div>

        <div className="mb-8 flex justify-center gap-3">
          {bottomDays.map((date) => {
            const targetDate =
              formatLocalDate(date);
            const isToday =
              targetDate === todayString;
            const isSelected =
              targetDate === activeDate;

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() =>
                  setSelectedDay(targetDate)
                }
                className={`
                  aspect-square w-[22%] rounded-[28px]
                  border p-3 text-left transition-all

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
                      WEEKDAY_LABELS[
                        (date.getDay() + 6) % 7
                      ]
                    }
                  </p>

                  <div className="flex items-center gap-1">
                    {isToday && (
                      <div
                        className={`h-2 w-2 rounded-full ${theme.dot}`}
                      />
                    )}
                    <p className="text-xs text-zinc-300 dark:text-zinc-500">
                      {date.getDate()}
                    </p>
                  </div>
                </div>

                <DayScheduleItems date={date} />
              </button>
            );
          })}
        </div>

        <section className="mb-6">
          <div className={appSurfaces.heroCard}>
            <div className={appSurfaces.heroSheen} />

            <div className="relative z-10 flex h-72 flex-col">
              <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
                <h3
                  className={`text-sm font-medium ${appSurfaces.bodyText}`}
                >
                  日付なし作業
                </h3>
                <div className={appSurfaces.countChip}>
                  {unscheduledTasks.length}件
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
                {unscheduledTasks.length === 0 ? (
                  <div className={appSurfaces.emptyPanel}>
                    日付なしの作業はありません
                  </div>
                ) : (
                  unscheduledTasks.map((item) => (
                    <UnscheduledTaskRow
                      key={`unscheduled-${item.projectId}-${item.task.id}`}
                      item={item}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <div className={appSurfaces.heroCard}>
            <div className={appSurfaces.heroSheen} />

            <div className="relative z-10 flex h-72 flex-col">
              <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
                <h3
                  className={`text-sm font-medium ${appSurfaces.bodyText}`}
                >
                  日付なしメモ
                </h3>
                <div className={appSurfaces.countChip}>
                  {undatedMemos.length}件
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
                {undatedMemos.length === 0 ? (
                  <div className={appSurfaces.emptyPanel}>
                    日付なしのメモはありません
                  </div>
                ) : (
                  undatedMemos.map((memo) => (
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
                            ? "scale-[0.98] opacity-55"
                            : "hover:scale-[1.01]"
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
                              mt-1 text-sm font-medium
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
                              flex h-6 w-6 items-center justify-center
                              rounded-full border text-[11px] font-medium
                              ${
                                memo.isCompleted
                                  ? "scale-105 text-white"
                                  : "bg-white text-transparent"
                              }
                            `}
                            style={{
                              background:
                                memo.isCompleted
                                  ? "var(--theme-accent)"
                                  : "white",
                              borderColor:
                                memo.isCompleted
                                  ? "var(--theme-accent)"
                                  : "#d4d4d8",
                            }}
                          >
                            ✓
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
