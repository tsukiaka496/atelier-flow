"use client";

import { createPortal } from "react-dom";
import { useSyncExternalStore } from "react";

import { tutorialTheme } from "@/lib/tutorialTheme";
import {
  TUTORIAL_TAB_LABELS,
  TUTORIAL_TAB_ORDER,
} from "@/lib/tutorialSteps";

function subscribeMounted() {
  return () => {};
}

function getMountedSnapshot() {
  return true;
}

function getMountedServerSnapshot() {
  return false;
}

export default function WelcomeOverlay({
  onStart,
  onSkip,
}: {
  onStart: () => void;
  onSkip: () => void;
}) {
  const mounted = useSyncExternalStore(
    subscribeMounted,
    getMountedSnapshot,
    getMountedServerSnapshot
  );

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center px-5 overscroll-contain"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-black/35 [grid-area:1/1]"
        aria-hidden="true"
      />

      <div
        className="
          pointer-events-auto
          relative
          z-10
          w-full
          max-w-md
          [grid-area:1/1]
          rounded-[28px]
          border border-zinc-200
          bg-white
          p-5
          shadow-[0_4px_16px_rgba(0,0,0,0.08)]
          dark:border-zinc-700
          dark:bg-zinc-900
        "
      >
        <p className="text-xs text-zinc-400">
          はじめに
        </p>
        <h2 className="mt-0.5 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
          使い方ガイド
        </h2>

        <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          短いステップで、月・案件（日程の組み直し）・メモ・ホーム・設定を確認します。
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {TUTORIAL_TAB_ORDER.map((tab) => (
            <span
              key={tab}
              className="
                rounded-full
                bg-zinc-100
                px-2.5
                py-1
                text-[10px]
                font-medium
                text-zinc-600
                dark:bg-zinc-800
                dark:text-zinc-300
              "
            >
              {TUTORIAL_TAB_LABELS[tab]}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSkip}
            className={tutorialTheme.welcomeSkip}
          >
            スキップ
          </button>

          <button
            type="button"
            onClick={() => onStart()}
            className={tutorialTheme.welcomePrimary}
          >
            はじめる
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
