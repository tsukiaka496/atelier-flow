import { getTargetVisibleRatio } from "@/lib/tutorialPositioning";

export function isTargetInteractive(
  element: HTMLElement
): boolean {
  if (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLOptionElement ||
    element instanceof HTMLFieldSetElement
  ) {
    if (element.disabled) {
      return false;
    }
  }

  if (
    element.getAttribute("aria-disabled") === "true"
  ) {
    return false;
  }

  const style = window.getComputedStyle(element);

  if (
    style.display === "none" ||
    style.visibility === "hidden"
  ) {
    return false;
  }

  if (parseFloat(style.opacity) <= 0) {
    return false;
  }

  if (style.pointerEvents === "none") {
    return false;
  }

  const rect = element.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }

  return true;
}

export function findInteractiveTarget(
  selector: string
): HTMLElement | null {
  const nodes = document.querySelectorAll(selector);
  let best: HTMLElement | null = null;
  let bestRatio = -1;

  nodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return;
    }

    if (!isTargetInteractive(node)) {
      return;
    }

    const ratio = getTargetVisibleRatio(node);

    if (ratio > bestRatio) {
      best = node;
      bestRatio = ratio;
    }
  });

  return best;
}
