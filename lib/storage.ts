import { normalizeHex } from "./colorFormat";

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
};

const STORAGE_KEY =
  "atelier-flow-projects";

const SHIFT_TEMPLATE_KEY =
  "atelier-flow-shift-templates";

const SHIFT_KEY =
  "atelier-flow-shifts";

const THEME_KEY =
  "atelier-flow-theme";

const BACKUP_VERSION = 1;

const defaultTheme: ThemeSettings = {
  background: "#f7f7f5",
  accent: "#38bdf8",
  backgroundImage: "",
};

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
    return [];
  }

  const data =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!data) {
    return [];
  }

  try {
    const parsed = JSON.parse(data);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizeProject);
  } catch {
    return [];
  }
}

export function saveProjects(
  projects: Project[]
) {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      projects.map(normalizeProject)
    )
  );
}

export function addProject(
  project: Project
) {

  const projects =
    getProjects();

  projects.unshift(
    normalizeProject(project)
  );

  saveProjects(projects);
}

export function updateProject(
  updated: Project
) {

  const projects =
    getProjects();

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
    return [];
  }

  const data =
    localStorage.getItem(
      SHIFT_TEMPLATE_KEY
    );

  if (!data) {
    return [];
  }

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveShiftTemplates(
  templates: ShiftTemplate[]
) {

  localStorage.setItem(
    SHIFT_TEMPLATE_KEY,
    JSON.stringify(templates)
  );
}

/* =========================
   Shifts
========================= */

export function getShifts(): Shift[] {

  if (
    typeof window ===
    "undefined"
  ) {
    return [];
  }

  const data =
    localStorage.getItem(
      SHIFT_KEY
    );

  if (!data) {
    return [];
  }

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveShifts(
  shifts: Shift[]
) {

  localStorage.setItem(
    SHIFT_KEY,
    JSON.stringify(shifts)
  );
}

/* =========================
   Theme
========================= */

export function getTheme(): ThemeSettings {

  if (
    typeof window ===
    "undefined"
  ) {
    return defaultTheme;
  }

  const data =
    localStorage.getItem(
      THEME_KEY
    );

  if (!data) {
    return defaultTheme;
  }

  try {

    return {
      ...defaultTheme,
      ...JSON.parse(data),
    };

  } catch {

    return defaultTheme;
  }
}

export function saveTheme(
  theme: ThemeSettings
) {

  localStorage.setItem(
    THEME_KEY,
    JSON.stringify(theme)
  );
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
  data: any
): data is BackupData {

  return (
    typeof data ===
      "object" &&

    data !== null &&

    typeof data.version ===
      "number" &&

    Array.isArray(
      data.projects
    ) &&

    Array.isArray(
      data.shifts
    ) &&

    Array.isArray(
      data.shiftTemplates
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
}