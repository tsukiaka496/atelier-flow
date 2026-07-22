/** アプリ共通のライト/ダーク対応サーフェス（グラス調） */

const glassLight = `
  border border-white/75
  bg-white/68
  backdrop-blur-2xl
  shadow-[0_1px_0_rgba(255,255,255,0.85)_inset,0_8px_32px_rgba(120,90,110,0.1),0_2px_8px_rgba(120,90,110,0.06)]
`;

const glassLightSolid = `
  border border-white/80
  bg-white/78
  backdrop-blur-2xl
  shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_10px_36px_rgba(120,90,110,0.12),0_2px_10px_rgba(120,90,110,0.07)]
`;

const glassDark = `
  dark:border-white/10
  dark:bg-zinc-900/55
  dark:shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_12px_36px_rgba(0,0,0,0.45),0_2px_10px_rgba(0,0,0,0.25)]
`;

export const appSurfaces = {
  card: `
    rounded-[30px]
    ${glassLightSolid}
    ${glassDark}
  `,
  cardSm: `
    rounded-[28px]
    ${glassLight}
    ${glassDark}
  `,
  panel: `
    rounded-2xl
    border border-white/75
    bg-white/65
    backdrop-blur-xl
    shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_4px_18px_rgba(120,90,110,0.08)]
    dark:border-white/10
    dark:bg-zinc-900/65
  `,
  mutedLabel:
    "text-sm font-medium tracking-wide text-zinc-700 dark:text-zinc-300",
  pageTitle:
    "text-2xl font-semibold tracking-wide text-zinc-900 dark:text-zinc-100",
  bodyText:
    "text-zinc-800 dark:text-zinc-100",
  subtleText:
    "text-zinc-600 dark:text-zinc-400",
  nav: `
    rounded-[30px]
    border border-white/75
    bg-white/60
    backdrop-blur-2xl
    shadow-[0_1px_0_rgba(255,255,255,0.95)_inset,0_12px_40px_rgba(120,90,110,0.16),0_4px_14px_rgba(120,90,110,0.08)]
    ring-1
    ring-white/40
    dark:border-white/12
    dark:bg-zinc-900/65
    dark:shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_14px_40px_rgba(0,0,0,0.5),0_4px_14px_rgba(0,0,0,0.3)]
    dark:ring-white/10
  `,
  navLink:
    "text-sm font-medium text-zinc-600 dark:text-zinc-400",
  input: `
    w-full
    rounded-2xl
    border border-white/80
    bg-white/50
    text-zinc-800
    outline-none
    backdrop-blur-md
    shadow-[0_1px_0_rgba(255,255,255,0.7)_inset]
    dark:border-white/10
    dark:bg-zinc-900/55
    dark:text-zinc-100
  `,
  chip: `
    rounded-full
    border border-white/75
    bg-white/55
    text-zinc-700
    backdrop-blur-md
    shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_2px_10px_rgba(120,90,110,0.08)]
    dark:border-white/10
    dark:bg-zinc-800/60
    dark:text-zinc-300
  `,
  heroCard: `
    relative
    overflow-hidden
    rounded-[34px]
    border border-white/75
    bg-white/60
    p-5
    backdrop-blur-2xl
    shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_12px_40px_rgba(120,90,110,0.12)]
    dark:border-white/10
    dark:bg-zinc-900/55
    dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)]
  `,
  heroCardLg: `
    relative
    overflow-hidden
    rounded-[38px]
    border border-white/75
    bg-white/60
    p-6
    backdrop-blur-2xl
    shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_14px_44px_rgba(120,90,110,0.13)]
    dark:border-white/10
    dark:bg-zinc-900/55
    dark:shadow-[0_14px_44px_rgba(0,0,0,0.42)]
  `,
  heroSheen: `
    pointer-events-none
    absolute
    inset-0
    bg-[linear-gradient(135deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.08)_42%,transparent_70%)]
    opacity-90
    dark:opacity-20
  `,
  glassBadge: `
    rounded-full
    border border-white/75
    bg-white/55
    px-4
    py-2
    text-sm
    text-zinc-700
    backdrop-blur-xl
    shadow-[0_1px_0_rgba(255,255,255,0.85)_inset,0_2px_12px_rgba(120,90,110,0.08)]
    dark:border-white/10
    dark:bg-zinc-900/55
    dark:text-zinc-300
  `,
  roundButton: `
    rounded-full
    border border-white/75
    bg-white/55
    px-3
    py-2
    text-sm
    text-zinc-700
    backdrop-blur-xl
    shadow-[0_1px_0_rgba(255,255,255,0.85)_inset,0_2px_10px_rgba(120,90,110,0.08)]
    dark:border-white/10
    dark:bg-zinc-800/55
    dark:text-zinc-300
  `,
  roundButtonMd: `
    rounded-full
    border border-white/75
    bg-white/60
    px-4
    py-2
    text-sm
    text-zinc-700
    backdrop-blur-xl
    shadow-[0_1px_0_rgba(255,255,255,0.85)_inset,0_2px_12px_rgba(120,90,110,0.09)]
    dark:border-white/10
    dark:bg-zinc-800/55
    dark:text-zinc-300
  `,
  countChip: `
    rounded-full
    border border-white/60
    bg-white/55
    px-3
    py-1
    text-xs
    font-medium
    text-zinc-700
    backdrop-blur-md
    dark:border-white/10
    dark:bg-zinc-800/55
    dark:text-zinc-300
  `,
  emptyPanel: `
    rounded-2xl
    border border-dashed border-white/80
    bg-white/45
    px-4
    py-5
    text-center
    text-sm
    text-zinc-600
    backdrop-blur-md
    dark:border-white/15
    dark:bg-zinc-900/40
    dark:text-zinc-400
  `,
  taskButton: `
    w-full
    rounded-2xl
    border border-white/70
    bg-white/50
    px-4
    py-4
    text-left
    backdrop-blur-xl
    shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_4px_16px_rgba(120,90,110,0.07)]
    transition-all
    duration-300
    dark:border-white/10
    dark:bg-zinc-900/50
    dark:shadow-none
  `,
  dayCellIdle: `
    border-white/70
    bg-white/55
    backdrop-blur-md
    shadow-[0_1px_0_rgba(255,255,255,0.75)_inset,0_2px_10px_rgba(120,90,110,0.07)]
    dark:border-white/10
    dark:bg-zinc-900/55
  `,
  dayCellToday: `
    bg-white/70
    backdrop-blur-md
    dark:bg-zinc-900/70
  `,
  weekDaySelected: `
    border-[var(--theme-accent)]
    bg-[color-mix(in_srgb,var(--theme-accent)_18%,white)]
    shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_4px_16px_color-mix(in_srgb,var(--theme-accent-shadow)_40%,transparent)]
    backdrop-blur-md
    dark:bg-[color-mix(in_srgb,var(--theme-accent)_16%,transparent)]
  `,
  monthDayShiftWork: `
    border-[var(--theme-accent-border)]
    bg-[color-mix(in_srgb,var(--theme-accent)_18%,white)]
  `,
  monthDayShiftSchedule: `
    border-violet-200/80
    bg-[color-mix(in_srgb,#c4b5fd_22%,white)]
    dark:border-violet-800/55
  `,
  monthDayToday: `
    ring-2
    ring-[color-mix(in_srgb,var(--theme-accent-border)_55%,white)]
  `,
  monthDayIdle: `
    border-white/70
    bg-white/55
    backdrop-blur-md
    dark:border-white/10
    dark:bg-zinc-900/55
  `,
  panelIdle: `
    border-white/70
    bg-white/55
    backdrop-blur-md
    dark:border-white/10
    dark:bg-zinc-900/55
  `,
  editToggleIdle: `
    bg-white/55
    text-zinc-700
    border border-white/75
    backdrop-blur-md
    dark:bg-zinc-900/55
    dark:text-zinc-200
    dark:border-white/10
  `,
} as const;
