"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./BottomNav.css";

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
      icon: "/register.png",
    },
    {
      label: "一覧",
      href: "/list",
      icon: "/list.png",
    },
    {
      label: "クイズ",
      href: "/quiz",
      icon: "/quiz.png",
    },
  ];

  return (
    <>
      <div className="bottomNavSpacer" aria-hidden="true" />

      <nav className="bottomNav">
        <div className="navContainer">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/list" && pathname.startsWith("/list"));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`navLink ${
                  isActive ? "active" : "inactive"
                }`}
              >
                <img
                  className="navIcon"
                  src={item.icon}
                  alt={item.label}
                />

                <span className="navLabel">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}