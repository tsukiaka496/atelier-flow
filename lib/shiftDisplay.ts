import type { ShiftTemplate } from "@/lib/storage";

export function getShiftTemplateKind(
  template: ShiftTemplate
): "work" | "schedule" {
  return template.kind === "schedule"
    ? "schedule"
    : "work";
}

export function hasShiftTime(
  template: ShiftTemplate
): boolean {
  return Boolean(template.start && template.end);
}

export function formatShiftTimeRange(
  template: ShiftTemplate
): string {
  if (!hasShiftTime(template)) {
    return "時間なし";
  }

  return `${template.start}〜${template.end}`;
}

export function getShiftKindLabel(
  template: ShiftTemplate
): string {
  return getShiftTemplateKind(template) === "schedule"
    ? "予定"
    : "仕事";
}
