"use client";

import {
  type ReactNode,
  useState,
} from "react";
import { usePathname } from "next/navigation";

import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import HintOverlay from "@/components/HintOverlay";
import ThemedMain from "@/components/ThemedMain";
import {
  getPageHint,
  PAGE_HINTS,
} from "@/lib/pageHints";

type PageShellProps = {
  children: ReactNode;
  title?: string;
  hintId?: keyof typeof PAGE_HINTS | string;
  hintTitle?: string;
  hintBody?: string | ReactNode;
  hintBullets?: string[];
  showNav?: boolean;
  className?: string;
};

export default function PageShell({
  children,
  title,
  hintId,
  hintTitle,
  hintBody,
  hintBullets,
  showNav = true,
  className = "",
}: PageShellProps) {
  const pathname = usePathname();
  const [hintOpen, setHintOpen] = useState(false);

  const fromMap =
    (hintId ? PAGE_HINTS[hintId] : undefined) ??
    getPageHint(pathname);

  const hasExplicitHint =
    hintTitle != null && hintBody != null;

  const overlayTitle =
    hintTitle ?? fromMap?.title ?? "ヒント";
  const overlayBody: string | ReactNode =
    hintBody ?? fromMap?.body ?? "";
  const overlayBullets = hintBullets ?? fromMap?.bullets;
  const canShowHint = hasExplicitHint || fromMap != null;

  return (
    <ThemedMain
      className={`
        px-5
        pt-[calc(4.75rem+env(safe-area-inset-top))]
        ${showNav ? "pb-32" : "pb-8"}
        ${className}
      `}
    >
      <AppHeader
        title={title}
        onHintClick={
          canShowHint ? () => setHintOpen(true) : undefined
        }
      />

      {children}

      {showNav ? <BottomNav /> : null}

      {canShowHint ? (
        <HintOverlay
          open={hintOpen}
          onClose={() => setHintOpen(false)}
          title={overlayTitle}
          body={overlayBody}
          bullets={overlayBullets}
        />
      ) : null}
    </ThemedMain>
  );
}
