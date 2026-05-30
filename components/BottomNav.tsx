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

  const navItems = [
    {
      href: "/",
      label: "ホーム",
      tourId: "nav-home" as const,
      instance: homeInstance,
      onClick: triggerHome,
    },
    {
      href: "/month",
      label: "月",
      tourId: "nav-month" as const,
      instance: monthInstance,
      onClick: triggerMonth,
    },
    {
      href: "/projects",
      label: "案件",
      tourId: "nav-projects" as const,
      instance: projectsInstance,
      onClick: triggerProjects,
    },
    {
      href: "/memos",
      label: "メモ",
      tourId: "nav-memos" as const,
      instance: memosInstance,
      onClick: triggerMemos,
    },
    {
      href: "/settings",
      label: "設定",
      tourId: "nav-settings" as const,
      instance: settingsInstance,
      onClick: triggerSettings,
    },
  ];

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
        px-4
        py-3
        ${appSurfaces.nav}
      `}
    >
      <nav
        className="
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
        {...tourInstanceProps(
          item.tourId,
          item.instance
        )}
        onClick={item.onClick}
      >
        {item.label}
      </Link>
      ))}
      </nav>
    </div>
  );
}
