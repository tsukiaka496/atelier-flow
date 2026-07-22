"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { theme } from "@/lib/themeClasses";
import { appSurfaces } from "@/lib/appSurfaces";

const navItems = [
  { href: "/", label: "ホーム" },
  { href: "/month", label: "月" },
  { href: "/projects", label: "案件" },
  { href: "/memos", label: "メモ" },
  { href: "/timeline", label: "時間" },
] as const;

function isNavActive(href: string, pathname: string) {
  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/projects") {
    return pathname.startsWith("/projects");
  }

  if (href === "/memos") {
    return pathname.startsWith("/memos");
  }

  if (href === "/month") {
    return pathname === "/month" || pathname.startsWith("/month/");
  }

  if (href === "/timeline") {
    return (
      pathname === "/timeline" ||
      pathname.startsWith("/timeline/")
    );
  }

  return false;
}

export default function BottomNav() {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    isNavActive(href, pathname)
      ? theme.navActive
      : appSurfaces.navLink;

  return (
    <div
      className={`
        fixed
        bottom-5
        left-1/2
        z-40
        w-[92%]
        max-w-md
        -translate-x-1/2
        overflow-hidden
        px-4
        py-3
        ${appSurfaces.nav}
      `}
      style={{
        marginBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <span
        aria-hidden
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[linear-gradient(135deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0.1)_40%,transparent_70%)]
          dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,transparent_55%)]
        "
      />
      <nav
        className="
          relative
          z-[1]
          grid
          grid-cols-5
          items-center
          gap-1
        "
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex
              min-w-0
              flex-col
              items-center
              justify-center
              rounded-2xl
              px-1
              py-2
              text-center
              text-[11px]
              leading-tight
              sm:text-xs
              ${linkClass(item.href)}
            `}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
