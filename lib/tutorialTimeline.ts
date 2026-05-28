type TimelineEntry = {
  ts: number;
  event: string;
  detail?: string;
};

const MAX_ENTRIES = 30;

const timeline: TimelineEntry[] = [];

export function logTutorialTimeline(
  event: string,
  detail?: string
) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  timeline.unshift({
    ts: Date.now(),
    event,
    detail,
  });

  if (timeline.length > MAX_ENTRIES) {
    timeline.length = MAX_ENTRIES;
  }

  console.log(
    `[tutorial timeline] ${event}`,
    detail ?? ""
  );
}

export function getTutorialTimeline(): TimelineEntry[] {
  return [...timeline];
}

export function clearTutorialTimeline() {
  timeline.length = 0;
}
