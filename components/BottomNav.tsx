"use client";

import Link from "next/link";

import { theme } from "@/lib/themeClasses";

export default function BottomNav() {
  return (
    <div className="
      fixed bottom-5 left-1/2 -translate-x-1/2
      w-[92%] max-w-md
      rounded-[32px]
      bg-white/70
      backdrop-blur-xl
      border border-white/60
      shadow-lg
      px-6 py-4
      flex justify-between items-center
    ">
      <Link href="/" className="text-sm text-zinc-500">
        ホーム
      </Link>

      <Link
        href="/dashboard"
        className={`
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          bg-white
          text-xl
          shadow-md
          ${theme.text}
        `}
      >
        ＋
      </Link>

      <span className="text-sm text-zinc-500">
        案件
      </span>
    </div>
  );
}