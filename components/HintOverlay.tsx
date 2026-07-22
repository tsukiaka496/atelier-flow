"use client";

import {
  type ReactNode,
  useEffect,
} from "react";

import { appSurfaces } from "@/lib/appSurfaces";

type HintOverlayProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string | ReactNode;
  bullets?: string[];
};

export default function HintOverlay({
  open,
  onClose,
  title,
  body,
  bullets,
}: HintOverlayProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hint-overlay-title"
    >
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 bg-zinc-950/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        className={`
          relative
          z-10
          w-full
          max-w-sm
          p-5
          ${appSurfaces.card}
        `}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2
            id="hint-overlay-title"
            className={`pr-2 text-lg font-semibold tracking-wide ${appSurfaces.bodyText}`}
          >
            {title}
          </h2>

          <button
            type="button"
            aria-label="閉じる"
            onClick={onClose}
            className={`
              -mr-1
              -mt-1
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              text-zinc-500
              transition
              hover:bg-zinc-100/80
              dark:text-zinc-400
              dark:hover:bg-zinc-800/80
            `}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {typeof body === "string" ? (
          <p
            className={`text-sm leading-relaxed ${appSurfaces.subtleText}`}
          >
            {body}
          </p>
        ) : (
          <div
            className={`text-sm leading-relaxed ${appSurfaces.subtleText}`}
          >
            {body}
          </div>
        )}

        {bullets && bullets.length > 0 ? (
          <ul
            className={`
              mt-4
              space-y-2
              border-t
              border-zinc-200/80
              pt-4
              dark:border-zinc-700/60
            `}
          >
            {bullets.map((item) => (
              <li
                key={item}
                className={`
                  flex
                  gap-2
                  text-sm
                  leading-relaxed
                  ${appSurfaces.bodyText}
                `}
              >
                <span
                  className="
                    mt-2
                    h-1.5
                    w-1.5
                    shrink-0
                    rounded-full
                    bg-[var(--theme-accent)]
                  "
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
