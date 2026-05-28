import { normalizeHex } from "./colorFormat";
import {
  applyColorModeClass,
  normalizeColorMode,
  notifyThemeChange,
} from "@/lib/colorMode";
import {
  normalizeCustomBackgroundImages,
} from "@/lib/themeBackgrounds";
import { endTutorialSession } from "@/lib/tutorialSession";

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  date: string;
};

export type Project = {
  id: string;
  title: string;
  client: string;
  color: string;
  deadline: string;
  tasks: Task[];
  /** チュートリアルで作成した案件（将来の除外/分析用） */
  isTutorial?: boolean;
};

export type ShiftTemplate = {
  id: string;
  name: string;
  start: string;
  end: string;
};

export type Shift = {
  date: string;
  templateId: string;
};

export type BackupData = {
  version: number;
  exportedAt: string;
  projects: Project[];
  shifts: Shift[];
  shiftTemplates: ShiftTemplate[];
  /** 旧バックアップとの互換のため省略可 */
  theme?: ThemeSettings;
};

export type ThemeSettings = {
  background: string;
  accent: string;
  backgroundImage: string;
  colorMode?: "light" | "dark";
  /** data URL で保存するユーザー追加の背景画像 */
  customBackgroundImages?: string[];
};

export type HintMode =
  | "first-run"
  | "always"
  | "off";

export type OnboardingSettings = {
  tutorialCompleted: boolean;
  tutorialCompletedAt?: string;
  hintMode: HintMode;
  tutorialVersion?: number;
};

const STORAGE_KEY =
  "atelier-flow-projects";

const SHIFT_TEMPLATE_KEY =
  "atelier-flow-shift-templates";

const SHIFT_KEY =
  "atelier-flow-shifts";

const THEME_KEY =
  "atelier-flow-theme";

const ONBOARDING_KEY =
  "atelier-flow-onboarding";

const ONBOARDING_CHANGED_EVENT =
  "atelier-flow:onboarding-changed";

const BACKUP_VERSION = 1;

const SHIFTS_CHANGED_EVENT =
  "atelier-flow:shifts-changed";

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

const defaultTheme: ThemeSettings = {
  background: "#f7f7f5",
  accent: "#38bdf8",
  backgroundImage: "",
  colorMode: "light",
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

const defaultOnboarding: OnboardingSettings =
  {
    tutorialCompleted: false,
    hintMode: "first-run",
    tutorialVersion: 1,
  };

export function getDefaultOnboarding(): OnboardingSettings {
  return defaultOnboarding;
}

export const EMPTY_PROJECTS: Project[] = [];
export const EMPTY_SHIFTS: Shift[] = [];
export const EMPTY_SHIFT_TEMPLATES: ShiftTemplate[] = [];

let projectsSnapshotKey: string | null | undefined;
let projectsSnapshot: Project[] = EMPTY_PROJECTS;

let shiftsSnapshotKey: string | null | undefined;
let shiftsSnapshot: Shift[] = EMPTY_SHIFTS;

let shiftTemplatesSnapshotKey: string | null | undefined;
let shiftTemplatesSnapshot: ShiftTemplate[] =
  EMPTY_SHIFT_TEMPLATES;

let themeSnapshotKey: string | null | undefined;
let themeSnapshot: ThemeSettings = DEFAULT_THEME;

let onboardingSnapshotKey: string | null | undefined;
let onboardingSnapshot: OnboardingSettings =
  defaultOnboarding;

function invalidateStorageSnapshots() {
  projectsSnapshotKey = undefined;
  projectsSnapshot = EMPTY_PROJECTS;
  shiftsSnapshotKey = undefined;
  shiftsSnapshot = EMPTY_SHIFTS;
  shiftTemplatesSnapshotKey = undefined;
  shiftTemplatesSnapshot = EMPTY_SHIFT_TEMPLATES;
  themeSnapshotKey = undefined;
  themeSnapshot = DEFAULT_THEME;
  onboardingSnapshotKey = undefined;
  onboardingSnapshot = defaultOnboarding;
}

function notifyOnboardingChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(ONBOARDING_CHANGED_EVENT)
  );
}

export function subscribeOnboardingChanged(
  onChange: () => void
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(
    ONBOARDING_CHANGED_EVENT,
    onChange
  );

  return () => {
    window.removeEventListener(
      ONBOARDING_CHANGED_EVENT,
      onChange
    );
  };
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

    date:
      typeof task?.date === "string"
        ? task.date
        : "",
  };
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

    tasks: tasksRaw.map(normalizeTask),

    isTutorial:
      typeof project?.isTutorial === "boolean"
        ? project.isTutorial
        : undefined,
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
    shiftTemplatesSnapshot = JSON.parse(data);
    return shiftTemplatesSnapshot;
  } catch {
    shiftTemplatesSnapshot = EMPTY_SHIFT_TEMPLATES;
    return shiftTemplatesSnapshot;
  }
}

export function saveShiftTemplates(
  templates: ShiftTemplate[]
) {
  const json = JSON.stringify(templates);

  localStorage.setItem(
    SHIFT_TEMPLATE_KEY,
    json
  );

  shiftTemplatesSnapshotKey = json;
  shiftTemplatesSnapshot = templates;

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
    shiftsSnapshot = JSON.parse(data);
    return shiftsSnapshot;
  } catch {
    shiftsSnapshot = EMPTY_SHIFTS;
    return shiftsSnapshot;
  }
}

export function saveShifts(
  shifts: Shift[]
) {
  const json = JSON.stringify(shifts);

  localStorage.setItem(
    SHIFT_KEY,
    json
  );

  shiftsSnapshotKey = json;
  shiftsSnapshot = shifts;

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
   Onboarding
========================= */

export function getOnboarding(): OnboardingSettings {

  if (
    typeof window ===
    "undefined"
  ) {
    return defaultOnboarding;
  }

  const data =
    localStorage.getItem(
      ONBOARDING_KEY
    );

  if (data === onboardingSnapshotKey) {
    return onboardingSnapshot;
  }

  onboardingSnapshotKey = data;

  if (!data) {
    onboardingSnapshot = defaultOnboarding;
    return onboardingSnapshot;
  }

  try {
    const parsed = JSON.parse(data);

    onboardingSnapshot = {
      ...defaultOnboarding,
      ...parsed,
    };

    return onboardingSnapshot;
  } catch {
    onboardingSnapshot = defaultOnboarding;
    return onboardingSnapshot;
  }
}

export function saveOnboarding(
  settings: OnboardingSettings
) {
  const json = JSON.stringify(settings);

  localStorage.setItem(
    ONBOARDING_KEY,
    json
  );

  onboardingSnapshotKey = json;
  onboardingSnapshot = {
    ...defaultOnboarding,
    ...settings,
  };

  notifyOnboardingChanged();
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

    theme: getTheme(),
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
      });
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

  invalidateStorageSnapshots();
  endTutorialSession();
  notifyShiftsChanged();
  applyColorModeClass(DEFAULT_THEME.colorMode);
  notifyThemeChange(DEFAULT_THEME);
  notifyOnboardingChanged();
}