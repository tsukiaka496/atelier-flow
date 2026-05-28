type MeasurementJob = () => void;

let scheduled = false;
let frameId = 0;
const queue: MeasurementJob[] = [];

export function enqueueMeasurement(
  job: MeasurementJob
) {
  queue.push(job);

  if (scheduled) {
    return;
  }

  scheduled = true;

  frameId = window.requestAnimationFrame(() => {
    scheduled = false;
    frameId = 0;

    const jobs = queue.splice(0, queue.length);

    for (const run of jobs) {
      run();
    }
  });
}

export function cancelMeasurementQueue() {
  queue.length = 0;

  if (frameId) {
    cancelAnimationFrame(frameId);
    frameId = 0;
  }

  scheduled = false;
}
