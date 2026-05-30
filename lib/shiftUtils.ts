import type {
  Shift,
  ShiftTemplate,
  ShiftTemplateKind,
} from "@/lib/storage";
import { getShiftTemplateKind } from "@/lib/shiftDisplay";

export function resolveShiftKind(
  shift: Shift,
  templates: ShiftTemplate[]
): ShiftTemplateKind {
  if (shift.kind === "schedule") {
    return "schedule";
  }

  if (shift.kind === "work") {
    return "work";
  }

  const template = templates.find(
    (item) => item.id === shift.templateId
  );

  return template
    ? getShiftTemplateKind(template)
    : "work";
}

export function getShiftsOnDate(
  shifts: Shift[],
  date: string
): Shift[] {
  return shifts.filter(
    (shift) => shift.date === date
  );
}

export function getTemplatesForDate(
  date: string,
  shifts: Shift[],
  templates: ShiftTemplate[]
): {
  work: ShiftTemplate | null;
  schedule: ShiftTemplate | null;
} {
  let work: ShiftTemplate | null = null;
  let schedule: ShiftTemplate | null = null;

  for (const shift of getShiftsOnDate(
    shifts,
    date
  )) {
    const template = templates.find(
      (item) =>
        item.id === shift.templateId
    );

    if (!template) {
      continue;
    }

    if (
      resolveShiftKind(shift, templates) ===
      "schedule"
    ) {
      schedule = template;
    } else {
      work = template;
    }
  }

  return { work, schedule };
}

export function shiftMatchesKind(
  shift: Shift,
  kind: ShiftTemplateKind,
  templates: ShiftTemplate[]
): boolean {
  return (
    resolveShiftKind(shift, templates) ===
    kind
  );
}
