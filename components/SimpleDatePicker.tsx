"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { appSurfaces } from "@/lib/appSurfaces";
import { theme } from "@/lib/themeClasses";

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthDates(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const dates: (Date | null)[] = [];

  for (let i = 0; i < startDay; i++) {
    dates.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    dates.push(new Date(year, month, day));
  }

  return dates;
}

type SimpleDatePickerProps = {
  open: boolean;
  onClose: () => void;
  selectedDate: string;
  onSelectDate: (dateString: string) => void;
  children: ReactNode;
};

export default function SimpleDatePicker({
  open,
  onClose,
  selectedDate,
  onSelectDate,
  children,
}: SimpleDatePickerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const initial = new Date(selectedDate);
  const [viewMonth, setViewMonth] = useState(
    new Date(
      initial.getFullYear(),
      initial.getMonth(),
      1
    )
  );

  const todayString = formatDate(new Date());

  const dates = useMemo(
    () =>
      getMonthDates(
        viewMonth.getFullYear(),
        viewMonth.getMonth()
      ),
    [viewMonth]
  );

  useEffect(() => {
    if (!open) return;

    const parsed = new Date(selectedDate);
    setViewMonth(
      new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        1
      )
    );
  }, [open, selectedDate]);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      const target = event.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        onClose();
      }
    }

    document.addEventListener(
      "mousedown",
      handlePointer
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointer
      );
    };
  }, [open, onClose]);

  return (
    <div className="relative">
      {children}

      {open && (
        <div
          ref={panelRef}
          className={`
            absolute
            right-0
            top-full
            z-[60]
            mt-2
            w-[min(100vw-2.5rem,280px)]
            rounded-[24px]
            border border-white/60
            bg-white/90
            p-3
            shadow-[0_12px_40px_rgba(0,0,0,0.12)]
            backdrop-blur-xl
            dark:border-zinc-700/50
            dark:bg-zinc-900/92
            dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]
          `}
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setViewMonth(
                  new Date(
                    viewMonth.getFullYear(),
                    viewMonth.getMonth() - 1,
                    1
                  )
                )
              }
              className={appSurfaces.roundButton}
            >
              ←
            </button>

            <p className={`text-sm font-medium ${appSurfaces.bodyText}`}>
              {viewMonth.getFullYear()}年{" "}
              {viewMonth.getMonth() + 1}月
            </p>

            <button
              type="button"
              onClick={() =>
                setViewMonth(
                  new Date(
                    viewMonth.getFullYear(),
                    viewMonth.getMonth() + 1,
                    1
                  )
                )
              }
              className={appSurfaces.roundButton}
            >
              →
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {["日", "月", "火", "水", "木", "金", "土"].map(
              (day) => (
                <div
                  key={day}
                  className="text-center text-[10px] text-zinc-400"
                >
                  {day}
                </div>
              )
            )}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {dates.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} />;
              }

              const dateString = formatDate(date);
              const isSelected =
                dateString === selectedDate;
              const isToday =
                dateString === todayString;

              return (
                <button
                  key={dateString}
                  type="button"
                  onClick={() => {
                    onSelectDate(dateString);
                    onClose();
                  }}
                  className={`
                    aspect-square
                    rounded-xl
                    text-xs
                    transition-all

                    ${
                      isSelected
                        ? appSurfaces.weekDaySelected
                        : isToday
                        ? `${theme.border} ${appSurfaces.dayCellToday}`
                        : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
