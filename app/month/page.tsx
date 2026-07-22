"use client";

import {
  useMemo,
  useState,
} from "react";

import PageShell from "@/components/PageShell";
import MonthDayShiftBadges from "@/components/MonthDayShiftBadges";
import { appSurfaces } from "@/lib/appSurfaces";
import {
  formatShiftTimeRange,
  getShiftKindLabel,
  getShiftTemplateKind,
} from "@/lib/shiftDisplay";
import {
  getTemplatesForDate,
  shiftMatchesKind,
} from "@/lib/shiftUtils";
import {
  saveShiftTemplates,
  saveShifts,
  type Shift,
  type ShiftTemplate,
  type ShiftTemplateKind,
} from "@/lib/storage";
import { theme } from "@/lib/themeClasses";
import {
  useShifts,
  useShiftTemplates,
} from "@/lib/useShiftData";
import { useThemeSettings } from "@/lib/useThemeSettings";

const WEEKDAYS = [
  "日",
  "月",
  "火",
  "水",
  "木",
  "金",
  "土",
] as const;

const DEFAULT_WORK_NAME = "仕事";

const HOUR_OPTIONS = Array.from(
  { length: 24 },
  (_, hour) => hour
);

const QUARTER_MINUTE_OPTIONS = [
  0, 15, 30, 45,
] as const;

function parseTimeParts(value: string): {
  hour: number | null;
  minute: number | null;
} {
  if (!value) {
    return { hour: null, minute: null };
  }

  const [hourText, minuteText] =
    value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return { hour: null, minute: null };
  }

  const snappedMinute =
    QUARTER_MINUTE_OPTIONS.reduce(
      (best, option) =>
        Math.abs(option - minute) <
        Math.abs(best - minute)
          ? option
          : best,
      QUARTER_MINUTE_OPTIONS[0]
    );

  return {
    hour: Math.max(0, Math.min(23, hour)),
    minute: snappedMinute,
  };
}

