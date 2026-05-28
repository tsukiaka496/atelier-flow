import { resolveTourTarget } from "@/lib/tutorialTargetIdentity";

export function waitForElement(
  selector: string,
  callback: (el: HTMLElement) => void,
  onTimeout?: () => void,
  maxFrames = 60
) {
  let frame = 0;

  const tick = () => {
    const el = resolveTourTarget(selector);

    if (el) {
      callback(el);
      return;
    }

    frame++;

    if (frame < maxFrames) {
      window.requestAnimationFrame(tick);
      return;
    }

    onTimeout?.();
  };

  tick();
}
