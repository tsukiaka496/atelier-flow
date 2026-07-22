import { normalizeHex } from "./colorFormat";
import {
  applyColorModeClass,
  normalizeColorMode,
  notifyThemeChange,
} from "@/lib/colorMode";
import {
  normalizeCustomBackgroundImages,
} from "@/lib/themeBackgrounds";
import { normalizeMemoImportance } from "@/lib/memoImportance";

export type Task = {
  id: string;
  title: string;
  completed: boolean;
};

export type ScheduleSlot = {
  id: string;
  date: string;
  taskId?: string;
};

export type Project = {
  id: string;
  title: string;
  client: string;
  color: string;
  deadline: string;
  tasks: Task[];
  schedule: ScheduleSlot[];
  /** 作業がない案件の手動完了（100% / 0%） */
  manualCompleted?: boolean;
};

export type ShiftTemplateKind =
  | "work"
  | "schedule";

export type ShiftTemplate = {
  id: string;
  name: string;
  start: string;
  end: string;
  kind?: ShiftTemplateKind;
};

export type Shift = {
  date: string;
  templateId: string;
  /** 同日に仕事・予定を両方置けるよう種別を保持 */
  kind?: ShiftTemplateKind;
};

export type Memo = {
  id: string;
  title: string;
  content: string;
  date: string;
  importance: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TimelineSlot = {
  id: string;
  /** 開始（分、0:00 からの経過） */
  minutes: number;
  /**
   * 終了（分）。省略時は開始時刻のポイント予定。
   * 開始より大きいとき範囲予定（終了時刻は含まない）。
   */
  endMinutes?: number;
  label: string;
};

export type TimelinePlan = {
  weekday: TimelineSlot[];
  holiday: TimelineSlot[];
};

export type ThemeSettings = {
  background: string;
  accent: string;
  backgroundImage: string;
  colorMode?: "light" | "dark";
  /** data URL で保存するユーザー追加の背景画像 */
  customBackgroundImages?: string[];
  monthDisplayMode?: "detailed" | "simple";
};

export type BackupData = {
  version: number;
  exportedAt: string;
  projects: Project[];
  shifts: Shift[];
  shiftTemplates: ShiftTemplate[];
  /** v2 以降。旧バックアップとの互換のため省略可 */
  memos?: Memo[];
  /** 旧バックアップとの互換のため省略可 */
  theme?: ThemeSettings;
  /** v3 以降。旧バックアップとの互換のため省略可 */
  timeline?: TimelinePlan;
};

const STORAGE_KEY =
  "atelier-flow-projects";

const SHIFT_TEMPLATE_KEY =
  "atelier-flow-shift-templates";

const SHIFT_KEY =
  "atelier-flow-shifts";

const THEME_KEY =
  "atelier-flow-theme";

const MEMOS_KEY =
  "atelier-flow-memos";

const TIMELINE_KEY =
  "atelier-flow-timeline";

/** 旧オンボーディングキー（clear 時に掃除） */
const ONBOARDING_KEY =
  "atelier-flow-onboarding";

const PREF_KEYS = [
  "atelier-sort",
  "atelier-show-completed",
  "atelier-memos-sort",
  "atelier-show-completed-memos",
] as const;

const BACKUP_VERSION = 3;

const SHIFTS_CHANGED_EVENT =
  "atelier-flow:shifts-changed";

const TIMELINE_CHANGED_EVENT =
  "atelier-flow:timeline-changed";

function notifyShiftsChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(SHIFTS_CHANGED_EVENT)
  );
}

export function subscribeShiftsChanged(
  onChange: () => void
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(
    SHIFTS_CHANGED_EVENT,
    onChange
  );

  return () => {
    window.removeEventListener(
      SHIFTS_CHANGED_EVENT,
      onChange
    );
  };
}

function notifyTimelineChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(TIMELINE_CHANGED_EVENT)
  );
}

export function subscribeTimelineChanged(
  onChange: () => void
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(
    TIMELINE_CHANGED_EVENT,
    onChange
  );

  return () => {
    window.removeEventListener(
      TIMELINE_CHANGED_EVENT,
      onChange
    );
  };
}

function normalizeMonthDisplayMode(
  value: unknown
): "detailed" | "simple" {
  return value === "simple"
    ? "simple"
    : "detailed";
}

