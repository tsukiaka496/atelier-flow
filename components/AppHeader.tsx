"use client";

import Link from "next/link";
import {
  type ReactNode,
  useState,
} from "react";

import HintOverlay from "@/components/HintOverlay";
import { appSurfaces } from "@/lib/appSurfaces";

type AppHeaderProps = {
  title?: string;
  children?: ReactNode;
  onHintClick?: () => void;
  hintTitle?: string;
  hintBody?: string | ReactNode;
  hintBullets?: string[];
};

function QuestionIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M9.6 9.4a2.4 2.4 0 1 1 3.5 2.1c-.7.4-1.1.9-1.1 1.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="16.4"
        r="0.9"
        fill="currentColor"
      />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

const floatingButtonClass = `
  flex
  h-10
  w-10
  items-center
  justify-center
  rounded-full
  text-zinc-700
  transition
  hover:bg-white/45
  hover:text-[var(--theme-accent)]
  dark:text-zinc-200
  dark:hover:bg-white/10
`;

export default function AppHeader({
  title,
  children,
  onHintClick,
  hintTitle = "ヒント",
  hintBody,
  hintBullets,
}: AppHeaderProps) {
  const [hintOpen, setHintOpen] = useState(false);
  const managesOwnHint =
    onHintClick == null && hintBody != null;

  const handleHintClick = () => {
    if (onHintClick) {
      onHintClick();
      return;
    }

    if (managesOwnHint) {
      setHintOpen(true);
    }
  };

  return (
    <>
      {/* タイトルは画面内（バーではない） */}
      {children ? (
        <div className="mb-4 pr-24">{children}</div>
      ) : title ? (
        <div className="mb-4 pr-24">
          <p
            className={`
              truncate
              text-[15px]
              font-semibold
              tracking-wide
              ${appSurfaces.bodyText}
            `}
          >
            {title}
          </p>
        </div>
      ) : (
        <span className="sr-only">Atelier Flow</span>
      )}

      {/* ヒント・設定：画面に浮かせる */}
      <div
        className="
          pointer-events-none
          fixed
          inset-x-0
          top-0
          z-50
        "
        style={{
          paddingTop:
            "calc(0.75rem + env(safe-area-inset-top))",
        }}
      >
        <div
          className="
            mx-auto
            flex
            w-full
            max-w-md
            justify-end
            px-4
          "
        >
          <div
            className={`
              pointer-events-auto
              relative
              flex
              items-center
              gap-1
              overflow-hidden
              rounded-full
              p-1.5
              ${appSurfaces.nav}
            `}
          >
            <span
              aria-hidden
              className="
                pointer-events-none
                absolute
                inset-0
                bg-[linear-gradient(135deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.12)_45%,transparent_70%)]
                dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,transparent_55%)]
              "
            />
            <button
              type="button"
              aria-label="ヒントを表示"
              onClick={handleHintClick}
              className={`relative z-[1] ${floatingButtonClass}`}
            >
              <QuestionIcon />
            </button>

            <Link
              href="/settings"
              aria-label="設定"
              className={`relative z-[1] ${floatingButtonClass}`}
            >
              <GearIcon />
            </Link>
          </div>
        </div>
      </div>

      {managesOwnHint ? (
        <HintOverlay
          open={hintOpen}
          onClose={() => setHintOpen(false)}
          title={hintTitle}
          body={hintBody!}
          bullets={hintBullets}
        />
      ) : null}
    </>
  );
}
