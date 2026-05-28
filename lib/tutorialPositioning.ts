export type BoxRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type SafeAreaInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type ViewportObstacle = BoxRect & {
  kind: string;
};

export type TooltipPlacement =
  | "bottom"
  | "top"
  | "left"
  | "right";

export type TooltipLayoutDebug = {
  placement: TooltipPlacement;
  collisionDetected: boolean;
  viewportObstacles: ViewportObstacle[];
  targetVisibleRatio: number;
  compactMode: boolean;
  tooltipWidth: number;
};

export type TooltipLayoutResult = {
  top: number;
  left: number;
  width: number;
  height: number;
  placement: TooltipPlacement;
  compactMode: boolean;
  collisionDetected: boolean;
  arrowOffsetX: number;
  arrowSide: TooltipPlacement;
  debug: TooltipLayoutDebug;
};

const TOOLTIP_GAP = 12;
const MIN_TARGET_VISIBLE_RATIO = 0.95;
const SCROLL_MARGIN_TOP = 120;
const SCROLL_MARGIN_BOTTOM = 180;
const BOTTOM_UI_CLEARANCE = 24;
const TOP_UI_CLEARANCE = 56;

const WIDTH_CANDIDATES = [320, 280, 240] as const;

let safeAreaProbe: HTMLDivElement | null = null;

function readSafeAreaInsets(): SafeAreaInsets {
  if (typeof document === "undefined") {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  if (!safeAreaProbe) {
    safeAreaProbe = document.createElement("div");
    safeAreaProbe.style.cssText =
      "position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);";
    document.body.appendChild(safeAreaProbe);
  }

  const style = window.getComputedStyle(safeAreaProbe);

  return {
    top: parseFloat(style.paddingTop) || 0,
    right: parseFloat(style.paddingRight) || 0,
    bottom: parseFloat(style.paddingBottom) || 0,
    left: parseFloat(style.paddingLeft) || 0,
  };
}

function getVisualViewportBox(): BoxRect {
  const viewport = window.visualViewport;

  if (!viewport) {
    return {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  return {
    top: viewport.offsetTop,
    left: viewport.offsetLeft,
    width: viewport.width,
    height: viewport.height,
  };
}

function getElementBox(
  element: Element
): BoxRect | null {
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  const box = element.getBoundingClientRect();

  return {
    top: box.top,
    left: box.left,
    width: box.width,
    height: box.height,
  };
}

function isFixedLike(
  element: HTMLElement
): boolean {
  const style = window.getComputedStyle(element);

  return (
    style.position === "fixed" ||
    style.position === "sticky"
  );
}

export function getViewportObstacles(
  targetRect: BoxRect | null
): ViewportObstacle[] {
  const obstacles: ViewportObstacle[] = [];
  const safeArea = readSafeAreaInsets();
  const viewport = getVisualViewportBox();

  obstacles.push({
    kind: "safe-area-top",
    top: viewport.top,
    left: viewport.left,
    width: viewport.width,
    height: safeArea.top,
  });

  obstacles.push({
    kind: "safe-area-bottom",
    top:
      viewport.top +
      viewport.height -
      safeArea.bottom,
    left: viewport.left,
    width: viewport.width,
    height: safeArea.bottom,
  });

  const keyboardHeight = Math.max(
    0,
    window.innerHeight -
      viewport.top -
      viewport.height
  );

  if (keyboardHeight > 0) {
    obstacles.push({
      kind: "keyboard",
      top: viewport.top + viewport.height,
      left: viewport.left,
      width: viewport.width,
      height: keyboardHeight,
    });
  }

  const tourNodes = document.querySelectorAll(
    "[data-tour]"
  );

  tourNodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return;
    }

    const tourId = node.getAttribute("data-tour");

    if (!tourId?.startsWith("nav-")) {
      return;
    }

    let fixedParent: HTMLElement | null = node;

    while (fixedParent && !isFixedLike(fixedParent)) {
      fixedParent = fixedParent.parentElement;
    }

    const box = getElementBox(
      fixedParent ?? node
    );

    if (!box) {
      return;
    }

    obstacles.push({
      kind: `fixed-ui:${tourId}`,
      ...box,
    });
  });

  document
    .querySelectorAll(
      '[role="dialog"], .fixed.inset-0, [class*="fixed"][class*="bottom-"]'
    )
    .forEach((node) => {
      if (!(node instanceof HTMLElement)) {
        return;
      }

      if (node.closest(".tutorial-overlay-root")) {
        return;
      }

      if (!isFixedLike(node)) {
        return;
      }

      const box = getElementBox(node);

      if (!box || box.height <= 0 || box.width <= 0) {
        return;
      }

      obstacles.push({
        kind: "fixed-layer",
        ...box,
      });
    });

  if (targetRect) {
    obstacles.push({
      kind: "target",
      ...targetRect,
    });
  }

  return obstacles;
}