const defaultTheme: ThemeSettings = {
  background: "#f0b89a",
  accent: "#f9a8d4",
  backgroundImage: "",
  colorMode: "light",
  monthDisplayMode: "detailed",
};

/** SSR / hydration 用の固定参照 */
export const DEFAULT_THEME: ThemeSettings = {
  ...defaultTheme,
  customBackgroundImages: [],
};

/** SSR と初回 hydration で使う固定デフォルト */
export function getDefaultTheme(): ThemeSettings {
  return DEFAULT_THEME;
}

export const EMPTY_PROJECTS: Project[] = [];
export const EMPTY_SHIFTS: Shift[] = [];
export const EMPTY_SHIFT_TEMPLATES: ShiftTemplate[] = [];
export const EMPTY_MEMOS: Memo[] = [];
export const EMPTY_TIMELINE: TimelinePlan = {
  weekday: [],
  holiday: [],
};

let projectsSnapshotKey: string | null | undefined;
let projectsSnapshot: Project[] = EMPTY_PROJECTS;

let shiftsSnapshotKey: string | null | undefined;
let shiftsSnapshot: Shift[] = EMPTY_SHIFTS;

let shiftTemplatesSnapshotKey: string | null | undefined;
let shiftTemplatesSnapshot: ShiftTemplate[] =
  EMPTY_SHIFT_TEMPLATES;

let themeSnapshotKey: string | null | undefined;
let themeSnapshot: ThemeSettings = DEFAULT_THEME;

let memosSnapshotKey: string | null | undefined;
let memosSnapshot: Memo[] = EMPTY_MEMOS;

let timelineSnapshotKey: string | null | undefined;
let timelineSnapshot: TimelinePlan = EMPTY_TIMELINE;

function invalidateStorageSnapshots() {
  projectsSnapshotKey = undefined;
  projectsSnapshot = EMPTY_PROJECTS;
  shiftsSnapshotKey = undefined;
  shiftsSnapshot = EMPTY_SHIFTS;
  shiftTemplatesSnapshotKey = undefined;
  shiftTemplatesSnapshot = EMPTY_SHIFT_TEMPLATES;
  themeSnapshotKey = undefined;
  themeSnapshot = DEFAULT_THEME;
  memosSnapshotKey = undefined;
  memosSnapshot = EMPTY_MEMOS;
  timelineSnapshotKey = undefined;
  timelineSnapshot = EMPTY_TIMELINE;
}

/** 案件イメージカラーの初期値（UIアクセントとは別） */
export const DEFAULT_PROJECT_COLOR =
  "#7dd3fc";

/** 案件色は #RRGGBB のみ。不正値は DEFAULT_PROJECT_COLOR に置換 */
export function normalizeProjectColor(
  color: unknown
): string {
  if (typeof color !== "string") {
    return DEFAULT_PROJECT_COLOR;
  }

  return (
    normalizeHex(color) ??
    DEFAULT_PROJECT_COLOR
  );
}

export function normalizeTask(
  raw: unknown
): Task {
  const task = raw as Record<string, unknown>;

  return {
    id: String(
      task?.id ?? crypto.randomUUID()
    ),

    title:
      typeof task?.title === "string"
        ? task.title
        : "",

    completed: Boolean(
      task?.completed ?? task?.done
    ),
  };
}

export function normalizeScheduleSlot(
  raw: unknown
): ScheduleSlot {
  const slot = raw as Record<string, unknown>;

  const normalized: ScheduleSlot = {
    id: String(
      slot?.id ?? crypto.randomUUID()
    ),
    date:
      typeof slot?.date === "string"
        ? slot.date
        : "",
  };

  if (typeof slot?.taskId === "string") {
    normalized.taskId = slot.taskId;
  }

  return normalized;
}

