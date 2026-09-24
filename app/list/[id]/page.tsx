"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { StoryDetailResponse } from "@/app/api/stories/[id]/route";
import StoryJapaneseViews from "@/components/storyJapaneseView";
import DetailStoryEnglishView from "@/components/DetailStoryEnglishView";
import Link from "next/link";

export default function StoryDetailPages() {
  const params = useParams();
  const id = params.id;

  const [story, setStory] = useState<StoryDetailResponse | null>(null);
  const [isJapaneseVisible, setIsJapaneseVisible] = useState(false);
  
  useEffect(() => {
    async function getData() {
      const response = await fetch(`/api/stories/${id}`);

      if (!response.ok) {
        alert("データの取得に失敗しました");
        return;
      }

      const data: StoryDetailResponse = await response.json();
      setStory(data);
    }

    getData();
  }, [id]);

  return (
    <main className="min-h-screen py-10 px-4 flex justify-center items-start text-[#f5e6ab]">
      <div className="w-full max-w-[640px]">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/list"
            className="text-xs font-semibold text-[#e79f4d] hover:text-[#f5e6ab] transition flex items-center gap-1 bg-[#3c3876]/40 px-3 py-1.5 rounded-xl border border-[#3c3876]"
          >
            ← 一覧へ戻る
          </Link>
          <span className="text-xs text-[#f5e6ab]/60">物語 ID: {id}</span>
        </div>
        
        {story ? (
          <div>
            <DetailStoryEnglishView title={story.title} story={story.story} words={story.words} />
            <div className="mb-6">
              <button
                className="w-full py-3.5 px-5 sunset-glass-card rounded-2xl font-bold text-sm text-[#f5e6ab] border border-[#e79f4d]/30 hover:border-[#e79f4d]/60 transition flex items-center justify-between shadow-md cursor-pointer"
                onClick={() => setIsJapaneseVisible(!isJapaneseVisible)}
              >
                <span className="flex items-center gap-2">
                  <span>🇯🇵</span>
                  <span>{isJapaneseVisible ? "和訳を閉じる" : "和訳を見る"}</span>
                </span>
                <span className="text-[#e79f4d] font-bold">{isJapaneseVisible ? "▲" : "▼"}</span>
              </button> 
            </div>
            {isJapaneseVisible && ( 
              <div>
                <StoryJapaneseViews japaneseStory={story.japaneseStory} words={story.words}/>
              </div> 
            )}
          </div>
        ) : (
          <div className="sunset-glass-card rounded-3xl p-10 text-center text-[#f5e6ab]/60 shadow-xl">
            <div className="animate-spin h-8 w-8 border-3 border-[#dd7c5d] border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-sm font-bold">データを読み込んでいます...</p>
          </div>
        )}
      </div>
    </main>
  );
}