function rectsOverlap(
  a: BoxRect,
  b: BoxRect,
  gap = 0
): boolean {
  return !(
    a.left + a.width + gap <= b.left ||
    b.left + b.width + gap <= a.left ||
    a.top + a.height + gap <= b.top ||
    b.top + b.height + gap <= a.top
  );
}

export function doesTooltipOverlapTarget(
  tooltip: BoxRect,
  target: BoxRect,
  gap = 8
): boolean {
  return rectsOverlap(tooltip, target, gap);
}

function fitsInBounds(
  tooltip: BoxRect,
  bounds: BoxRect
): boolean {
  return (
    tooltip.top >= bounds.top &&
    tooltip.left >= bounds.left &&
    tooltip.top + tooltip.height <=
      bounds.top + bounds.height &&
    tooltip.left + tooltip.width <=
      bounds.left + bounds.width
  );
}

function overlapsObstacle(
  tooltip: BoxRect,
  obstacles: ViewportObstacle[],
  gap = 4
): boolean {
  return obstacles.some(
    (obstacle) =>
      obstacle.kind !== "target" &&
      rectsOverlap(tooltip, obstacle, gap)
  );
}

export function getAdaptiveTooltipWidth(
  viewportWidth: number
): number {
  const horizontalPadding = 32 + readSafeAreaInsets().left + readSafeAreaInsets().right;

  for (const width of WIDTH_CANDIDATES) {
    if (width <= viewportWidth - horizontalPadding) {
      return width;
    }
  }

  return Math.max(
    200,
    viewportWidth - horizontalPadding
  );
}

export function estimateTooltipHeight(options: {
  compactMode: boolean;
  targetMissing: boolean;
  hasCta: boolean;
}): number {
  if (options.targetMissing) {
    return 220;
  }

  if (options.compactMode) {
    return 128;
  }

  return options.hasCta ? 168 : 152;
}

export function shouldUseCompactMode(
  targetRect: BoxRect | null
): boolean {
  if (!targetRect) {
    return false;
  }

  const viewport = getLayoutViewportBox();
  const targetCenterY =
    targetRect.top + targetRect.height / 2;
  const distanceFromBottom =
    viewport.top +
    viewport.height -
    (targetRect.top + targetRect.height);

  return (
    distanceFromBottom < 200 ||
    targetCenterY > viewport.top + viewport.height * 0.58
  );
}

function getAvailableBounds(
  obstacles: ViewportObstacle[]
): BoxRect {
  const viewport = getLayoutViewportBox();
  const safeArea = readSafeAreaInsets();

  const top = viewport.top + safeArea.top + 8;
  let left = viewport.left + safeArea.left + 8;
  let bottom =
    viewport.top +
    viewport.height -
    safeArea.bottom -
    8;
  let right =
    viewport.left +
    viewport.width -
    safeArea.right -
    8;

  obstacles.forEach((obstacle) => {
    if (
      obstacle.kind.startsWith("fixed-ui:") ||
      obstacle.kind === "keyboard" ||
      obstacle.kind === "fixed-layer"
    ) {
      if (obstacle.top >= viewport.top + viewport.height * 0.45) {
        bottom = Math.min(bottom, obstacle.top - 8);
      }

      if (obstacle.left >= viewport.left + viewport.width * 0.5) {
        right = Math.min(right, obstacle.left - 8);
      }

      if (obstacle.left + obstacle.width <= viewport.left + viewport.width * 0.35) {
        left = Math.max(left, obstacle.left + obstacle.width + 8);
      }
    }
  });

  return {
    top,
    left,
    width: Math.max(160, right - left),
    height: Math.max(120, bottom - top),
  };
}

function computeCandidatePosition(
  placement: TooltipPlacement,
  targetRect: BoxRect,
  tooltipWidth: number,
  tooltipHeight: number
): BoxRect {
  const targetCenterX =
    targetRect.left + targetRect.width / 2;
  const targetCenterY =
    targetRect.top + targetRect.height / 2;

  switch (placement) {
    case "bottom":
      return {
        top:
          targetRect.top +
          targetRect.height +
          TOOLTIP_GAP,
        left: targetCenterX - tooltipWidth / 2,
        width: tooltipWidth,
        height: tooltipHeight,
      };
    case "top":
      return {
        top:
          targetRect.top -
          tooltipHeight -
          TOOLTIP_GAP,
        left: targetCenterX - tooltipWidth / 2,
        width: tooltipWidth,
        height: tooltipHeight,
      };
    case "left":
      return {
        top: targetCenterY - tooltipHeight / 2,
        left:
          targetRect.left -
          tooltipWidth -
          TOOLTIP_GAP,
        width: tooltipWidth,
        height: tooltipHeight,
      };
    case "right":
      return {
        top: targetCenterY - tooltipHeight / 2,
        left:
          targetRect.left +
          targetRect.width +
          TOOLTIP_GAP,
        width: tooltipWidth,
        height: tooltipHeight,
      };
  }
}

