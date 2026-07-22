"use client";

import {
  useMemo,
  useState,
} from "react";

import PageShell from "@/components/PageShell";
import { appSurfaces } from "@/lib/appSurfaces";
import {
  saveTimeline,
  type TimelineSlot,
} from "@/lib/storage";
import { theme } from "@/lib/themeClasses";
import { useTimeline } from "@/lib/useTimeline";

type TimelineTab = "weekday" | "holiday";

const HOURS = Array.from(
  { length: 24 },
  (_, hour) => hour
);

const MORNING_HOURS = HOURS.slice(0, 12);
const AFTERNOON_HOURS = HOURS.slice(12, 24);

const MINUTE_OPTIONS = [0, 15, 30, 45] as const;

function clampMinutes(minutes: number) {
  return Math.max(
    0,
    Math.min(24 * 60, minutes)
  );
}

function minutesToParts(minutes: number) {
  if (minutes >= 24 * 60) {
    return { hour: 24, minute: 0 };
  }

  const clamped = Math.max(
    0,
    Math.min(23 * 60 + 45, minutes)
  );
  const hour = Math.floor(clamped / 60);
  const rawMinute = clamped % 60;
  const minute = MINUTE_OPTIONS.reduce(
    (best, option) =>
      Math.abs(option - rawMinute) <
      Math.abs(best - rawMinute)
        ? option
        : best,
    MINUTE_OPTIONS[0]
  );

  return { hour, minute };
}

