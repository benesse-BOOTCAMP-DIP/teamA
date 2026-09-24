import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ものがたん - 物語で英単語を覚えよう",
  description: "夕焼けのように広がる物語で英単語を記憶する学習アプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0f0f28] text-[#f5e6ab]">
        {/* Sunset Navigation Header */}
        <header className="sticky top-0 z-50 sunset-glass border-b border-[#e79f4d]/30 px-4 py-3.5 shadow-lg backdrop-blur-md">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">

              <span className="font-bold text-xl tracking-wider sunset-gradient-text">
                ものがたん
              </span>
            </Link>

            <nav className="flex items-center gap-1 sm:gap-3 text-xs sm:text-sm font-medium">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-xl text-[#f5e6ab]/80 hover:text-[#f5e6ab] hover:bg-[#5f448a]/40 transition-all"
              >
                ホーム
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 rounded-xl text-[#f5e6ab] bg-[#5f448a]/50 hover:bg-[#6c3224]/80 border border-[#e79f4d]/30 transition-all flex items-center gap-1.5"
              >
                 単語登録
              </Link>
              <Link
                href="/list"
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#dd7c5d] to-[#ba666b] text-[#f5e6ab] font-bold hover:brightness-110 transition-all shadow-md flex items-center gap-1.5"
              >
                物語・単語一覧
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content Body */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>

        {/* Sunset Footer */}
        <footer className="border-t border-[#3c3876]/60 py-6 text-center text-xs text-[#f5e6ab]/50 bg-[#0f0f28]/90 backdrop-blur-sm">
          <p>ものがたん — Sunset Story Learning Platform</p>
        </footer>
      </body>
    </html>
  );
}