export function normalizeProject(
  raw: unknown
): Project {
  const project = raw as Record<
    string,
    unknown
  >;

  const tasksRaw = Array.isArray(
    project?.tasks
  )
    ? project.tasks
    : [];

  const tasks = tasksRaw.map(normalizeTask);

  let schedule: ScheduleSlot[];

  if (Array.isArray(project?.schedule)) {
    schedule = project.schedule.map(
      normalizeScheduleSlot
    );
  } else {
    // 旧 Task.date → ScheduleSlot へのマイグレーション
    schedule = [];

    for (let i = 0; i < tasksRaw.length; i++) {
      const rawTask = tasksRaw[i] as Record<
        string,
        unknown
      >;
      const date =
        typeof rawTask?.date === "string"
          ? rawTask.date
          : "";

      if (date === "") {
        continue;
      }

      schedule.push({
        id: crypto.randomUUID(),
        date,
        taskId: tasks[i].id,
      });
    }
  }

  return {
    id: String(
      project?.id ?? crypto.randomUUID()
    ),

    title:
      typeof project?.title === "string"
        ? project.title
        : "",

    client:
      typeof project?.client === "string"
        ? project.client
        : "",

    color: normalizeProjectColor(
      project?.color
    ),

    deadline:
      typeof project?.deadline ===
      "string"
        ? project.deadline
        : "",

    tasks,

    schedule,

    manualCompleted:
      typeof project?.manualCompleted === "boolean"
        ? project.manualCompleted
        : undefined,
  };
}

export function normalizeShiftTemplate(
  raw: unknown
): ShiftTemplate {
  const template = raw as Record<string, unknown>;

  const kind =
    template?.kind === "schedule"
      ? "schedule"
      : "work";

  return {
    id: String(
      template?.id ?? crypto.randomUUID()
    ),
    name:
      typeof template?.name === "string"
        ? template.name
        : "",
    start:
      typeof template?.start === "string"
        ? template.start
        : "",
    end:
      typeof template?.end === "string"
        ? template.end
        : "",
    kind,
  };
}

export function normalizeShift(
  raw: unknown,
  templates: ShiftTemplate[] = []
): Shift {
  const shift = raw as Record<string, unknown>;
  const templateId = String(
    shift?.templateId ?? ""
  );

  let kind: ShiftTemplateKind =
    shift?.kind === "schedule"
      ? "schedule"
      : "work";

  if (
    shift?.kind !== "schedule" &&
    shift?.kind !== "work"
  ) {
    const template = templates.find(
      (item) => item.id === templateId
    );

    if (template) {
      kind =
        template.kind === "schedule"
          ? "schedule"
          : "work";
    }
  }

  return {
    date:
      typeof shift?.date === "string"
        ? shift.date
        : "",
    templateId,
    kind,
  };
}

function normalizeTimelineSlot(
  raw: unknown
): TimelineSlot {
  const slot = raw as Record<string, unknown>;
  const minutesRaw = slot?.minutes;
  const minutes =
    typeof minutesRaw === "number" &&
    Number.isFinite(minutesRaw)
      ? Math.max(0, Math.floor(minutesRaw))
      : 0;

  const endRaw = slot?.endMinutes;
  const endMinutes =
    typeof endRaw === "number" &&
    Number.isFinite(endRaw)
      ? Math.max(0, Math.floor(endRaw))
      : undefined;

  const normalizedEnd =
    endMinutes !== undefined &&
    endMinutes > minutes
      ? Math.min(24 * 60, endMinutes)
      : undefined;

  return {
    id: String(
      slot?.id ?? crypto.randomUUID()
    ),
    minutes: Math.min(23 * 60 + 59, minutes),
    ...(normalizedEnd !== undefined
      ? { endMinutes: normalizedEnd }
      : {}),
    label:
      typeof slot?.label === "string"
        ? slot.label
        : "",
  };
}

export function normalizeTimeline(
  raw: unknown
): TimelinePlan {
  const plan = raw as Record<string, unknown> | null;

  if (!plan || typeof plan !== "object") {
    return {
      weekday: [],
      holiday: [],
    };
  }

  return {
    weekday: Array.isArray(plan.weekday)
      ? plan.weekday.map(normalizeTimelineSlot)
      : [],
    holiday: Array.isArray(plan.holiday)
      ? plan.holiday.map(normalizeTimelineSlot)
      : [],
  };
}

/* =========================
   Projects
========================= */

export function getProjects(): Project[] {

  if (
    typeof window ===
    "undefined"
  ) {
    return EMPTY_PROJECTS;
  }

  const data =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (data === projectsSnapshotKey) {
    return projectsSnapshot;
  }

  projectsSnapshotKey = data;

  if (!data) {
    projectsSnapshot = EMPTY_PROJECTS;
    return projectsSnapshot;
  }

  try {
    const parsed = JSON.parse(data);

    if (!Array.isArray(parsed)) {
      projectsSnapshot = EMPTY_PROJECTS;
      return projectsSnapshot;
    }

    projectsSnapshot = parsed.map(normalizeProject);
    return projectsSnapshot;
  } catch {
    projectsSnapshot = EMPTY_PROJECTS;
    return projectsSnapshot;
  }
}