function formatMinutes(minutes: number) {
  if (minutes >= 24 * 60) {
    return "24:00";
  }

  const { hour, minute } =
    minutesToParts(minutes);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function getSlotEnd(slot: TimelineSlot) {
  if (
    typeof slot.endMinutes === "number" &&
    slot.endMinutes > slot.minutes
  ) {
    return slot.endMinutes;
  }

  return slot.minutes;
}

function isRangeSlot(slot: TimelineSlot) {
  return getSlotEnd(slot) > slot.minutes;
}

function formatSlotRange(slot: TimelineSlot) {
  if (!isRangeSlot(slot)) {
    return formatMinutes(slot.minutes);
  }

  return `${formatMinutes(slot.minutes)}–${formatMinutes(getSlotEnd(slot))}`;
}

function sortSlots(slots: TimelineSlot[]) {
  return [...slots].sort(
    (a, b) => a.minutes - b.minutes
  );
}

/** その時間が範囲に含まれるか（終了時刻の時は含まない） */
function slotCoversHour(
  slot: TimelineSlot,
  hour: number
) {
  const start = slot.minutes;
  const end = getSlotEnd(slot);
  const hourStart = hour * 60;
  const hourEnd = (hour + 1) * 60;

  if (end <= start) {
    return Math.floor(start / 60) === hour;
  }

  return start < hourEnd && end > hourStart;
}

type ColumnSegment = {
  slot: TimelineSlot;
  /** 列内の開始行（0始まり） */
  startIndex: number;
  /** 列内の終了行（排他） */
  endIndex: number;
};

/** 列の時間帯にクリップした、まとまりブロック */
function segmentsForColumn(
  slots: TimelineSlot[],
  hours: number[]
): ColumnSegment[] {
  if (hours.length === 0) {
    return [];
  }

  const hourSet = new Set(hours);
  const firstHour = hours[0];
  const lastHour = hours[hours.length - 1];
  const segments: ColumnSegment[] = [];

  for (const slot of slots) {
    const covered = hours.filter((hour) =>
      slotCoversHour(slot, hour)
    );

    if (covered.length === 0) {
      continue;
    }

    const startHour = covered[0];
    const endHour = covered[covered.length - 1];

    // 連続している前提（範囲予定は途切れない）
    if (
      !hourSet.has(startHour) ||
      startHour < firstHour ||
      endHour > lastHour
    ) {
      continue;
    }

    segments.push({
      slot,
      startIndex: hours.indexOf(startHour),
      endIndex: hours.indexOf(endHour) + 1,
    });
  }

  return segments;
}

const ROW_HEIGHT_PX = 38;
const GUTTER_WIDTH_PX = 30;

export default function TimelinePage() {
  const plan = useTimeline();

  const [tab, setTab] =
    useState<TimelineTab>("weekday");

  const [sheetOpen, setSheetOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] =
    useState(0);
  const [endHour, setEndHour] = useState(10);
  const [endMinute, setEndMinute] = useState(0);
  const [label, setLabel] = useState("");

  const slots = useMemo(
    () =>
      sortSlots(
        tab === "weekday"
          ? plan.weekday
          : plan.holiday
      ),
    [plan, tab]
  );

  const tabLabel =
    tab === "weekday" ? "平日" : "休日";

  function openAddAtHour(targetHour: number) {
    setEditingId(null);
    setStartHour(targetHour);
    setStartMinute(0);
    setEndHour(Math.min(24, targetHour + 1));
    setEndMinute(0);
    setLabel("");
    setSheetOpen(true);
  }

  function openEditSheet(slot: TimelineSlot) {
    const start = minutesToParts(slot.minutes);
    const rawEnd = isRangeSlot(slot)
      ? getSlotEnd(slot)
      : Math.min(24 * 60, slot.minutes + 60);
    const end = minutesToParts(rawEnd);

    setEditingId(slot.id);
    setStartHour(start.hour);
    setStartMinute(start.minute);
    setEndHour(
      rawEnd >= 24 * 60 ? 24 : end.hour
    );
    setEndMinute(
      rawEnd >= 24 * 60 ? 0 : end.minute
    );
    setLabel(slot.label);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingId(null);
  }

  function persistSlots(
    nextSlots: TimelineSlot[]
  ) {
    if (tab === "weekday") {
      saveTimeline({
        ...plan,
        weekday: sortSlots(nextSlots),
      });
      return;
    }

    saveTimeline({
      ...plan,
      holiday: sortSlots(nextSlots),
    });
  }

  function saveSlot() {
    const trimmed = label.trim();

    if (!trimmed) {
      window.alert("内容を入力してください");
      return;
    }

    const start = clampMinutes(
      startHour * 60 + startMinute
    );
    let end = clampMinutes(
      endHour * 60 + endMinute
    );

    if (endHour === 24) {
      end = 24 * 60;
    }

    if (end <= start) {
      window.alert(
        "終了は開始より後の時刻にしてください"
      );
      return;
    }

    const nextSlot: TimelineSlot = {
      id: editingId ?? crypto.randomUUID(),
      minutes: start,
      endMinutes: end,
      label: trimmed,
    };

    const current =
      tab === "weekday"
        ? plan.weekday
        : plan.holiday;

    if (editingId) {
      persistSlots(
        current.map((slot) =>
          slot.id === editingId
            ? nextSlot
            : slot
        )
      );
    } else {
      persistSlots([...current, nextSlot]);
    }

    closeSheet();
  }

  function deleteSlot(id: string) {
    const current =
      tab === "weekday"
        ? plan.weekday
        : plan.holiday;

    const target = current.find(
      (slot) => slot.id === id
    );

    if (!target) {
      return;
    }

    const confirmed = window.confirm(
      `「${target.label}」を削除しますか？`
    );

    if (!confirmed) {
      return;
    }

    persistSlots(
      current.filter(
        (slot) => slot.id !== id
      )
    );

    if (editingId === id) {
      closeSheet();
    }
  }

  const endHourOptions = [
    ...HOURS,
    24,
  ];

  return (
    <PageShell title="時間">
      <div className="mx-auto max-w-md">
        <div
          className="
            mb-5
            grid
            grid-cols-2
            gap-2
            rounded-full
            border border-zinc-200
            bg-white/70
            p-1
            dark:border-zinc-700
            dark:bg-zinc-900/70
          "
        >
          {(
            [
              {
                value: "weekday" as const,
                label: "平日",
              },
              {
                value: "holiday" as const,
                label: "休日",
              },
            ]
          ).map((option) => {
            const selected =
              tab === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setTab(option.value)
                }
                className={`
                  rounded-full
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  transition-all
                  ${
                    selected
                      ? `
                        bg-[var(--theme-accent-soft)]
                        text-[var(--theme-accent)]
                      `
                      : "text-zinc-500 dark:text-zinc-400"
                  }
                `}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <p
          className={`mb-4 text-sm ${appSurfaces.subtleText}`}
        >
          {tabLabel}
          ：開始〜終了を一度に登録できます（例:
          4時〜12時＝睡眠）
        </p>

        <div className="grid grid-cols-2 gap-2">
          {[
            {
              key: "morning",
              hours: MORNING_HOURS,
              heading: "午前 0〜11",
              endLabel: 12,
            },
            {
              key: "afternoon",
              hours: AFTERNOON_HOURS,
              heading: "午後 12〜23",
              endLabel: 24,
            },
          ].map((column) => {
            const segments = segmentsForColumn(
              slots,
              column.hours
            );
            const coveredHours = new Set(
              segments.flatMap((segment) =>
                column.hours.slice(
                  segment.startIndex,
                  segment.endIndex
                )
              )
            );
            const columnHeight =
              column.hours.length *
              ROW_HEIGHT_PX;

            return (
              <div
                key={column.key}
                className={`
                  min-w-0
                  overflow-visible
                  rounded-2xl
                  border border-zinc-200
                  bg-white
                  px-1.5
                  pb-3
                  pt-2
                  dark:border-zinc-700
                  dark:bg-zinc-900
                `}
              >
                <p
                  className={`
                    mb-2
                    text-center
                    text-[11px]
                    font-semibold
                    tracking-wide
                    text-zinc-600
                    dark:text-zinc-300
                  `}
                >
                  {column.heading}
                </p>

                <div
                  className="relative"
                  style={{
                    height: columnHeight,
                  }}
                >
                  {/* 交互の行背景で枠組みを見せる */}
                  {column.hours.map(
                    (hourValue, index) => (
                      <div
                        key={`row-${hourValue}`}
                        style={{
                          top:
                            index * ROW_HEIGHT_PX,
                          height: ROW_HEIGHT_PX,
                          left: GUTTER_WIDTH_PX,
                          right: 0,
                        }}
                        className={`
                          absolute
                          z-0
                          ${
                            index % 2 === 0
                              ? "bg-zinc-50 dark:bg-zinc-800/40"
                              : "bg-transparent"
                          }
                        `}
                      />
                    )
                  )}

                  {/* 時間目盛り：予定ボックスの境目 */}
                  {column.hours.map(
                    (hourValue, index) => (
                      <div
                        key={`mark-${hourValue}`}
                        className="pointer-events-none absolute z-20"
                        style={{
                          top:
                            index * ROW_HEIGHT_PX,
                          left: 0,
                          right: 0,
                        }}
                      >
                        <span
                          className="
                            absolute
                            top-0
                            -translate-y-1/2
                            text-right
                            text-[11px]
                            font-semibold
                            tabular-nums
                            leading-none
                            text-zinc-600
                            dark:text-zinc-300
                          "
                          style={{
                            width:
                              GUTTER_WIDTH_PX - 2,
                            left: 0,
                          }}
                        >
                          {hourValue}
                        </span>
                        <div
                          className="
                            border-t
                            border-zinc-300
                            dark:border-zinc-600
                          "
                          style={{
                            marginLeft:
                              GUTTER_WIDTH_PX,
                          }}
                        />
                      </div>
                    )
                  )}

                  <div
                    className="pointer-events-none absolute z-20"
                    style={{
                      top: columnHeight,
                      left: 0,
                      right: 0,
                    }}
                  >
                    <span
                      className="
                        absolute
                        top-0
                        -translate-y-1/2
                        text-right
                        text-[11px]
                        font-semibold
                        tabular-nums
                        leading-none
                        text-zinc-600
                        dark:text-zinc-300
                      "
                      style={{
                        width:
                          GUTTER_WIDTH_PX - 2,
                        left: 0,
                      }}
                    >
                      {column.endLabel}
                    </span>
                    <div
                      className="
                        border-t
                        border-zinc-300
                        dark:border-zinc-600
                      "
                      style={{
                        marginLeft:
                          GUTTER_WIDTH_PX,
                      }}
                    />
                  </div>

                  {/* 空き時間タップ面 */}
                  {column.hours.map(
                    (hourValue, index) => (
                      <button
                        key={`slot-${hourValue}`}
                        type="button"
                        onClick={() =>
                          openAddAtHour(hourValue)
                        }
                        style={{
                          top:
                            index * ROW_HEIGHT_PX,
                          height: ROW_HEIGHT_PX,
                          left: GUTTER_WIDTH_PX,
                          right: 0,
                        }}
                        className={`
                          absolute
                          z-[1]
                          flex
                          items-center
                          justify-center
                          text-[10px]
                          ${
                            coveredHours.has(
                              hourValue
                            )
                              ? "text-transparent"
                              : "text-zinc-300 dark:text-zinc-600"
                          }
                        `}
                        aria-label={`${formatHourLabel(hourValue)}に追加`}
                      >
                        {coveredHours.has(
                          hourValue
                        )
                          ? null
                          : "＋"}
                      </button>
                    )
                  )}

                  {/* 予定ブロック */}
                  {segments.map((segment) => {
                    const span =
                      segment.endIndex -
                      segment.startIndex;
                    const tall = span >= 2;
                    const slotStartHour =
                      Math.floor(
                        segment.slot.minutes / 60
                      );
                    const showLabel =
                      column.hours[
                        segment.startIndex
                      ] === slotStartHour;

                    return (
                      <button
                        key={`${segment.slot.id}-${column.key}-${segment.startIndex}`}
                        type="button"
                        onClick={() =>
                          openEditSheet(
                            segment.slot
                          )
                        }
                        style={{
                          top:
                            segment.startIndex *
                              ROW_HEIGHT_PX +
                            3,
                          height:
                            span * ROW_HEIGHT_PX -
                            6,
                          left:
                            GUTTER_WIDTH_PX + 3,
                          right: 2,
                        }}
                        className={`
                          absolute
                          z-10
                          flex
                          flex-col
                          overflow-hidden
                          rounded-lg
                          border
                          border-[var(--theme-accent-border)]
                          bg-[var(--theme-accent-soft)]
                          pl-2
                          pr-1.5
                          text-left
                          shadow-[inset_3px_0_0_0_var(--theme-accent)]
                          transition-transform
                          active:scale-[0.99]
                          ${
                            tall
                              ? "py-1"
                              : "py-0"
                          }
                          ${
                            showLabel
                              ? ""
                              : "opacity-90"
                          }
                        `}
                        aria-label={`${segment.slot.label}を編集`}
                      >
                        {showLabel ? (
                          tall ? (
                            <span
                              className="
                                flex
                                h-full
                                w-full
                                flex-col
                                items-center
                                justify-center
                                text-center
                                text-[var(--theme-accent)]
                              "
                            >
                              <span className="text-[13px] font-bold leading-tight">
                                {segment.slot.label}
                              </span>
                              <span className="mt-0.5 text-[10px] font-semibold tabular-nums opacity-90">
                                {formatSlotRange(
                                  segment.slot
                                )}
                              </span>
                            </span>
                          ) : (
                            <span
                              className="
                                flex
                                h-full
                                w-full
                                min-w-0
                                items-center
                                text-[var(--theme-accent)]
                              "
                            >
                              <span className="truncate text-[12px] font-bold leading-none">
                                {segment.slot.label}
                              </span>
                            </span>
                          )
                        ) : (
                          <span
                            className="
                              flex
                              h-full
                              w-full
                              min-w-0
                              items-center
                              justify-center
                              text-[var(--theme-accent)]
                            "
                          >
                            <span className="truncate text-[11px] font-semibold leading-none opacity-80">
                              …{segment.slot.label}
                            </span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {sheetOpen ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeSheet}
          />

          <div className="absolute bottom-0 left-0 right-0 mx-auto max-h-[90vh] w-full max-w-md overflow-y-auto px-5 pb-6">
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
              <p
                className={`text-sm font-semibold ${appSurfaces.bodyText}`}
              >
                {editingId
                  ? "予定を編集"
                  : "予定を追加"}
              </p>

              <p
                className={`mt-1 text-xs ${appSurfaces.subtleText}`}
              >
                開始と終了を指定すると、その間がまとめて埋まります
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <p
                    className={`mb-2 text-xs ${appSurfaces.subtleText}`}
                  >
                    開始
                  </p>

                  <div className="flex gap-2">
                    <select
                      value={startHour}
                      onChange={(event) => {
                        const next = Number(
                          event.target.value
                        );
                        setStartHour(next);
                        const start =
                          next * 60 +
                          startMinute;
                        const end =
                          endHour * 60 +
                          endMinute;
                        if (end <= start) {
                          setEndHour(
                            Math.min(24, next + 1)
                          );
                          setEndMinute(0);
                        }
                      }}
                      className={`flex-1 px-3 py-3 text-sm ${appSurfaces.input}`}
                    >
                      {HOURS.map((value) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {String(
                            value
                          ).padStart(2, "0")}
                          時
                        </option>
                      ))}
                    </select>

                    <select
                      value={startMinute}
                      onChange={(event) =>
                        setStartMinute(
                          Number(
                            event.target.value
                          )
                        )
                      }
                      className={`flex-1 px-3 py-3 text-sm ${appSurfaces.input}`}
                    >
                      {MINUTE_OPTIONS.map(
                        (value) => (
                          <option
                            key={value}
                            value={value}
                          >
                            :
                            {String(
                              value
                            ).padStart(2, "0")}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <p
                    className={`mb-2 text-xs ${appSurfaces.subtleText}`}
                  >
                    終了
                  </p>

                  <div className="flex gap-2">
                    <select
                      value={endHour}
                      onChange={(event) => {
                        const next = Number(
                          event.target.value
                        );
                        setEndHour(next);
                        if (next === 24) {
                          setEndMinute(0);
                        }
                      }}
                      className={`flex-1 px-3 py-3 text-sm ${appSurfaces.input}`}
                    >
                      {endHourOptions.map(
                        (value) => (
                          <option
                            key={value}
                            value={value}
                          >
                            {value === 24
                              ? "24時"
                              : `${String(value).padStart(2, "0")}時`}
                          </option>
                        )
                      )}
                    </select>

                    <select
                      value={endMinute}
                      disabled={endHour === 24}
                      onChange={(event) =>
                        setEndMinute(
                          Number(
                            event.target.value
                          )
                        )
                      }
                      className={`flex-1 px-3 py-3 text-sm ${appSurfaces.input}`}
                    >
                      {MINUTE_OPTIONS.map(
                        (value) => (
                          <option
                            key={value}
                            value={value}
                          >
                            :
                            {String(
                              value
                            ).padStart(2, "0")}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <p
                    className={`mb-2 text-xs ${appSurfaces.subtleText}`}
                  >
                    内容
                  </p>

                  <input
                    value={label}
                    onChange={(event) =>
                      setLabel(
                        event.target.value
                      )
                    }
                    placeholder="例: 睡眠 / 作業 / 夕食"
                    className={`px-4 py-3 text-sm ${appSurfaces.input}`}
                    autoFocus
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-2">
                {editingId ? (
                  <button
                    type="button"
                    onClick={() =>
                      deleteSlot(editingId)
                    }
                    className="
                      rounded-xl
                      bg-red-50
                      px-3
                      py-2
                      text-xs
                      text-red-500
                    "
                  >
                    削除
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeSheet}
                    className="
                      rounded-xl
                      bg-zinc-100
                      px-3
                      py-2
                      text-xs
                      text-zinc-500
                      dark:bg-zinc-800
                      dark:text-zinc-300
                    "
                  >
                    キャンセル
                  </button>

                  <button
                    type="button"
                    onClick={saveSlot}
                    className={`
                      rounded-xl
                      px-4
                      py-2
                      text-xs
                      text-white
                      ${theme.btnSolid}
                    `}
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
