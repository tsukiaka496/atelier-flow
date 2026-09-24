"use client";

import { useSyncExternalStore } from "react";

import {
  getMemoGroupsRepo,
  getMemosRepo,
  subscribeMemoGroupsChanged,
  subscribeMemosChanged,
} from "@/lib/memosRepo";
import {
  EMPTY_MEMO_GROUPS,
  EMPTY_MEMOS,
} from "@/lib/storage";

function getMemosServerSnapshot() {
  return EMPTY_MEMOS;
}

function getMemoGroupsServerSnapshot() {
  return EMPTY_MEMO_GROUPS;
}

export function useMemos() {
  return useSyncExternalStore(
    subscribeMemosChanged,
    getMemosRepo,
    getMemosServerSnapshot
  );
}

export function useMemoGroups() {
  return useSyncExternalStore(
    subscribeMemoGroupsChanged,
    getMemoGroupsRepo,
    getMemoGroupsServerSnapshot
  );
}
