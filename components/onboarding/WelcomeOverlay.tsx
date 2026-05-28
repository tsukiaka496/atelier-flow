"use client";

import { createPortal } from "react-dom";
import { useSyncExternalStore } from "react";

import { tutorialTheme } from "@/lib/tutorialTheme";

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
          rounded-[30px]
          border border-zinc-200
          bg-white
          p-6
          shadow-[0_4px_16px_rgba(0,0,0,0.08)]
        "
      >
        <p className="text-sm text-zinc-500">
          welcome
        </p>
        <h2 className="mt-1 text-xl font-semibold text-zinc-800">
          Atelier Flowへようこそ
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-zinc-500">
          イラスト制作を整理するアプリです。
          <br />
          実際に触りながら使ってみましょう。
        </p>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSkip}
            className={tutorialTheme.welcomeSkip}
          >
            スキップ
          </button>

          <button
            type="button"
            onClick={onStart}
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
