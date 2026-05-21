"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getShiftTemplates,
  getShifts,
  saveShiftTemplates,
  saveShifts,
  Shift,
  ShiftTemplate,
} from "@/lib/storage";

import ThemedMain from "@/components/ThemedMain";
import { theme } from "@/lib/themeClasses";

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
  const today = new Date();

  const [currentDate, setCurrentDate] =
    useState(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );

  const [templates, setTemplates] =
    useState<ShiftTemplate[]>([]);

  const [shifts, setShifts] =
    useState<Shift[]>([]);

  const [
    selectedTemplateId,
    setSelectedTemplateId,
  ] = useState("");

  const [name, setName] =
    useState("");

  const [start, setStart] =
    useState("");

  const [end, setEnd] =
    useState("");

  const [editMode, setEditMode] =
    useState(false);

  useEffect(() => {
    const savedTemplates =
      getShiftTemplates();

    const savedShifts =
      getShifts();

    setTemplates(savedTemplates);

    setShifts(savedShifts);

    if (
      savedTemplates.length > 0
    ) {
      setSelectedTemplateId(
        savedTemplates[0].id
      );
    }
  }, []);

  const dates = useMemo(
    () =>
      getMonthDates(
        currentDate.getFullYear(),
        currentDate.getMonth()
      ),
    [currentDate]
  );

  function addTemplate() {
    if (
      !name ||
      !start ||
      !end
    ) {
      return;
    }

    const newTemplate: ShiftTemplate =
      {
        id: crypto.randomUUID(),
        name,
        start,
        end,
      };

    const updatedTemplates = [
      ...templates,
      newTemplate,
    ];

    setTemplates(
      updatedTemplates
    );

    saveShiftTemplates(
      updatedTemplates
    );

    setSelectedTemplateId(
      newTemplate.id
    );

    setName("");
    setStart("");
    setEnd("");
  }

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

    setTemplates(
      updatedTemplates
    );

    setShifts(updatedShifts);

    saveShiftTemplates(
      updatedTemplates
    );

    saveShifts(updatedShifts);

    if (
      selectedTemplateId ===
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
      !selectedTemplateId
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
            selectedTemplateId,
        },
      ];
    }

    setShifts(updatedShifts);

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

          <p className="text-sm text-zinc-400">
            work schedule
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-wide">
            月表示
          </h1>

        </div>

        {/* 月移動 */}
        <div className="mb-5 flex items-center justify-between">

          <button
            onClick={
              previousMonth
            }
            className="
              rounded-full
              bg-white
              px-4
              py-2
              text-sm
              text-zinc-500
              shadow-[0_2px_10px_rgba(0,0,0,0.05)]
            "
          >
            ←
          </button>

          <p className="text-lg font-semibold">
            {currentMonthText}
          </p>

          <button
            onClick={nextMonth}
            className="
              rounded-full
              bg-white
              px-4
              py-2
              text-sm
              text-zinc-500
              shadow-[0_2px_10px_rgba(0,0,0,0.05)]
            "
          >
            →
          </button>

        </div>

        {/* 編集ボタン */}
        <div className="mb-4 flex justify-end">

          <button
            onClick={() =>
              setEditMode(
                !editMode
              )
            }
            className={`
              rounded-full
              px-4
              py-2
              text-xs
              transition-all

              ${
                editMode
                  ? `
                    ${theme.bgSoft}
                    ${theme.text}
                  `
                  : `
                    bg-white
                    text-zinc-500
                  `
              }
            `}
          >
            {editMode
              ? "編集モードON"
              : "編集"}
          </button>

        </div>

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
        <div className="mb-6 grid grid-cols-7 gap-2">

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
                  onClick={() =>
                    toggleShift(
                      dateString
                    )
                  }
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
                        : `
                          border-zinc-200
                          bg-white
                        `
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

                      <p className="text-[10px] text-zinc-700">
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

        {/* テンプレ */}
        <div
          className="
            mb-5
            rounded-[28px]
            border border-white/60
            bg-white/75
            p-4
            backdrop-blur-xl
            shadow-[0_8px_30px_rgba(0,0,0,0.05)]
          "
        >

          <div className="mb-3 flex items-center justify-between">

            <p className="text-sm text-zinc-400">
              シフトテンプレ
            </p>

            <button
              onClick={addTemplate}
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
              placeholder="夕勤"
              className="
                w-full
                rounded-2xl
                border border-zinc-200
                bg-white
                px-4
                py-3
                text-sm
              "
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
                className="
                  flex-1
                  rounded-2xl
                  border border-zinc-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                "
              />

              <input
                type="time"
                value={end}
                onChange={(e) =>
                  setEnd(
                    e.target.value
                  )
                }
                className="
                  flex-1
                  rounded-2xl
                  border border-zinc-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                "
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
                    selectedTemplateId ===
                    template.id
                      ? `
                        ${theme.border}
                        ${theme.bgSoft}
                      `
                      : `
                        border-zinc-200
                        bg-white
                      `
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

      {/* 下バー */}
      <div
        className="
          fixed
          bottom-5
          left-1/2
          flex
          w-[92%]
          max-w-md
          -translate-x-1/2
          items-center
          justify-between
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
          className="text-sm text-zinc-500"
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
          className={theme.navActive}
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