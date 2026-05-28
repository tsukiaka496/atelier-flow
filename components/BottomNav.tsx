"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useTourAction } from "@/lib/useTourAction";
import {
  tourInstanceProps,
  useTourInstanceId,
} from "@/lib/useTourInstanceId";
import { theme } from "@/lib/themeClasses";
import { appSurfaces } from "@/lib/appSurfaces";

function isNavActive(
  href: string,
  pathname: string
) {
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
    return pathname === "/month";
  }

  if (href === "/settings") {
    return pathname === "/settings";
  }

  return false;
}

export default function BottomNav() {
  const pathname = usePathname();

  const triggerHome = useTourAction("nav-home");
  const triggerProjects = useTourAction("nav-projects");
  const triggerMemos = useTourAction("nav-memos");
  const triggerMonth = useTourAction("nav-month");
  const triggerSettings = useTourAction("nav-settings");

  const homeInstance = useTourInstanceId("nav-home");
  const projectsInstance = useTourInstanceId("nav-projects");
  const memosInstance = useTourInstanceId("nav-memos");
  const monthInstance = useTourInstanceId("nav-month");
  const settingsInstance = useTourInstanceId("nav-settings");

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
        flex
        w-[92%]
        max-w-md
        -translate-x-1/2
        items-center
        justify-between
        px-3
        py-4
        ${appSurfaces.nav}
      `}
    >
      <Link
        href="/"
        className={`text-xs sm:text-sm ${linkClass("/")}`}
        {...tourInstanceProps("nav-home", homeInstance)}
        onClick={triggerHome}
      >
        ホーム
      </Link>

      <Link
        href="/projects"
        className={`text-xs sm:text-sm ${linkClass("/projects")}`}
        {...tourInstanceProps("nav-projects", projectsInstance)}
        onClick={triggerProjects}
      >
        案件
      </Link>

      <Link
        href="/memos"
        className={`text-xs sm:text-sm ${linkClass("/memos")}`}
        {...tourInstanceProps("nav-memos", memosInstance)}
        onClick={triggerMemos}
      >
        メモ
      </Link>

      <Link
        href="/month"
        className={`text-xs sm:text-sm ${linkClass("/month")}`}
        {...tourInstanceProps("nav-month", monthInstance)}
        onClick={triggerMonth}
      >
        月
      </Link>

      <Link
        href="/settings"
        className={`text-xs sm:text-sm ${linkClass("/settings")}`}
        {...tourInstanceProps("nav-settings", settingsInstance)}
        onClick={triggerSettings}
      >
        設定
      </Link>
    </div>
  );
}