export function saveProjects(
  projects: Project[]
) {
  const normalized =
    projects.map(normalizeProject);
  const json = JSON.stringify(normalized);

  localStorage.setItem(
    STORAGE_KEY,
    json
  );

  projectsSnapshotKey = json;
  projectsSnapshot = normalized;
}

export function addProject(
  project: Project
) {

  const projects =
    [...getProjects()];

  projects.unshift(
    normalizeProject(project)
  );

  saveProjects(projects);
}

export function updateProject(
  updated: Project
) {

  const projects =
    [...getProjects()];

  const normalized =
    normalizeProject(updated);

  const newProjects =
    projects.map((project) =>
      project.id === normalized.id
        ? normalized
        : project
    );

  saveProjects(newProjects);
}

/* =========================
   Shift Templates
========================= */

export function getShiftTemplates(): ShiftTemplate[] {

  if (
    typeof window ===
    "undefined"
  ) {
    return EMPTY_SHIFT_TEMPLATES;
  }

  const data =
    localStorage.getItem(
      SHIFT_TEMPLATE_KEY
    );

  if (data === shiftTemplatesSnapshotKey) {
    return shiftTemplatesSnapshot;
  }

  shiftTemplatesSnapshotKey = data;

  if (!data) {
    shiftTemplatesSnapshot = EMPTY_SHIFT_TEMPLATES;
    return shiftTemplatesSnapshot;
  }

  try {
    const parsed = JSON.parse(data);

    if (!Array.isArray(parsed)) {
      shiftTemplatesSnapshot = EMPTY_SHIFT_TEMPLATES;
      return shiftTemplatesSnapshot;
    }

    shiftTemplatesSnapshot = parsed.map(
      normalizeShiftTemplate
    );
    return shiftTemplatesSnapshot;
  } catch {
    shiftTemplatesSnapshot = EMPTY_SHIFT_TEMPLATES;
    return shiftTemplatesSnapshot;
  }
}

export function saveShiftTemplates(
  templates: ShiftTemplate[]
) {
  const normalized = templates.map(
    normalizeShiftTemplate
  );
  const json = JSON.stringify(normalized);

  localStorage.setItem(
    SHIFT_TEMPLATE_KEY,
    json
  );

  shiftTemplatesSnapshotKey = json;
  shiftTemplatesSnapshot = normalized;

  notifyShiftsChanged();
}

/* =========================
   Shifts
========================= */

export function getShifts(): Shift[] {

  if (
    typeof window ===
    "undefined"
  ) {
    return EMPTY_SHIFTS;
  }

  const data =
    localStorage.getItem(
      SHIFT_KEY
    );

  if (data === shiftsSnapshotKey) {
    return shiftsSnapshot;
  }

  shiftsSnapshotKey = data;

  if (!data) {
    shiftsSnapshot = EMPTY_SHIFTS;
    return shiftsSnapshot;
  }

  try {
    const parsed = JSON.parse(data);
    const templates = getShiftTemplates();

    if (!Array.isArray(parsed)) {
      shiftsSnapshot = EMPTY_SHIFTS;
      return shiftsSnapshot;
    }

    shiftsSnapshot = parsed.map((item) =>
      normalizeShift(item, templates)
    );
    return shiftsSnapshot;
  } catch {
    shiftsSnapshot = EMPTY_SHIFTS;
    return shiftsSnapshot;
  }
}

export function saveShifts(
  shifts: Shift[]
) {
  const templates = getShiftTemplates();
  const normalized = shifts.map((item) =>
    normalizeShift(item, templates)
  );
  const json = JSON.stringify(normalized);

  localStorage.setItem(
    SHIFT_KEY,
    json
  );

  shiftsSnapshotKey = json;
  shiftsSnapshot = normalized;

  notifyShiftsChanged();
}

/* =========================
   Theme
========================= */

