/** アプリ共通のライト/ダーク対応サーフェスクラス */

export const appSurfaces = {
  card: `
    rounded-[30px]
    border border-white/60
    bg-white/75
    backdrop-blur-xl
    shadow-[0_8px_30px_rgba(0,0,0,0.05)]
    dark:border-zinc-700/50
    dark:bg-zinc-900/80
    dark:shadow-[0_8px_30px_rgba(0,0,0,0.28)]
  `,
  cardSm: `
    rounded-[28px]
    border border-white/60
    bg-white/75
    backdrop-blur-xl
    shadow-[0_8px_30px_rgba(0,0,0,0.05)]
    dark:border-zinc-700/50
    dark:bg-zinc-900/80
    dark:shadow-[0_8px_30px_rgba(0,0,0,0.28)]
  `,
  panel: `
    rounded-2xl
    border border-zinc-200
    bg-white
    dark:border-zinc-700
    dark:bg-zinc-900
  `,
  mutedLabel:
    "text-sm text-zinc-400 dark:text-zinc-500",
  pageTitle:
    "text-2xl font-semibold tracking-wide text-zinc-800 dark:text-zinc-100",
  bodyText:
    "text-zinc-700 dark:text-zinc-200",
  subtleText:
    "text-zinc-500 dark:text-zinc-400",
  nav: `
    rounded-[30px]
    border border-white/60
    bg-white/70
    backdrop-blur-xl
    shadow-[0_8px_30px_rgba(0,0,0,0.08)]
    dark:border-zinc-700/50
    dark:bg-zinc-900/85
    dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)]
  `,
  navLink:
    "text-sm text-zinc-500 dark:text-zinc-400",
  input: `
    w-full
    rounded-2xl
    border border-zinc-200
    bg-white
    text-zinc-800
    outline-none
    dark:border-zinc-700
    dark:bg-zinc-900
    dark:text-zinc-100
  `,
  chip: `
    rounded-full
    bg-white
    text-zinc-500
    shadow-[0_2px_10px_rgba(0,0,0,0.05)]
    dark:bg-zinc-800
    dark:text-zinc-300
    dark:shadow-[0_2px_10px_rgba(0,0,0,0.25)]
  `,
  heroCard: `
    relative
    overflow-hidden
    rounded-[34px]
    border border-white/60
    bg-white/75
    p-5
    backdrop-blur-2xl
    shadow-[0_10px_30px_rgba(0,0,0,0.05)]
    dark:border-zinc-700/50
    dark:bg-zinc-900/80
    dark:shadow-[0_10px_30px_rgba(0,0,0,0.28)]
  `,
  heroCardLg: `
    relative
    overflow-hidden
    rounded-[38px]
    border border-white/60
    bg-white/75
    p-6
    backdrop-blur-2xl
    shadow-[0_10px_40px_rgba(0,0,0,0.06)]
    dark:border-zinc-700/50
    dark:bg-zinc-900/80
    dark:shadow-[0_10px_40px_rgba(0,0,0,0.28)]
  `,
  heroSheen: `
    pointer-events-none
    absolute
    inset-0
    bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_35%)]
    opacity-80
    dark:opacity-0
  `,
  glassBadge: `
    rounded-full
    border border-white/60
    bg-white/70
    px-4
    py-2
    text-sm
    text-zinc-500
    backdrop-blur-xl
    shadow-[0_2px_10px_rgba(0,0,0,0.04)]
    dark:border-zinc-700/50
    dark:bg-zinc-900/70
    dark:text-zinc-400
    dark:shadow-[0_2px_10px_rgba(0,0,0,0.25)]
  `,
  roundButton: `
    rounded-full
    bg-white/70
    px-3
    py-2
    text-sm
    text-zinc-500
    shadow-[0_2px_10px_rgba(0,0,0,0.03)]
    dark:bg-zinc-800/80
    dark:text-zinc-400
    dark:shadow-[0_2px_10px_rgba(0,0,0,0.25)]
  `,
  roundButtonMd: `
    rounded-full
    bg-white
    px-4
    py-2
    text-sm
    text-zinc-500
    shadow-[0_2px_10px_rgba(0,0,0,0.05)]
    dark:bg-zinc-800/80
    dark:text-zinc-400
    dark:shadow-[0_2px_10px_rgba(0,0,0,0.25)]
  `,
  countChip: `
    rounded-full
    bg-zinc-100
    px-3
    py-1
    text-xs
    text-zinc-500
    dark:bg-zinc-800
    dark:text-zinc-400
  `,
  emptyPanel: `
    rounded-2xl
    border border-dashed border-zinc-200
    bg-white/70
    px-4
    py-5
    text-center
    text-sm
    text-zinc-400
    dark:border-zinc-700
    dark:bg-zinc-900/60
    dark:text-zinc-500
  `,
  taskButton: `
    w-full
    rounded-2xl
    border border-white/60
    bg-white/70
    px-4
    py-4
    text-left
    backdrop-blur-xl
    transition-all
    duration-300
    dark:border-zinc-700/50
    dark:bg-zinc-900/70
  `,
  dayCellIdle: `
    border-zinc-200
    bg-white/90
    shadow-[0_2px_10px_rgba(0,0,0,0.03)]
    dark:border-zinc-700
    dark:bg-zinc-900/85
    dark:shadow-[0_2px_10px_rgba(0,0,0,0.22)]
  `,
  dayCellToday: `
    bg-white
    dark:bg-zinc-900/90
  `,
  monthDayIdle: `
    border-zinc-200
    bg-white
    dark:border-zinc-700
    dark:bg-zinc-900/85
  `,
  panelIdle: `
    border-zinc-200
    bg-white
    dark:border-zinc-700
    dark:bg-zinc-900/85
  `,
  editToggleIdle: `
    bg-white/90
    text-zinc-700
    border border-white/60
    dark:bg-zinc-900/85
    dark:text-zinc-200
    dark:border-zinc-700/50
  `,
} as const;
