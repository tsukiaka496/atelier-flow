"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  saveShiftTemplates,
  saveShifts,
  Shift,
  ShiftTemplate,
} from "@/lib/storage";

import ThemedMain from "@/components/ThemedMain";
import BottomNav from "@/components/BottomNav";
import HintLabel from "@/components/onboarding/HintLabel";
import { useOnboarding } from "@/components/onboarding/OnboardingProvider";
import {
  registerTutorialHook,
  registerTutorialReadyCheck,
} from "@/lib/tutorialActionRegistry";
import { isTutorialSessionActive } from "@/lib/tutorialSession";
import {
  createTutorialShiftTemplate,
  hasTutorialShiftTemplate,
  TUTORIAL_SHIFT_TEMPLATE_ID,
} from "@/lib/tutorialShiftTemplate";
import { theme } from "@/lib/themeClasses";
import { appSurfaces } from "@/lib/appSurfaces";
import { useTourAction } from "@/lib/useTourAction";
import {
  useShifts,
  useShiftTemplates,
} from "@/lib/useShiftData";
import {
  tourInstanceProps,
  useTourInstanceId,
} from "@/lib/useTourInstanceId";

function formatDate(date: Date) {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthDates(
  year: number,
  month: number
) {
  const firstDay = new Date(
    year,
    month,
    1
  );

  const lastDay = new Date(
    year,
    month + 1,
    0
  );

  const startDay =
    firstDay.getDay();

  const dates: Date[] = [];

  for (
    let i = 0;
    i < startDay;
    i++
  ) {
    dates.push(new Date(""));
  }

  for (
    let day = 1;
    day <= lastDay.getDate();
    day++
  ) {
    dates.push(
      new Date(year, month, day)
    );
  }

  return dates;
}

export default function MonthPage() {
  const { bumpTutorialReady } = useOnboarding();
  const triggerEditToggle = useTourAction("month-edit-toggle");
  const triggerCalendarDay = useTourAction("month-calendar-day");
  const editToggleInstance = useTourInstanceId(
    "month-edit-toggle"
  );
  const templateAddInstance = useTourInstanceId(
    "month-template-add"
  );

  const today = new Date();

  const [currentDate, setCurrentDate] =
    useState(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );

  const templates = useShiftTemplates();
  const shifts = useShifts();

  const [name, setName] =
    useState("");

  const [start, setStart] =
    useState("");

  const [end, setEnd] =
    useState("");

  const [editMode, setEditMode] =
    useState(false);

  const [selectedTemplateId, setSelectedTemplateId] =
    useState("");

  const activeTemplateId =
    selectedTemplateId ||
    templates[0]?.id ||
    "";

  const dates = useMemo(
    () =>
      getMonthDates(
        currentDate.getFullYear(),
        currentDate.getMonth()
      ),
    [currentDate]
  );

  useEffect(() => {
    return registerTutorialReadyCheck(
      "month-edit-mode-on",
      () => editMode
    );
  }, [editMode]);

  useEffect(() => {
    return registerTutorialReadyCheck(
      "month-template-added",
      () => {
        if (hasTutorialShiftTemplate(templates)) {
          return true;
        }

        if (
          isTutorialSessionActive() &&
          templates.length > 0
        ) {
          return true;
        }

        return false;
      }
    );
  }, [templates]);

  useEffect(() => {
    return registerTutorialHook(
      "month-template-prepare",
      () => {
        setName("仕事");
        setStart("10:00");
        setEnd("18:00");
      }
    );
  }, []);

  useEffect(() => {
    bumpTutorialReady();
  }, [editMode, templates, bumpTutorialReady]);

  function addTutorialShiftTemplate() {
    if (hasTutorialShiftTemplate(templates)) {
      setSelectedTemplateId(
        TUTORIAL_SHIFT_TEMPLATE_ID
      );
      requestAnimationFrame(() => {
        bumpTutorialReady();
      });
      return;
    }

    const sample = createTutorialShiftTemplate();
    const updatedTemplates = [
      ...templates,
      sample,
    ];

    saveShiftTemplates(updatedTemplates);
    setSelectedTemplateId(sample.id);
    setName("");
    setStart("");
    setEnd("");
    requestAnimationFrame(() => {
      bumpTutorialReady();
    });
  }

  function addTemplateFromForm() {
    if (!name || !start || !end) {
      return;
    }

    const newTemplate: ShiftTemplate = {
      id: crypto.randomUUID(),
      name,
      start,
      end,
    };

    const updatedTemplates = [
      ...templates,
      newTemplate,
    ];

    saveShiftTemplates(updatedTemplates);
    setSelectedTemplateId(newTemplate.id);
    setName("");
    setStart("");
    setEnd("");
    requestAnimationFrame(() => {
      bumpTutorialReady();
    });
  }

  const handleAddTemplate = useTourAction(
    "month-template-add",
    () => {
      if (name && start && end) {
        addTemplateFromForm();
        return;
      }

      addTutorialShiftTemplate();
    }
  );

  function deleteTemplate(
    templateId: string
  ) {
    const target =
      templates.find(
        (template) =>
          template.id ===
          templateId
      );

    if (!target) {
      return;
    }

    const confirmed =
      window.confirm(
        `「${target.name}」を削除しますか？`
      );

    if (!confirmed) {
      return;
    }

    const updatedTemplates =
      templates.filter(
        (template) =>
          template.id !==
          templateId
      );

    const updatedShifts =
      shifts.filter(
        (shift) =>
          shift.templateId !==
          templateId
      );

    saveShiftTemplates(
      updatedTemplates
    );

    saveShifts(updatedShifts);

    if (
      activeTemplateId ===
      templateId
    ) {
      setSelectedTemplateId(
        updatedTemplates[0]?.id ||
          ""
      );
    }
  }

  function toggleShift(
    date: string
  ) {
    if (
      !activeTemplateId
    ) {
      return;
    }

    if (!editMode) {
      return;
    }

    const existingShift =
      shifts.find(
        (shift) =>
          shift.date === date
      );

    let updatedShifts: Shift[] =
      [];

    if (existingShift) {
      updatedShifts =
        shifts.filter(
          (shift) =>
            shift.date !== date
        );
    } else {
      updatedShifts = [
        ...shifts,
        {
          date,
          templateId:
            activeTemplateId,
        },
      ];
    }

    saveShifts(updatedShifts);
  }

  function getShift(
    date: string
  ) {
    return shifts.find(
      (shift) =>
        shift.date === date
    );
  }

  function getTemplate(
    templateId: string
  ) {
    return templates.find(
      (template) =>
        template.id ===
        templateId
    );
  }

  function previousMonth() {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      )
    );
  }

  function nextMonth() {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      )
    );
  }

  const currentMonthText = `${currentDate.getFullYear()}年 ${
    currentDate.getMonth() + 1
  }月`;

  const todayString =
    formatDate(today);

  return (
    <ThemedMain className="px-5 py-6 pb-32">
      <div className="mx-auto max-w-md">

        {/* タイトル */}
        <div className="mb-6">

          <p className={appSurfaces.mutedLabel}>
            work schedule
          </p>

          <h1 className={`mt-1 ${appSurfaces.pageTitle}`}>
            月表示
          </h1>

        </div>

        {/* 月移動 */}
        <div className="mb-5 flex items-center justify-between">

          <button
            onClick={
              previousMonth
            }
            className={appSurfaces.roundButtonMd}
          >
            ←
          </button>

          <p className={`text-lg font-semibold ${appSurfaces.bodyText}`}>
            {currentMonthText}
          </p>

          <button
            onClick={nextMonth}
            className={appSurfaces.roundButtonMd}
          >
            →
          </button>

        </div>

        <div className="h-2" />

        {/* 曜日 */}
        <div className="mb-2 grid grid-cols-7 gap-2">

          {[
            "日",
            "月",
            "火",
            "水",
            "木",
            "金",
            "土",
          ].map((day) => (

            <div
              key={day}
              className="
                text-center
                text-xs
                text-zinc-400
              "
            >
              {day}
            </div>

          ))}

        </div>

        {/* カレンダー */}
        <HintLabel hintId="month-calendar">
        <div
          className="mb-6 grid grid-cols-7 gap-2"
          data-tour="month-calendar"
        >

          {dates.map(
            (date, index) => {

              if (
                isNaN(
                  date.getTime()
                )
              ) {
                return (
                  <div
                    key={index}
                  />
                );
              }

              const dateString =
                formatDate(date);

              const shift =
                getShift(
                  dateString
                );

              const template =
                shift
                  ? getTemplate(
                      shift.templateId
                    )
                  : null;

              const isToday =
                dateString ===
                todayString;

              return (

                <button
                  key={dateString}
                  data-tour-day={dateString}
                  data-tour-instance-id={`month-day-${dateString}`}
                  onClick={() => {
                    toggleShift(dateString);

                    if (editMode) {
                      triggerCalendarDay();
                    }
                  }}
                  className={`
                    aspect-square
                    rounded-[22px]
                    border
                    p-2
                    text-left
                    transition-all

                    ${
                      shift
                        ? `
                          ${theme.border}
                          ${theme.bgSoft}
                        `
                        : appSurfaces.monthDayIdle
                    }

                    ${
                      isToday
                        ? theme.ring
                        : ""
                    }

                    ${
                      editMode
                        ? `
                          active:scale-95
                        `
                        : `
                          cursor-default
                        `
                    }
                  `}
                >

                  <p
                    className={`
                      text-xs

                      ${
                        isToday
                          ? `font-bold ${theme.text}`
                          : "text-zinc-400"
                      }
                    `}
                  >
                    {date.getDate()}
                  </p>

                  {template && (

                    <div className="mt-2">

                      <p className="text-[10px] text-zinc-700 dark:text-zinc-300">
                        仕事
                      </p>

                      <p className="mt-1 text-[9px] text-zinc-400">
                        {template.start}
                        〜
                        {template.end}
                      </p>

                    </div>

                  )}

                </button>

              );
            }
          )}

        </div>
        </HintLabel>

        {/* テンプレ */}
        <div
          className={`mb-5 p-4 ${appSurfaces.cardSm}`}
        >

          <div className="mb-3 flex items-center justify-between">

            <p className="text-sm text-zinc-400">
              シフトテンプレ
            </p>

            <button
              type="button"
              {...tourInstanceProps(
                "month-template-add",
                templateAddInstance
              )}
              onClick={handleAddTemplate}
              className={`
                rounded-full
                ${theme.bgSoft}
                px-3
                py-1.5
                ${theme.textXs}
              `}
            >
              追加
            </button>

          </div>

          <div className="space-y-3">

            <input
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              placeholder="例: 夕勤"
              className={appSurfaces.input}
            />

            <div className="flex gap-3">

              <input
                type="time"
                value={start}
                onChange={(e) =>
                  setStart(
                    e.target.value
                  )
                }
                className={`flex-1 px-4 py-3 text-sm ${appSurfaces.input}`}
              />

              <input
                type="time"
                value={end}
                onChange={(e) =>
                  setEnd(
                    e.target.value
                  )
                }
                className={`flex-1 px-4 py-3 text-sm ${appSurfaces.input}`}
              />

            </div>

          </div>

        </div>

        {/* テンプレ一覧 */}
        <div className="mb-6 flex gap-3 overflow-x-auto pb-2">

          {templates.map(
            (template) => (

              <div
                key={template.id}
                className={`
                  shrink-0
                  rounded-2xl
                  border
                  px-4
                  py-3
                  transition-all

                  ${
                    activeTemplateId ===
                    template.id
                      ? `
                        ${theme.border}
                        ${theme.bgSoft}
                      `
                      : appSurfaces.panelIdle
                  }
                `}
              >

                <button
                  onClick={() =>
                    setSelectedTemplateId(
                      template.id
                    )
                  }
                  className="text-left"
                >

                  <p className="text-sm font-medium">
                    {template.name}
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">
                    {template.start}
                    〜
                    {template.end}
                  </p>

                </button>

                <button
                  onClick={() =>
                    deleteTemplate(
                      template.id
                    )
                  }
                  className="
                    mt-3
                    rounded-full
                    bg-red-50
                    px-3
                    py-1
                    text-[10px]
                    text-red-400
                  "
                >
                  削除
                </button>

              </div>

            )
          )}

        </div>

      </div>

      <BottomNav />

      {/* 編集トグル（片手操作向け） */}
      <div
        className="
          pointer-events-none
          fixed
          bottom-[92px]
          left-1/2
          z-40
          w-[92%]
          max-w-md
          -translate-x-1/2
        "
      >
        <div className="pointer-events-auto flex justify-end">
          <button
            type="button"
            {...tourInstanceProps(
              "month-edit-toggle",
              editToggleInstance
            )}
            onClick={() => {
              const next = !editMode;
              setEditMode(next);

              if (next) {
                triggerEditToggle();
              }
            }}
            className={`
              rounded-full
              px-5
              py-3
              text-sm
              shadow-[0_10px_30px_rgba(0,0,0,0.16)]
              transition-all

              ${
                editMode
                  ? `${theme.btnSolid}`
                  : `${appSurfaces.editToggleIdle}`
              }
            `}
          >
            {editMode ? "編集ON" : "編集する"}
          </button>
        </div>
      </div>

    </ThemedMain>
  );
}