export function getTheme(): ThemeSettings {

  if (
    typeof window ===
    "undefined"
  ) {
    return DEFAULT_THEME;
  }

  const data =
    localStorage.getItem(
      THEME_KEY
    );

  if (data === themeSnapshotKey) {
    return themeSnapshot;
  }

  themeSnapshotKey = data;

  if (!data) {
    themeSnapshot = DEFAULT_THEME;
    return themeSnapshot;
  }

  try {

    const parsed = JSON.parse(data);

    themeSnapshot = {
      ...defaultTheme,
      ...parsed,
      colorMode: normalizeColorMode(
        parsed.colorMode
      ),
      customBackgroundImages:
        normalizeCustomBackgroundImages(
          parsed.customBackgroundImages
        ),
      monthDisplayMode:
        normalizeMonthDisplayMode(
          parsed.monthDisplayMode
        ),
    };

    return themeSnapshot;

  } catch {

    themeSnapshot = DEFAULT_THEME;
    return themeSnapshot;
  }
}

export function saveTheme(
  theme: ThemeSettings
) {
  const normalized: ThemeSettings = {
    ...defaultTheme,
    ...theme,
    colorMode: normalizeColorMode(
      theme.colorMode
    ),
    customBackgroundImages:
      normalizeCustomBackgroundImages(
        theme.customBackgroundImages
      ),
    monthDisplayMode:
      normalizeMonthDisplayMode(
        theme.monthDisplayMode
      ),
  };

  const json = JSON.stringify(normalized);

  localStorage.setItem(
    THEME_KEY,
    json
  );

  themeSnapshotKey = json;
  themeSnapshot = normalized;

  applyColorModeClass(
    normalized.colorMode
  );
  notifyThemeChange(normalized);
}

/* =========================
   Memos
========================= */

function clampImportance(value: unknown): number {
  return normalizeMemoImportance(value);
}

export function normalizeMemo(
  raw: unknown
): Memo {
  const memo = raw as Record<string, unknown>;
  const now = new Date().toISOString();

  return {
    id: String(
      memo?.id ?? crypto.randomUUID()
    ),

    title:
      typeof memo?.title === "string"
        ? memo.title
        : "",

    content:
      typeof memo?.content === "string"
        ? memo.content
        : "",

    date:
      typeof memo?.date === "string"
        ? memo.date
        : "",

    importance: clampImportance(
      memo?.importance
    ),

    isCompleted: Boolean(
      memo?.isCompleted ?? memo?.completed
    ),

    createdAt:
      typeof memo?.createdAt === "string"
        ? memo.createdAt
        : now,

    updatedAt:
      typeof memo?.updatedAt === "string"
        ? memo.updatedAt
        : now,
  };
}

export function getMemos(): Memo[] {
  if (typeof window === "undefined") {
    return EMPTY_MEMOS;
  }

  const data =
    localStorage.getItem(MEMOS_KEY);

  if (data === memosSnapshotKey) {
    return memosSnapshot;
  }

  memosSnapshotKey = data;

  if (!data) {
    memosSnapshot = EMPTY_MEMOS;
    return memosSnapshot;
  }

  try {
    const parsed = JSON.parse(data);

    if (!Array.isArray(parsed)) {
      memosSnapshot = EMPTY_MEMOS;
      return memosSnapshot;
    }

    memosSnapshot = parsed.map(normalizeMemo);
    return memosSnapshot;
  } catch {
    memosSnapshot = EMPTY_MEMOS;
    return memosSnapshot;
  }
}

export function saveMemos(memos: Memo[]) {
  const normalized = memos.map(normalizeMemo);
  const json = JSON.stringify(normalized);

  localStorage.setItem(MEMOS_KEY, json);

  memosSnapshotKey = json;
  memosSnapshot = normalized;
}

/* =========================
   Timeline
========================= */

export function getTimeline(): TimelinePlan {
  if (typeof window === "undefined") {
    return EMPTY_TIMELINE;
  }

  const data =
    localStorage.getItem(TIMELINE_KEY);

  if (data === timelineSnapshotKey) {
    return timelineSnapshot;
  }

  timelineSnapshotKey = data;

  if (!data) {
    timelineSnapshot = EMPTY_TIMELINE;
    return timelineSnapshot;
  }

  try {
    const parsed = JSON.parse(data);
    timelineSnapshot = normalizeTimeline(parsed);
    return timelineSnapshot;
  } catch {
    timelineSnapshot = EMPTY_TIMELINE;
    return timelineSnapshot;
  }
}

export function saveTimeline(
  plan: TimelinePlan
) {
  const normalized = normalizeTimeline(plan);
  const json = JSON.stringify(normalized);

  localStorage.setItem(TIMELINE_KEY, json);

  timelineSnapshotKey = json;
  timelineSnapshot = normalized;

  notifyTimelineChanged();
}

