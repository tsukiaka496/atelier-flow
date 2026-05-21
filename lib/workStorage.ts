export type Work = {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
};

const KEY = "atelier_works";

export function getWorks(): Work[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveWorks(works: Work[]) {
  localStorage.setItem(KEY, JSON.stringify(works));
}