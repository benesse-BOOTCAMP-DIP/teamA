import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full">
      {/* Hero Section */}
      <div className="text-center my-8 sm:my-12 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3c3876]/60 border border-[#e79f4d]/40 text-[#f5e6ab] text-xs font-semibold tracking-wider shadow-inner mb-2">
          <span> AI Story Vocabulary Generator</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight sunset-gradient-text leading-tight sm:leading-normal">
          単語が織りなす、<br className="sm:hidden" />
          夕焼け色の物語。
        </h1>
        <p className="max-w-xl mx-auto text-sm sm:text-base text-[#f5e6ab]/80 leading-relaxed font-light">
          暗記したい英単語を入力するだけ。AIがあなただけのドラマチックなショートストーリーを自動生成。文脈と物語の中で楽しく自然に英単語が身につきます。
        </p>
      </div>

      {/* Primary Action Cards Grid */}
      <div className="grid sm:grid-cols-2 gap-6 w-full max-w-2xl my-4">
        {/* Register Card */}
        <Link
          href="/register"
          className="group relative sunset-glass-card rounded-2xl p-6 sm:p-8 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#dd7c5d]/10 rounded-full blur-2xl group-hover:bg-[#dd7c5d]/25 transition-all"></div>
          <div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#dd7c5d] to-[#ba666b] flex items-center justify-center text-2xl mb-4 shadow-md group-hover:scale-110 transition-transform">
   
            </div>
            <h2 className="text-xl font-bold text-[#f5e6ab] mb-2 group-hover:text-[#e79f4d] transition-colors">
              新しい単語を登録
            </h2>
            <p className="text-xs sm:text-sm text-[#f5e6ab]/70 leading-relaxed">
              覚えてみたい英単語を入力すると、AIが最適な和訳候補と短編物語を自動執筆します。
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm font-bold text-[#e79f4d] group-hover:text-[#f5e6ab]">
            <span>登録して物語をつくる</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>

        {/* List Card */}
        <Link
          href="/list"
          className="group relative sunset-glass-card rounded-2xl p-6 sm:p-8 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#5f448a]/20 rounded-full blur-2xl group-hover:bg-[#5f448a]/35 transition-all"></div>
          <div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5f448a] to-[#3c3876] flex items-center justify-center text-2xl mb-4 shadow-md border border-[#e79f4d]/30 group-hover:scale-110 transition-transform">
            
            </div>
            <h2 className="text-xl font-bold text-[#f5e6ab] mb-2 group-hover:text-[#e79f4d] transition-colors">
              物語・単語帳を見る
            </h2>
            <p className="text-xs sm:text-sm text-[#f5e6ab]/70 leading-relaxed">
              保存した過去の作品や、登録した単語リストをキーワードで検索・復習できます。
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm font-bold text-[#e99d6b] group-hover:text-[#f5e6ab]">
            <span>ライブラリを開く</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>
      </div>

      {/* Features Overview */}
      <div className="mt-12 sunset-glass rounded-2xl p-6 sm:p-8 w-full max-w-2xl border border-[#3c3876]/80 text-center sm:text-left">
        <h3 className="text-sm font-bold text-[#e79f4d] uppercase tracking-wider mb-4 flex items-center justify-center sm:justify-start gap-2">
ものがたんの特徴
        </h3>
        <div className="grid sm:grid-cols-3 gap-4 text-xs text-[#f5e6ab]/80">
          <div className="space-y-1">
            <p className="font-bold text-[#f5e6ab]">1. AI和訳アシスト</p>
            <p className="text-[#f5e6ab]/60">単語を入力するだけで適切な日本語訳候補を提案</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-[#f5e6ab]">2. ハイライト学習</p>
            <p className="text-[#f5e6ab]/60">物語本文中の登録単語が自動で強調ハイライト</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-[#f5e6ab]">3. ワンタップ和訳切替</p>
            <p className="text-[#f5e6ab]/60">英文リーディングと日本語対訳をスムーズに切替</p>
          </div>
        </div>
      </div>
    </main>
  );
}

