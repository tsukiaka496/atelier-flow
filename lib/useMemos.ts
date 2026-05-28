"use client";

import { useSyncExternalStore } from "react";

import {
  getMemosRepo,
  subscribeMemosChanged,
} from "@/lib/memosRepo";
import { EMPTY_MEMOS } from "@/lib/storage";

function getMemosServerSnapshot() {
  return EMPTY_MEMOS;
}

export function useMemos() {
  return useSyncExternalStore(
    subscribeMemosChanged,
    getMemosRepo,
    getMemosServerSnapshot
  );
}
