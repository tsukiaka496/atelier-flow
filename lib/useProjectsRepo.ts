"use client";

import { useSyncExternalStore } from "react";

import {
  getProjectsRepo,
  subscribeProjectsChanged,
} from "@/lib/projectsRepo";
import { EMPTY_PROJECTS } from "@/lib/storage";

function getProjectsServerSnapshot() {
  return EMPTY_PROJECTS;
}

export function useProjectsRepo() {
  return useSyncExternalStore(
    subscribeProjectsChanged,
    getProjectsRepo,
    getProjectsServerSnapshot
  );
}
