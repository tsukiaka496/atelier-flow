"use client";

import { useSyncExternalStore } from "react";

import {
  EMPTY_SHIFTS,
  EMPTY_SHIFT_TEMPLATES,
  getShifts,
  getShiftTemplates,
  subscribeShiftsChanged,
} from "@/lib/storage";

function getShiftsServerSnapshot() {
  return EMPTY_SHIFTS;
}

function getShiftTemplatesServerSnapshot() {
  return EMPTY_SHIFT_TEMPLATES;
}

export function useShifts() {
  return useSyncExternalStore(
    subscribeShiftsChanged,
    getShifts,
    getShiftsServerSnapshot
  );
}

export function useShiftTemplates() {
  return useSyncExternalStore(
    subscribeShiftsChanged,
    getShiftTemplates,
    getShiftTemplatesServerSnapshot
  );
}