function clampTooltipToBounds(
  tooltip: BoxRect,
  bounds: BoxRect
): BoxRect {
  const maxLeft = bounds.left + bounds.width - tooltip.width;
  const maxTop = bounds.top + bounds.height - tooltip.height;

  return {
    ...tooltip,
    left: Math.min(
      Math.max(bounds.left, tooltip.left),
      Math.max(bounds.left, maxLeft)
    ),
    top: Math.min(
      Math.max(bounds.top, tooltip.top),
      Math.max(bounds.top, maxTop)
    ),
  };
}

function getPlacementOrder(
  preferred: "top" | "bottom" | "auto"
): TooltipPlacement[] {
  if (preferred === "top") {
    return ["top", "bottom", "right", "left"];
  }

  if (preferred === "bottom") {
    return ["bottom", "top", "right", "left"];
  }

  return ["bottom", "top", "left", "right"];
}

function getLayoutViewportBox(): BoxRect {
  return {
    top: 0,
    left: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function getTargetVisibleRatio(
  element: HTMLElement
): number {
  const box = element.getBoundingClientRect();
  const viewport = getLayoutViewportBox();

  const visibleLeft = Math.max(box.left, viewport.left);
  const visibleTop = Math.max(box.top, viewport.top);
  const visibleRight = Math.min(
    box.left + box.width,
    viewport.left + viewport.width
  );
  const visibleBottom = Math.min(
    box.top + box.height,
    viewport.top + viewport.height
  );

  const visibleWidth = Math.max(
    0,
    visibleRight - visibleLeft
  );
  const visibleHeight = Math.max(
    0,
    visibleBottom - visibleTop
  );
  const visibleArea = visibleWidth * visibleHeight;
  const totalArea = box.width * box.height;

  if (totalArea <= 0) {
    return 0;
  }

  return visibleArea / totalArea;
}

export function isTargetFullyVisible(
  element: HTMLElement
): boolean {
  return (
    getTargetVisibleRatio(element) >=
    MIN_TARGET_VISIBLE_RATIO
  );
}

const MIN_SPOTLIGHT_VISIBLE_RATIO = 0.3;

export function isTargetSpotlightVisible(
  ratio: number
): boolean {
  return ratio >= MIN_SPOTLIGHT_VISIBLE_RATIO;
}

/** Lenient check for clickable tour targets (buttons, links). */
export function isTargetActionable(
  element: HTMLElement
): boolean {
  const ratio = getTargetVisibleRatio(element);
  const box = element.getBoundingClientRect();
  const isCompact =
    box.height <= 120 && box.width <= 520;

  if (isCompact) {
    if (ratio >= 0.55) {
      return true;
    }

    const centerY = box.top + box.height / 2;

    return (
      centerY >= TOP_UI_CLEARANCE &&
      centerY <= window.innerHeight - BOTTOM_UI_CLEARANCE &&
      ratio >= 0.2
    );
  }

  return ratio >= 0.35;
}

export function getSpotlightPadding(
  element: HTMLElement
): number {
  const box = element.getBoundingClientRect();
  const size = Math.max(box.width, box.height);

  if (size < 48) {
    return 10;
  }

  if (size < 120) {
    return 16;
  }

  return 20;
}

export function measureSpotlightRect(
  element: HTMLElement
): BoxRect {
  const padding = getSpotlightPadding(element);
  const box = element.getBoundingClientRect();

  return {
    top: box.top - padding,
    left: box.left - padding,
    width: box.width + padding * 2,
    height: box.height + padding * 2,
  };
}

export function ensureTargetVisibleWithMargin(
  element: HTMLElement,
  marginTop = SCROLL_MARGIN_TOP,
  marginBottom = SCROLL_MARGIN_BOTTOM
) {
  const box = element.getBoundingClientRect();
  const viewport = getLayoutViewportBox();
  const minTop = viewport.top + marginTop;
  const maxBottom =
    viewport.top + viewport.height - marginBottom;

  if (box.top < minTop) {
    window.scrollBy({
      top: box.top - minTop - 12,
      behavior: "auto",
    });
    return;
  }

  if (box.bottom > maxBottom) {
    window.scrollBy({
      top: box.bottom - maxBottom + 12,
      behavior: "auto",
    });
  }
}

/** Scroll target into view on window/document (all devices). */
export function scrollTourTargetIntoView(
  element: HTMLElement
) {
  const tourId = element.getAttribute("data-tour");
  const block =
    tourId === "create-project" ? "end" : "center";

  element.scrollIntoView({
    block,
    inline: "nearest",
    behavior: "instant",
  });

  const box = element.getBoundingClientRect();
  const maxBottom =
    window.innerHeight - BOTTOM_UI_CLEARANCE;

  if (box.bottom > maxBottom) {
    window.scrollBy({
      top: box.bottom - maxBottom + 8,
      behavior: "instant",
    });
  }

  const nextBox = element.getBoundingClientRect();

  if (nextBox.top < TOP_UI_CLEARANCE) {
    window.scrollBy({
      top: nextBox.top - TOP_UI_CLEARANCE,
      behavior: "instant",
    });
  }
}

export function computeTooltipLayout(options: {
  targetRect: BoxRect | null;
  preferredPlacement: "top" | "bottom" | "auto";
  targetMissing: boolean;
  hasCta: boolean;
  targetVisibleRatio?: number;
}): TooltipLayoutResult {
  const viewport = getVisualViewportBox();
  const obstacles = getViewportObstacles(
    options.targetRect
  );
  const bounds = getAvailableBounds(obstacles);
  const compactMode = shouldUseCompactMode(
    options.targetRect
  );
  const placementOrder = getPlacementOrder(
    options.preferredPlacement
  );

  const defaultWidth = getAdaptiveTooltipWidth(
    viewport.width
  );
  const defaultHeight = estimateTooltipHeight({
    compactMode,
    targetMissing: options.targetMissing,
    hasCta: options.hasCta,
  });

  const fallback: TooltipLayoutResult = {
    top: Math.max(
      bounds.top + 16,
      bounds.top +
        bounds.height / 2 -
        defaultHeight / 2
    ),
    left: Math.max(
      bounds.left + 8,
      bounds.left +
        (bounds.width - defaultWidth) / 2
    ),
    width: defaultWidth,
    height: defaultHeight,
    placement: "bottom",
    compactMode,
    collisionDetected: false,
    arrowOffsetX: 0,
    arrowSide: "bottom",
    debug: {
      placement: "bottom",
      collisionDetected: false,
      viewportObstacles: obstacles,
      targetVisibleRatio:
        options.targetVisibleRatio ?? 1,
      compactMode,
      tooltipWidth: defaultWidth,
    },
  };

  if (!options.targetRect || options.targetMissing) {
    return fallback;
  }

  for (const width of WIDTH_CANDIDATES) {
    if (width > bounds.width) {
      continue;
    }

    const tooltipHeight = estimateTooltipHeight({
      compactMode,
      targetMissing: false,
      hasCta: options.hasCta,
    });

    for (const placement of placementOrder) {
      const candidate = clampTooltipToBounds(
        computeCandidatePosition(
          placement,
          options.targetRect,
          width,
          tooltipHeight
        ),
        bounds
      );

      const overlapsTarget = doesTooltipOverlapTarget(
        candidate,
        options.targetRect
      );
      const overlapsFixed = overlapsObstacle(
        candidate,
        obstacles
      );
      const collisionDetected =
        overlapsTarget || overlapsFixed;

      if (
        !collisionDetected &&
        fitsInBounds(candidate, bounds)
      ) {
        const targetCenterX =
          options.targetRect.left +
          options.targetRect.width / 2;
        const arrowOffsetX = Math.min(
          width / 2 - 12,
          Math.max(
            -width / 2 + 12,
            targetCenterX -
              (candidate.left + width / 2)
          )
        );

        return {
          top: candidate.top,
          left: candidate.left,
          width,
          height: tooltipHeight,
          placement,
          compactMode,
          collisionDetected: false,
          arrowOffsetX,
          arrowSide: placement,
          debug: {
            placement,
            collisionDetected: false,
            viewportObstacles: obstacles,
            targetVisibleRatio:
              options.targetVisibleRatio ?? 1,
            compactMode,
            tooltipWidth: width,
          },
        };
      }
    }
  }

  const bestPlacement = placementOrder[0];
  const best = clampTooltipToBounds(
    computeCandidatePosition(
      bestPlacement,
      options.targetRect,
      Math.min(defaultWidth, bounds.width),
      defaultHeight
    ),
    bounds
  );

  return {
    ...best,
    width: Math.min(defaultWidth, bounds.width),
    height: defaultHeight,
    placement: bestPlacement,
    compactMode,
    collisionDetected: true,
    arrowOffsetX: 0,
    arrowSide: bestPlacement,
    debug: {
      placement: bestPlacement,
      collisionDetected: true,
      viewportObstacles: obstacles,
      targetVisibleRatio:
        options.targetVisibleRatio ?? 1,
      compactMode,
      tooltipWidth: Math.min(defaultWidth, bounds.width),
    },
  };
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
}
