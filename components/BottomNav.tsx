"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  // 物語生成・登録画面など（/stories配下）ではナビゲーションを非表示にする
  if (pathname.startsWith("/stories")) {
    return null;
  }

  const navItems = [
    {
      label: "登録",
      href: "/register",
      icon: (isActive: boolean) => (
        <svg
          className="w-5 h-5 mb-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={isActive ? 2.4 : 1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: "一覧",
      href: "/list",
      icon: (isActive: boolean) => (
        <svg
          className="w-5 h-5 mb-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={isActive ? 2.4 : 1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* ボトムナビゲーション分の下部余白 */}
      <div className="h-16 w-full shrink-0" aria-hidden="true" />
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 shadow-xs">
        <div className="max-w-[393px] mx-auto flex items-center h-14">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/list" && pathname.startsWith("/list"));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 h-full flex flex-col items-center justify-center transition-colors ${
                  isActive
                    ? "text-stone-900 font-bold border-t-2 border-stone-900 bg-stone-50/60"
                    : "text-stone-400 hover:text-stone-700 hover:bg-stone-50 border-t-2 border-transparent"
                }`}
              >
                {item.icon(isActive)}
                <span className="text-[11px] leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
