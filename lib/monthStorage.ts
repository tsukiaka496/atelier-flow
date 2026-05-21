export type DaySchedule = {
  date: string;
  type: "バイト" | "仕事" | "休み";
  label: string;
};

const STORAGE_KEY =
  "atelier-flow-schedules";

export function getSchedules(): DaySchedule[] {
  if (typeof window === "undefined") {
    return [];
  }

  const data =
    localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return [];
  }

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveSchedules(
  schedules: DaySchedule[]
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(schedules)
  );
}