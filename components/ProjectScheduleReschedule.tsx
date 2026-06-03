"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useOnboarding } from "@/components/onboarding/OnboardingProvider";
import HintLabel from "@/components/onboarding/HintLabel";
import { appSurfaces } from "@/lib/appSurfaces";
import type { Project } from "@/lib/storage";
import {
  registerTutorialHook,
  registerTutorialReadyCheck,
} from "@/lib/tutorialActionRegistry";
import {
  applyRescheduleToProject,
  buildReschedulePreview,
  formatLocalDate,
  formatPlanDateLabel,
  formatPlanDayGroupSequence,
  getProjectScheduleDates,
  isAddDateAllowed,
  suggestNewAddDate,
} from "@/lib/taskPlan";

type ProjectScheduleRescheduleProps = {
  project: Project;
  onApply: (project: Project) => void;
};

export default function ProjectScheduleReschedule({
  project,
  onApply,
}: ProjectScheduleRescheduleProps) {
  const {
    bumpTutorialReady,
    currentStepId,
    isTutorialActive,
  } = useOnboarding();

  const todayString = formatLocalDate(
    new Date()
  );

  const scheduleDates = useMemo(
    () =>
      getProjectScheduleDates(
        project.tasks
      ),
    [project.tasks]
  );

  const hasIncompleteDated = useMemo(
    () =>
      project.tasks.some(
        (task) =>
          !task.completed && task.date
      ),
    [project.tasks]
  );

  const defaultAddDate = useMemo(
    () =>
      suggestNewAddDate(
        project.tasks,
        todayString
      ),
    [project.tasks, todayString]
  );

  const [open, setOpen] = useState(false);
  const [removeDate, setRemoveDate] =
    useState(scheduleDates[0] ?? "");
  const [addDate, setAddDate] = useState(
    defaultAddDate
  );

  const openForTutorial = useCallback(() => {
    setOpen(true);
    requestAnimationFrame(() => {
      bumpTutorialReady();
    });
  }, [bumpTutorialReady]);

  useEffect(() => {
    return registerTutorialHook(
      "tutorial-reschedule-open",
      openForTutorial
    );
  }, [openForTutorial]);

  useEffect(() => {
    return registerTutorialReadyCheck(
      "project-schedule-reschedule-open",
      () => open
    );
  }, [open]);

  useEffect(() => {
    if (
      isTutorialActive &&
      currentStepId === "project-reschedule"
    ) {
      openForTutorial();
    }
  }, [
    currentStepId,
    isTutorialActive,
    openForTutorial,
  ]);

  useEffect(() => {
    if (
      !isAddDateAllowed(project.tasks, addDate)
    ) {
      setAddDate(defaultAddDate);
    }
  }, [addDate, defaultAddDate, project.tasks]);

  useEffect(() => {
    if (
      scheduleDates.length > 0 &&
      !scheduleDates.includes(removeDate)
    ) {
      setRemoveDate(scheduleDates[0]);
    }
  }, [removeDate, scheduleDates]);

  const taskDates = useMemo(
    () =>
      project.tasks.map(
        (task) => task.date
      ),
    [project.tasks]
  );

  const previewResult = useMemo(
    () =>
      buildReschedulePreview(
        project.tasks,
        removeDate,
        addDate
      ),
    [addDate, project.tasks, removeDate]
  );

  const addDateInvalid = !isAddDateAllowed(
    project.tasks,
    addDate
  );

  const changedCount =
    previewResult.rows.filter(
      (row) => row.changed
    ).length;

  if (
    scheduleDates.length === 0 ||
    !hasIncompleteDated
  ) {
    return null;
  }

  function handleApply() {
    if (
      !previewResult.validation.ok ||
      changedCount === 0
    ) {
      return;
    }

    onApply(
      applyRescheduleToProject(
        project,
        previewResult.rows
      )
    );
    setOpen(false);
  }

  return (
    <HintLabel hintId="project-schedule-reschedule">
      <div
        data-tour="project-schedule-reschedule-panel"
        className={`
          mb-4
          rounded-2xl
          border
          border-zinc-200/80
          bg-white/55
          px-3
          py-3
          dark:border-zinc-700/60
          dark:bg-zinc-900/45
        `}
      >
        <button
          type="button"
          data-tour="project-schedule-reschedule"
          onClick={() =>
            setOpen((value) => !value)
          }
          className="
            flex
            w-full
            items-center
            justify-between
            gap-2
            text-left
          "
        >
          <span className="text-sm font-medium">
            日程を組み直す
          </span>

          <span
            className={`shrink-0 text-xs ${appSurfaces.subtleText}`}
          >
            {open ? "閉じる" : "開く"}
          </span>
        </button>

        {open && (
          <div className="mt-3 space-y-3">
            <ol
              className={`list-decimal space-y-1 pl-4 text-[11px] leading-relaxed ${appSurfaces.subtleText}`}
            >
              <li>外す日を選ぶ</li>
              <li>足す日を選ぶ（未使用の日だけ）</li>
            </ol>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="min-w-0">
                <span
                  className={`mb-1 block text-[11px] font-medium ${appSurfaces.bodyText}`}
                >
                  1. 外す日
                </span>

                <select
                  value={removeDate}
                  onChange={(event) =>
                    setRemoveDate(
                      event.target.value
                    )
                  }
                  className={`
                    box-border
                    w-full
                    min-w-0
                    px-3
                    py-2.5
                    text-sm
                    ${appSurfaces.input}
                  `}
                >
                  {scheduleDates.map((date) => (
                    <option
                      key={date}
                      value={date}
                    >
                      {formatPlanDateLabel(
                        date,
                        todayString
                      )}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0">
                <span
                  className={`mb-1 block text-[11px] font-medium ${appSurfaces.bodyText}`}
                >
                  2. 足す日
                </span>

                <input
                  type="date"
                  value={addDate}
                  onChange={(event) =>
                    setAddDate(
                      event.target.value
                    )
                  }
                  className={`
                    box-border
                    w-full
                    min-w-0
                    px-3
                    py-2.5
                    text-sm
                    ${appSurfaces.input}
                  `}
                />
              </label>
            </div>

            {addDateInvalid && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                足す日は、まだ案件で使っていない日を選んでください。
              </p>
            )}

            {!previewResult.validation.ok &&
              !addDateInvalid && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  {
                    previewResult.validation
                      .reason
                  }
                </p>
              )}

            {previewResult.validation.ok &&
              previewResult.nextTimelineLabel && (
                <>
                  <div
                    className="
                      rounded-xl
                      border
                      border-zinc-200/70
                      px-2.5
                      py-2
                      text-[11px]
                      dark:border-zinc-700/50
                    "
                  >
                    <p
                      className={
                        appSurfaces.subtleText
                      }
                    >
                      {formatPlanDayGroupSequence(
                        taskDates
                      )}
                    </p>

                    <p className="my-1 text-zinc-300 dark:text-zinc-600">
                      ↓
                    </p>

                    <p className="font-medium text-[var(--theme-accent)]">
                      {
                        previewResult.nextTimelineLabel
                      }
                    </p>
                  </div>

                  <ul
                    className="
                      max-h-28
                      space-y-1
                      overflow-y-auto
                      text-[11px]
                    "
                  >
                    {previewResult.rows.map(
                      (row, index) => (
                        <li
                          key={row.taskId}
                          className="
                            flex
                            justify-between
                            gap-2
                          "
                        >
                          <span className="min-w-0 truncate">
                            {index + 1}.{" "}
                            {row.title}
                          </span>

                          <span
                            className={`shrink-0 tabular-nums ${
                              row.changed
                                ? "font-medium text-[var(--theme-accent)]"
                                : appSurfaces.subtleText
                            }`}
                          >
                            {row.skipped
                              ? row.completed
                                ? "完了のまま"
                                : "予定なし"
                              : formatPlanDateLabel(
                                  row.nextDate,
                                  todayString
                                )}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </>
              )}

            <button
              type="button"
              disabled={
                !previewResult.validation.ok ||
                addDateInvalid ||
                changedCount === 0
              }
              onClick={handleApply}
              className={`
                w-full
                rounded-full
                py-2.5
                text-sm
                font-medium

                ${
                  !previewResult.validation.ok ||
                  addDateInvalid ||
                  changedCount === 0
                    ? "cursor-not-allowed opacity-40"
                    : "bg-[var(--theme-accent)] text-white"
                }
              `}
            >
              {changedCount > 0
                ? `未完了 ${changedCount}件を反映`
                : "反映"}
            </button>
          </div>
        )}
      </div>
    </HintLabel>
  );
}
