import type { ShiftTemplate } from "@/lib/storage";
import {
  formatShiftTimeRange,
  hasShiftTime,
} from "@/lib/shiftDisplay";

type MonthDayShiftBadgesProps = {
  work: ShiftTemplate | null;
  schedule: ShiftTemplate | null;
  compact?: boolean;
};

export default function MonthDayShiftBadges({
  work,
  schedule,
  compact = false,
}: MonthDayShiftBadgesProps) {
  if (!work && !schedule) {
    return null;
  }

  const textSize = compact
    ? "text-[8px]"
    : "text-[9px]";

  return (
    <div
      className={`
        mt-1
        flex
        flex-col
        gap-0.5
        leading-none
      `}
    >
      {work && (
        <div
          className={`
            flex
            items-center
            gap-0.5
            rounded
            px-1
            py-0.5
            ${textSize}
            bg-[color-mix(in_srgb,var(--theme-accent)_14%,transparent)]
            text-[var(--theme-accent)]
          `}
        >
          <span className="font-semibold">
            仕
          </span>
          {hasShiftTime(work) && (
            <span className="truncate opacity-80">
              {work.start}
            </span>
          )}
        </div>
      )}

      {schedule && (
        <div
          className={`
            flex
            items-center
            gap-0.5
            rounded
            px-1
            py-0.5
            ${textSize}
            bg-[color-mix(in_srgb,#8b5cf6_14%,transparent)]
            text-violet-700
            dark:text-violet-300
          `}
        >
          <span className="font-semibold">
            予
          </span>
          {hasShiftTime(schedule) && (
            <span className="truncate opacity-80">
              {schedule.start}
            </span>
          )}
        </div>
      )}

      {!compact &&
        (work || schedule) && (
          <p className="sr-only">
            {work &&
              `仕事 ${formatShiftTimeRange(work)}`}
            {schedule &&
              `予定 ${formatShiftTimeRange(schedule)}`}
          </p>
        )}
    </div>
  );
}