function formatTimeParts(
  hour: number | null,
  minute: number | null
) {
  if (hour === null || minute === null) {
    return "";
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
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

function getMonthDates(
  year: number,
  month: number
) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(
    year,
    month + 1,
    0
  );
  const startDay = firstDay.getDay();
  const dates: Date[] = [];

  for (let i = 0; i < startDay; i++) {
    dates.push(new Date(""));
  }

  for (
    let day = 1;
    day <= lastDay.getDate();
    day++
  ) {
    dates.push(new Date(year, month, day));
  }

  return dates;
}

function findMatchingTemplate(
  templates: ShiftTemplate[],
  name: string,
  start: string,
  end: string,
  kind: ShiftTemplateKind
) {
  return templates.find(
    (template) =>
      template.name === name &&
      template.start === start &&
      template.end === end &&
      getShiftTemplateKind(template) === kind
  );
}

function findDefaultWorkTemplate(
  templates: ShiftTemplate[]
) {
  return (
    findMatchingTemplate(
      templates,
      DEFAULT_WORK_NAME,
      "",
      "",
      "work"
    ) ??
    templates.find(
      (template) =>
        getShiftTemplateKind(template) ===
          "work" &&
        template.name === DEFAULT_WORK_NAME
    )
  );
}

type DaySheetMode = "list" | "form";

export default function MonthPage() {
  const themeSettings = useThemeSettings();
  const templates = useShiftTemplates();
  const shifts = useShifts();

  const monthDisplayMode =
    themeSettings.monthDisplayMode ??
    "detailed";
  const isSimple = monthDisplayMode === "simple";

  const today = new Date();
  const todayString = formatDate(today);

  const [currentDate, setCurrentDate] =
    useState(
      () =>
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        )
    );

  const [selectedDate, setSelectedDate] =
    useState<string | null>(null);

  const [sheetMode, setSheetMode] =
    useState<DaySheetMode>("list");

  const [formKind, setFormKind] =
    useState<ShiftTemplateKind>("work");

  const [formName, setFormName] =
    useState("");

  const [formStart, setFormStart] =
    useState("");

  const [formEnd, setFormEnd] =
    useState("");

  const [editingKind, setEditingKind] =
    useState<ShiftTemplateKind | null>(
      null
    );

  const dates = useMemo(
    () =>
      getMonthDates(
        currentDate.getFullYear(),
        currentDate.getMonth()
      ),
    [currentDate]
  );

  const selectedDayShifts = useMemo(() => {
    if (!selectedDate) {
      return { work: null, schedule: null };
    }

    return getTemplatesForDate(
      selectedDate,
      shifts,
      templates
    );
  }, [selectedDate, shifts, templates]);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) {
      return "";
    }

    const [y, m, d] = selectedDate
      .split("-")
      .map(Number);

    return `${y}年${m}月${d}日`;
  }, [selectedDate]);

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

  function openDay(dateString: string) {
    setSelectedDate(dateString);
    setSheetMode("list");
    setEditingKind(null);
    setFormKind("work");
    setFormName("");
    setFormStart("");
    setFormEnd("");
  }

  function closeSheet() {
    setSelectedDate(null);
    setSheetMode("list");
    setEditingKind(null);
  }

  function ensureTemplate(
    name: string,
    start: string,
    end: string,
    kind: ShiftTemplateKind,
    currentTemplates: ShiftTemplate[]
  ): {
    template: ShiftTemplate;
    nextTemplates: ShiftTemplate[];
  } {
    const existing = findMatchingTemplate(
      currentTemplates,
      name,
      start,
      end,
      kind
    );

    if (existing) {
      return {
        template: existing,
        nextTemplates: currentTemplates,
      };
    }

    const template: ShiftTemplate = {
      id: crypto.randomUUID(),
      name,
      start,
      end,
      kind,
    };

    return {
      template,
      nextTemplates: [
        ...currentTemplates,
        template,
      ],
    };
  }

  function assignShiftToDate(
    date: string,
    template: ShiftTemplate,
    kind: ShiftTemplateKind,
    currentShifts: Shift[],
    templateList: ShiftTemplate[] = templates
  ) {
    const withoutKind = currentShifts.filter(
      (shift) =>
        !(
          shift.date === date &&
          shiftMatchesKind(
            shift,
            kind,
            templateList
          )
        )
    );

    return [
      ...withoutKind,
      {
        date,
        templateId: template.id,
        kind,
      },
    ];
  }

  function removeKindFromDate(
    date: string,
    kind: ShiftTemplateKind,
    templateList: ShiftTemplate[] = templates
  ) {
    const updated = shifts.filter(
      (shift) =>
        !(
          shift.date === date &&
          shiftMatchesKind(
            shift,
            kind,
            templateList
          )
        )
    );

    saveShifts(updated);
  }

  function setSimpleWorkPresence(
    date: string,
    hasWork: boolean
  ) {
    const day = getTemplatesForDate(
      date,
      shifts,
      templates
    );

    if (hasWork) {
      if (day.work) {
        return;
      }

      let nextTemplates = templates;
      let workTemplate =
        findDefaultWorkTemplate(templates);

      if (!workTemplate) {
        workTemplate = {
          id: crypto.randomUUID(),
          name: DEFAULT_WORK_NAME,
          start: "",
          end: "",
          kind: "work",
        };
        nextTemplates = [
          ...templates,
          workTemplate,
        ];
        saveShiftTemplates(nextTemplates);
      }

      const updatedShifts = assignShiftToDate(
        date,
        workTemplate,
        "work",
        shifts,
        nextTemplates
      );
      saveShifts(updatedShifts);
      closeSheet();
      return;
    }

    removeKindFromDate(date, "work");
    closeSheet();
  }

  function openAddForm(
    kind: ShiftTemplateKind = "work"
  ) {
    setEditingKind(null);
    setFormKind(kind);
    setFormName("");
    setFormStart("");
    setFormEnd("");
    setSheetMode("form");
  }

  function openEditForm(
    kind: ShiftTemplateKind
  ) {
    const template =
      kind === "work"
        ? selectedDayShifts.work
        : selectedDayShifts.schedule;

    if (!template) {
      return;
    }

    const startParts = parseTimeParts(
      template.start
    );
    const endParts = parseTimeParts(
      template.end
    );

    setEditingKind(kind);
    setFormKind(kind);
    setFormName(template.name);
    setFormStart(
      formatTimeParts(
        startParts.hour,
        startParts.minute
      )
    );
    setFormEnd(
      formatTimeParts(
        endParts.hour,
        endParts.minute
      )
    );
    setSheetMode("form");
  }

  function saveDayForm() {
    if (!selectedDate) {
      return;
    }

    const trimmedName = formName.trim();

    if (!trimmedName) {
      window.alert("名前を入力してください");
      return;
    }

    const start = formStart;
    const end = formEnd;

    if ((start && !end) || (!start && end)) {
      window.alert(
        "開始と終了はセットで入力するか、両方空欄にしてください"
      );
      return;
    }

    if (start && end && start >= end) {
      window.alert(
        "終了は開始より後の時刻にしてください"
      );
      return;
    }

    const {
      template,
      nextTemplates,
    } = ensureTemplate(
      trimmedName,
      start,
      end,
      formKind,
      templates
    );

    if (nextTemplates !== templates) {
      saveShiftTemplates(nextTemplates);
    }

    const baseShifts =
      editingKind &&
      editingKind !== formKind
        ? shifts.filter(
            (shift) =>
              !(
                shift.date ===
                  selectedDate &&
                shiftMatchesKind(
                  shift,
                  editingKind,
                  nextTemplates
                )
              )
          )
        : shifts;

    const updatedShifts = assignShiftToDate(
      selectedDate,
      template,
      formKind,
      baseShifts,
      nextTemplates
    );

    saveShifts(updatedShifts);
    closeSheet();
  }

  function pickExistingTemplate(
    template: ShiftTemplate
  ) {
    if (!selectedDate) {
      return;
    }

    const kind = getShiftTemplateKind(
      template
    );
    const updatedShifts = assignShiftToDate(
      selectedDate,
      template,
      kind,
      shifts
    );

    saveShifts(updatedShifts);
    closeSheet();
  }

  function deleteDayKind(
    kind: ShiftTemplateKind
  ) {
    if (!selectedDate) {
      return;
    }

    removeKindFromDate(selectedDate, kind);
    closeSheet();
  }

  const currentMonthText = `${currentDate.getFullYear()}年 ${
    currentDate.getMonth() + 1
  }月`;

  const templateUsage = useMemo(() => {
    const counts = new Map<string, number>();
    const latestDate = new Map<string, string>();

    for (const shift of shifts) {
      counts.set(
        shift.templateId,
        (counts.get(shift.templateId) ?? 0) + 1
      );

      const previous = latestDate.get(
        shift.templateId
      );

      if (
        !previous ||
        shift.date > previous
      ) {
        latestDate.set(
          shift.templateId,
          shift.date
        );
      }
    }

    return { counts, latestDate };
  }, [shifts]);

  function sortHistoryTemplates(
    list: ShiftTemplate[]
  ) {
    return [...list].sort((a, b) => {
      const usageDiff =
        (templateUsage.counts.get(b.id) ?? 0) -
        (templateUsage.counts.get(a.id) ?? 0);

      if (usageDiff !== 0) {
        return usageDiff;
      }

      const dateA =
        templateUsage.latestDate.get(a.id) ??
        "";
      const dateB =
        templateUsage.latestDate.get(b.id) ??
        "";

      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }

      return a.name.localeCompare(b.name, "ja");
    });
  }

  const historyTemplates = useMemo(() => {
    if (isSimple) {
      return [] as ShiftTemplate[];
    }

    return sortHistoryTemplates(templates);
  }, [templates, isSimple, templateUsage]);

  const formHistoryTemplates = useMemo(() => {
    return historyTemplates.filter(
      (template) =>
        getShiftTemplateKind(template) ===
        formKind
    );
  }, [historyTemplates, formKind]);

  const workHistoryTemplates = useMemo(
    () =>
      historyTemplates.filter(
        (template) =>
          getShiftTemplateKind(template) ===
          "work"
      ),
    [historyTemplates]
  );

  const scheduleHistoryTemplates = useMemo(
    () =>
      historyTemplates.filter(
        (template) =>
          getShiftTemplateKind(template) ===
          "schedule"
      ),
    [historyTemplates]
  );

  const hasSelectedWork = Boolean(
    selectedDayShifts.work
  );

  function renderHistoryPicker(
    list: ShiftTemplate[],
    emptyHint?: string
  ) {
    if (list.length === 0) {
      if (!emptyHint) {
        return null;
      }

      return (
        <p
          className={`text-xs ${appSurfaces.subtleText}`}
        >
          {emptyHint}
        </p>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        {list.map((template) => {
          const usage =
            templateUsage.counts.get(
              template.id
            ) ?? 0;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() =>
                pickExistingTemplate(template)
              }
              className={`
                flex
                w-full
                items-center
                justify-between
                gap-3
                rounded-2xl
                border
                px-3
                py-3
                text-left
                ${appSurfaces.panelIdle}
              `}
            >
              <div className="min-w-0">
                <p
                  className={`truncate text-sm font-medium ${appSurfaces.bodyText}`}
                >
                  {template.name}
                </p>
                <p className="mt-0.5 text-[10px] text-zinc-400">
                  {getShiftKindLabel(template)}
                  {" · "}
                  {formatShiftTimeRange(
                    template
                  )}
                  {usage > 0
                    ? ` · ${usage}回`
                    : ""}
                </p>
              </div>
              <span
                className={`
                  shrink-0
                  rounded-full
                  px-2.5
                  py-1
                  text-[11px]
                  ${theme.bgSoft}
                  ${theme.textXs}
                `}
              >
                使う
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <PageShell title="月">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={previousMonth}
            className={appSurfaces.roundButtonMd}
            aria-label="前の月"
          >
            ←
          </button>

          <p
            className={`text-lg font-semibold ${appSurfaces.bodyText}`}
          >
            {currentMonthText}
          </p>

          <button
            type="button"
            onClick={nextMonth}
            className={appSurfaces.roundButtonMd}
            aria-label="次の月"
          >
            →
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-2">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs text-zinc-400"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="mb-4 grid grid-cols-7 gap-2">
          {dates.map((date, index) => {
            if (isNaN(date.getTime())) {
              return <div key={index} />;
            }

            const dateString = formatDate(date);
            const dayShifts =
              getTemplatesForDate(
                dateString,
                shifts,
                templates
              );
            const hasWork = Boolean(
              dayShifts.work
            );
            const hasSchedule = Boolean(
              dayShifts.schedule
            );
            const isToday =
              dateString === todayString;
            const isSelected =
              selectedDate === dateString;

            const cellTone = isSimple
              ? hasWork
                ? appSurfaces.monthDayShiftWork
                : appSurfaces.monthDayIdle
              : hasWork && hasSchedule
                ? `
                    border-[var(--theme-accent-border)]
                    bg-[linear-gradient(135deg,color-mix(in_srgb,var(--theme-accent)_12%,transparent)_0%,color-mix(in_srgb,#8b5cf6_12%,transparent)_100%)]
                  `
                : hasSchedule
                  ? appSurfaces.monthDayShiftSchedule
                  : hasWork
                    ? appSurfaces.monthDayShiftWork
                    : appSurfaces.monthDayIdle;

            return (
              <button
                key={dateString}
                type="button"
                onClick={() =>
                  openDay(dateString)
                }
                className={`
                  aspect-square
                  rounded-[22px]
                  border
                  p-1.5
                  text-left
                  transition-all
                  active:scale-95
                  ${cellTone}
                  ${isToday ? appSurfaces.monthDayToday : ""}
                  ${
                    isSelected
                      ? "ring-2 ring-[var(--theme-accent-border)]"
                      : ""
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

                {isSimple ? (
                  hasWork ? (
                    <div className="mt-1.5 flex flex-col items-center gap-1">
                      <span
                        className={`
                          h-1.5
                          w-1.5
                          rounded-full
                          ${theme.dot}
                        `}
                      />
                      <span
                        className={`
                          text-[8px]
                          font-medium
                          leading-none
                          ${theme.text}
                        `}
                      >
                        仕事
                      </span>
                    </div>
                  ) : null
                ) : (
                  <MonthDayShiftBadges
                    work={dayShifts.work}
                    schedule={dayShifts.schedule}
                    compact
                  />
                )}
              </button>
            );
          })}
        </div>

        <p
          className={`text-center text-xs ${appSurfaces.subtleText}`}
        >
          {isSimple
            ? "日付をタップして、仕事の有無を切り替え"
            : "日付をタップして、その日の仕事・予定を編集"}
        </p>
      </div>

      {selectedDate ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeSheet}
          />

          <div className="absolute bottom-0 left-0 right-0 mx-auto max-h-[88vh] w-full max-w-md overflow-y-auto px-5 pb-6">
            <div
              className="
                rounded-[28px]
                border border-white/70
                bg-white/70
                p-5
                shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_16px_48px_rgba(120,90,110,0.18)]
                backdrop-blur-2xl
                dark:border-white/10
                dark:bg-zinc-900/75
              "
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p
                    className={
                      appSurfaces.mutedLabel
                    }
                  >
                    {isSimple
                      ? "簡易編集"
                      : "その日の予定"}
                  </p>
                  <p
                    className={`mt-1 text-lg font-semibold ${appSurfaces.bodyText}`}
                  >
                    {selectedDateLabel}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeSheet}
                  className="
                    rounded-full
                    bg-zinc-100
                    px-3
                    py-1.5
                    text-xs
                    text-zinc-500
                    dark:bg-zinc-800
                    dark:text-zinc-300
                  "
                >
                  閉じる
                </button>
              </div>

              {isSimple ? (
                <div className="space-y-3">
                  <p
                    className={`text-sm ${appSurfaces.subtleText}`}
                  >
                    この日に仕事があるかどうかを選べます
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSimpleWorkPresence(
                          selectedDate,
                          true
                        )
                      }
                      className={`
                        rounded-2xl
                        border
                        px-4
                        py-4
                        text-sm
                        font-medium
                        transition-all
                        ${
                          hasSelectedWork
                            ? `
                              border-[var(--theme-accent-border)]
                              bg-[var(--theme-accent-soft)]
                              text-[var(--theme-accent)]
                            `
                            : `
                              border-zinc-200
                              bg-white
                              text-zinc-600
                              dark:border-zinc-700
                              dark:bg-zinc-900
                              dark:text-zinc-300
                            `
                        }
                      `}
                    >
                      仕事あり
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSimpleWorkPresence(
                          selectedDate,
                          false
                        )
                      }
                      className={`
                        rounded-2xl
                        border
                        px-4
                        py-4
                        text-sm
                        font-medium
                        transition-all
                        ${
                          !hasSelectedWork
                            ? `
                              border-zinc-300
                              bg-zinc-100
                              text-zinc-700
                              dark:border-zinc-600
                              dark:bg-zinc-800
                              dark:text-zinc-200
                            `
                            : `
                              border-zinc-200
                              bg-white
                              text-zinc-600
                              dark:border-zinc-700
                              dark:bg-zinc-900
                              dark:text-zinc-300
                            `
                        }
                      `}
                    >
                      仕事なし
                    </button>
                  </div>
                </div>
              ) : sheetMode === "list" ? (
                <div className="space-y-4">
                  {(
                    [
                      "work",
                      "schedule",
                    ] as const
                  ).map((kind) => {
                    const item =
                      kind === "work"
                        ? selectedDayShifts.work
                        : selectedDayShifts.schedule;
                    const label =
                      kind === "work"
                        ? "仕事"
                        : "予定";
                    const history =
                      kind === "work"
                        ? workHistoryTemplates
                        : scheduleHistoryTemplates;

                    return (
                      <div
                        key={kind}
                        className={`p-4 ${appSurfaces.cardSm}`}
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p
                            className={`text-sm font-medium ${appSurfaces.bodyText}`}
                          >
                            {label}
                          </p>

                          {item ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditForm(
                                    kind
                                  )
                                }
                                className={`
                                  rounded-full
                                  px-3
                                  py-1
                                  text-[11px]
                                  ${theme.bgSoft}
                                  ${theme.textXs}
                                `}
                              >
                                編集
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  deleteDayKind(
                                    kind
                                  )
                                }
                                className="
                                  rounded-full
                                  bg-red-50
                                  px-3
                                  py-1
                                  text-[11px]
                                  text-red-400
                                "
                              >
                                削除
                              </button>
                            </div>
                          ) : null}
                        </div>

                        {item ? (
                          <div>
                            <p
                              className={`text-base font-semibold ${appSurfaces.bodyText}`}
                            >
                              {item.name}
                            </p>
                            <p
                              className={`mt-1 text-xs ${appSurfaces.subtleText}`}
                            >
                              {formatShiftTimeRange(
                                item
                              )}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {history.length >
                            0 ? (
                              <div>
                                <p
                                  className={`mb-2 text-xs ${appSurfaces.subtleText}`}
                                >
                                  履歴から選ぶ
                                </p>
                                {renderHistoryPicker(
                                  history
                                )}
                              </div>
                            ) : (
                              <p
                                className={`text-xs ${appSurfaces.subtleText}`}
                              >
                                まだ履歴がありません。下から新規登録できます
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                openAddForm(kind)
                              }
                              className={`
                                w-full
                                rounded-2xl
                                border border-dashed border-zinc-200
                                px-3
                                py-3
                                text-left
                                text-sm
                                text-zinc-400
                                dark:border-zinc-700
                              `}
                            >
                              新しい{label}
                              を入力して追加
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm font-medium ${appSurfaces.bodyText}`}
                    >
                      {editingKind
                        ? "編集"
                        : "追加"}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setSheetMode("list");
                        setEditingKind(null);
                        setFormName("");
                        setFormStart("");
                        setFormEnd("");
                      }}
                      className="
                        rounded-full
                        bg-zinc-100
                        px-3
                        py-1.5
                        text-xs
                        text-zinc-500
                        dark:bg-zinc-800
                        dark:text-zinc-300
                      "
                    >
                      戻る
                    </button>
                  </div>

                  <div
                    className="
                      flex
                      rounded-full
                      border border-zinc-200
                      p-0.5
                      text-xs
                      dark:border-zinc-700
                    "
                  >
                    {(
                      [
                        "work",
                        "schedule",
                      ] as const
                    ).map((kind) => (
                      <button
                        key={kind}
                        type="button"
                        disabled={Boolean(
                          editingKind
                        )}
                        onClick={() => {
                          if (editingKind) {
                            return;
                          }
                          setFormKind(kind);
                        }}
                        className={`
                          flex-1
                          rounded-full
                          px-3
                          py-2
                          transition-all
                          ${
                            editingKind
                              ? "cursor-not-allowed opacity-60"
                              : ""
                          }
                          ${
                            formKind === kind
                              ? kind ===
                                "schedule"
                                ? `
                                  bg-violet-100
                                  font-medium
                                  text-violet-700
                                  dark:bg-violet-950/60
                                  dark:text-violet-300
                                `
                                : `${theme.bgSoft} ${theme.text10Medium}`
                              : "text-zinc-400"
                          }
                        `}
                      >
                        {kind === "work"
                          ? "仕事"
                          : "予定"}
                      </button>
                    ))}
                  </div>

                  {!editingKind &&
                  formHistoryTemplates.length >
                    0 ? (
                    <div>
                      <p
                        className={`mb-2 text-xs ${appSurfaces.subtleText}`}
                      >
                        履歴から選ぶ（タップでそのまま登録）
                      </p>
                      {renderHistoryPicker(
                        formHistoryTemplates
                      )}
                      <p
                        className={`mt-3 text-xs ${appSurfaces.subtleText}`}
                      >
                        または新しく入力
                      </p>
                    </div>
                  ) : null}

                  <input
                    value={formName}
                    onChange={(event) =>
                      setFormName(
                        event.target.value
                      )
                    }
                    placeholder={
                      formKind === "schedule"
                        ? "例: 打ち合わせ"
                        : "例: 夕勤"
                    }
                    className={`px-4 py-3 text-sm ${appSurfaces.input}`}
                  />

                  <div className="space-y-2">
                    <div>
                      <p
                        className={`mb-1.5 text-xs ${appSurfaces.subtleText}`}
                      >
                        開始（15分刻み）
                      </p>
                      <div className="flex gap-2">
                        <select
                          value={
                            parseTimeParts(
                              formStart
                            ).hour ?? ""
                          }
                          onChange={(event) => {
                            const nextHour =
                              event.target
                                .value === ""
                                ? null
                                : Number(
                                    event.target
                                      .value
                                  );
                            const current =
                              parseTimeParts(
                                formStart
                              );
                            const nextMinute =
                              nextHour === null
                                ? null
                                : (current.minute ??
                                  0);
                            setFormStart(
                              formatTimeParts(
                                nextHour,
                                nextMinute
                              )
                            );
                            if (
                              nextHour ===
                                null &&
                              formEnd
                            ) {
                              setFormEnd("");
                            }
                          }}
                          className={`flex-1 px-3 py-3 text-sm ${appSurfaces.input}`}
                        >
                          <option value="">
                            —
                          </option>
                          {HOUR_OPTIONS.map(
                            (hour) => (
                              <option
                                key={hour}
                                value={hour}
                              >
                                {String(
                                  hour
                                ).padStart(
                                  2,
                                  "0"
                                )}
                                時
                              </option>
                            )
                          )}
                        </select>
                        <select
                          value={
                            parseTimeParts(
                              formStart
                            ).minute ?? ""
                          }
                          disabled={!formStart}
                          onChange={(event) => {
                            const current =
                              parseTimeParts(
                                formStart
                              );
                            if (
                              current.hour ===
                              null
                            ) {
                              return;
                            }
                            setFormStart(
                              formatTimeParts(
                                current.hour,
                                Number(
                                  event.target
                                    .value
                                )
                              )
                            );
                          }}
                          className={`flex-1 px-3 py-3 text-sm ${appSurfaces.input}`}
                        >
                          {!formStart ? (
                            <option value="">
                              —
                            </option>
                          ) : null}
                          {QUARTER_MINUTE_OPTIONS.map(
                            (minute) => (
                              <option
                                key={minute}
                                value={minute}
                              >
                                :
                                {String(
                                  minute
                                ).padStart(
                                  2,
                                  "0"
                                )}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>

                    <div>
                      <p
                        className={`mb-1.5 text-xs ${appSurfaces.subtleText}`}
                      >
                        終了（15分刻み）
                      </p>
                      <div className="flex gap-2">
                        <select
                          value={
                            parseTimeParts(
                              formEnd
                            ).hour ?? ""
                          }
                          onChange={(event) => {
                            const nextHour =
                              event.target
                                .value === ""
                                ? null
                                : Number(
                                    event.target
                                      .value
                                  );
                            const current =
                              parseTimeParts(
                                formEnd
                              );
                            const nextMinute =
                              nextHour === null
                                ? null
                                : (current.minute ??
                                  0);
                            setFormEnd(
                              formatTimeParts(
                                nextHour,
                                nextMinute
                              )
                            );
                          }}
                          className={`flex-1 px-3 py-3 text-sm ${appSurfaces.input}`}
                        >
                          <option value="">
                            —
                          </option>
                          {HOUR_OPTIONS.map(
                            (hour) => (
                              <option
                                key={hour}
                                value={hour}
                              >
                                {String(
                                  hour
                                ).padStart(
                                  2,
                                  "0"
                                )}
                                時
                              </option>
                            )
                          )}
                        </select>
                        <select
                          value={
                            parseTimeParts(
                              formEnd
                            ).minute ?? ""
                          }
                          disabled={!formEnd}
                          onChange={(event) => {
                            const current =
                              parseTimeParts(
                                formEnd
                              );
                            if (
                              current.hour ===
                              null
                            ) {
                              return;
                            }
                            setFormEnd(
                              formatTimeParts(
                                current.hour,
                                Number(
                                  event.target
                                    .value
                                )
                              )
                            );
                          }}
                          className={`flex-1 px-3 py-3 text-sm ${appSurfaces.input}`}
                        >
                          {!formEnd ? (
                            <option value="">
                              —
                            </option>
                          ) : null}
                          {QUARTER_MINUTE_OPTIONS.map(
                            (minute) => (
                              <option
                                key={minute}
                                value={minute}
                              >
                                :
                                {String(
                                  minute
                                ).padStart(
                                  2,
                                  "0"
                                )}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  <p
                    className={`text-[11px] ${appSurfaces.subtleText}`}
                  >
                    時間は空欄のままでも保存できます。保存すると履歴に残ります
                  </p>

                  <button
                    type="button"
                    onClick={saveDayForm}
                    className={`
                      w-full
                      rounded-2xl
                      px-4
                      py-3
                      text-sm
                      text-white
                      ${theme.btnSolid}
                    `}
                  >
                    保存
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