/* =========================
   Backup Export
========================= */

export function createBackupData(): BackupData {

  return {
    version:
      BACKUP_VERSION,

    exportedAt:
      new Date().toISOString(),

    projects:
      getProjects(),

    shifts:
      getShifts(),

    shiftTemplates:
      getShiftTemplates(),

    memos: getMemos(),

    theme: getTheme(),

    timeline: getTimeline(),
  };
}

export function exportBackup() {

  const backup =
    createBackupData();

  const blob = new Blob(
    [
      JSON.stringify(
        backup,
        null,
        2
      ),
    ],
    {
      type:
        "application/json",
    }
  );

  const url =
    URL.createObjectURL(
      blob
    );

  const a =
    document.createElement(
      "a"
    );

  const date =
    new Date()
      .toISOString()
      .split("T")[0];

  a.href = url;

  a.download =
    "atelier-flow-backup-" +
    date +
    ".json";

  document.body.appendChild(
    a
  );

  a.click();

  document.body.removeChild(
    a
  );

  URL.revokeObjectURL(
    url
  );
}

/* =========================
   Backup Validation
========================= */

function isValidBackupData(
  data: unknown
): data is BackupData {
  const d = data as Record<string, unknown> | null;

  return (
    typeof d ===
      "object" &&

    d !== null &&

    typeof d.version ===
      "number" &&

    Array.isArray(
      d.projects
    ) &&

    Array.isArray(
      d.shifts
    ) &&

    Array.isArray(
      d.shiftTemplates
    )
  );
}

function normalizeBackupMemos(
  data: BackupData
): Memo[] {
  if (!Array.isArray(data.memos)) {
    return [];
  }

  return data.memos.map(normalizeMemo);
}

/* =========================
   Backup Import
========================= */

export async function importBackupFile(
  file: File
): Promise<{
  success: boolean;
  message: string;
}> {

  try {

    const text =
      await file.text();

    const parsed =
      JSON.parse(text);

    if (
      !isValidBackupData(
        parsed
      )
    ) {

      return {
        success: false,
        message:
          "バックアップ形式が不正です",
      };
    }

    saveProjects(
      parsed.projects
    );

    saveShifts(
      parsed.shifts
    );

    saveShiftTemplates(
      parsed.shiftTemplates
    );

    saveMemos(
      normalizeBackupMemos(parsed)
    );

    if (parsed.theme) {
      saveTheme({
        ...defaultTheme,
        ...parsed.theme,
        colorMode: normalizeColorMode(
          parsed.theme.colorMode
        ),
        customBackgroundImages:
          normalizeCustomBackgroundImages(
            parsed.theme.customBackgroundImages
          ),
        monthDisplayMode:
          normalizeMonthDisplayMode(
            parsed.theme.monthDisplayMode
          ),
      });
    }

    if (parsed.timeline) {
      saveTimeline(
        normalizeTimeline(parsed.timeline)
      );
    }

    return {
      success: true,
      message:
        "バックアップを復元しました",
    };

  } catch {

    return {
      success: false,
      message:
        "バックアップの読み込みに失敗しました",
    };
  }
}

export function invalidateStorageCacheFromEvent(
  key: string | null
) {
  if (key === STORAGE_KEY || key === null) {
    projectsSnapshotKey = null;
  }

  if (key === MEMOS_KEY || key === null) {
    memosSnapshotKey = null;
  }

  if (key === TIMELINE_KEY || key === null) {
    timelineSnapshotKey = null;
  }
}

/* =========================
   Clear All Data
========================= */

export function clearAllData() {

  localStorage.removeItem(
    STORAGE_KEY
  );

  localStorage.removeItem(
    SHIFT_TEMPLATE_KEY
  );

  localStorage.removeItem(
    SHIFT_KEY
  );

  localStorage.removeItem(
    THEME_KEY
  );

  localStorage.removeItem(
    ONBOARDING_KEY
  );

  localStorage.removeItem(
    MEMOS_KEY
  );

  localStorage.removeItem(
    TIMELINE_KEY
  );

  for (const key of PREF_KEYS) {
    localStorage.removeItem(key);
  }

  invalidateStorageSnapshots();
  notifyShiftsChanged();
  notifyTimelineChanged();
  applyColorModeClass(DEFAULT_THEME.colorMode);
  notifyThemeChange(DEFAULT_THEME);
}
