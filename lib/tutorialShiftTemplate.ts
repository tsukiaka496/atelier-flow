import type { ShiftTemplate } from "@/lib/storage";

export const TUTORIAL_SHIFT_TEMPLATE_ID =
  "tutorial-shift-template";

export function createTutorialShiftTemplate(): ShiftTemplate {
  return {
    id: TUTORIAL_SHIFT_TEMPLATE_ID,
    name: "仕事",
    start: "10:00",
    end: "18:00",
  };
}

export function hasTutorialShiftTemplate(
  templates: ShiftTemplate[]
): boolean {
  return templates.some(
    (template) =>
      template.id === TUTORIAL_SHIFT_TEMPLATE_ID
  );
}
