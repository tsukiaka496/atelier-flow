/** Tutorial / onboarding UI only — do not reuse app theme.btnSolid here. */

export const tutorialTheme = {
  tooltipPanel: `
    pointer-events-none
    fixed
    max-w-[calc(100vw-32px)]
    rounded-[24px]
    border border-zinc-200
    bg-white
    p-4
    shadow-[0_4px_16px_rgba(0,0,0,0.08)]
    tutorial-tooltip-panel
  `,
  tooltipPanelCompact: `
    pointer-events-none
    fixed
    max-w-[calc(100vw-32px)]
    rounded-[20px]
    border border-zinc-200
    bg-white
    p-3
    shadow-[0_4px_16px_rgba(0,0,0,0.08)]
    tutorial-tooltip-panel
  `,
  tooltipTitle: "text-sm font-semibold leading-snug text-zinc-800",
  tooltipTitleCompact: "text-[13px] font-semibold leading-snug text-zinc-800",
  tooltipBody:
    "mt-2 text-sm leading-6 text-zinc-500 line-clamp-3",
  tooltipBodyCompact:
    "mt-1.5 text-xs leading-5 text-zinc-500 line-clamp-2",
  tooltipHint: "text-xs text-zinc-500",
  tooltipArrow:
    "pointer-events-none absolute h-3 w-3 rotate-45 border border-zinc-200 bg-white",
  skipButton: `
    pointer-events-auto
    rounded-xl
    px-3
    py-2
    text-xs
    text-zinc-600
    transition-all
    active:scale-[0.98]
  `,
  primaryButton: `
    pointer-events-auto
    rounded-2xl
    border
    border-sky-200
    bg-sky-100
    px-4
    py-2
    text-sm
    font-semibold
    text-sky-700
    shadow-[0_4px_12px_rgba(14,165,233,0.15)]
    transition-all
    hover:bg-sky-200
    hover:text-sky-800
    active:scale-[0.98]
  `,
  secondaryButton: `
    pointer-events-auto
    rounded-xl
    bg-zinc-100
    px-4
    py-2
    text-sm
    font-medium
    text-zinc-600
    transition-all
    active:scale-[0.98]
  `,
  maskPanel: "fixed touch-none bg-black/35 pointer-events-auto",
  maskRing: "pointer-events-none fixed rounded-[22px] ring-2 ring-sky-300/80",
  welcomeSkip: `
    pointer-events-auto
    rounded-xl
    px-3
    py-2
    text-xs
    text-zinc-600
    transition-all
    active:scale-[0.98]
  `,
  welcomePrimary: `
    pointer-events-auto
    rounded-2xl
    border
    border-sky-200
    bg-sky-100
    px-6
    py-3.5
    text-base
    font-semibold
    text-sky-700
    shadow-[0_4px_12px_rgba(14,165,233,0.15)]
    transition-all
    hover:bg-sky-200
    hover:text-sky-800
    active:scale-[0.98]
  `,
  debugPanel:
    "pointer-events-none fixed bottom-2 left-2 z-[60] max-w-[240px] rounded-lg bg-black/80 p-2 text-[10px] leading-4 text-white",
} as const;
