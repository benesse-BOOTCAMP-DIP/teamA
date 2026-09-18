'use client';

import React from 'react';
import type { StoryDetailWord } from "@/app/api/stories/[id]/route";

interface DetailStoryEnglishViewProps {
  title: string;
  story: string;
  words?: StoryDetailWord[];
}

export default function DetailStoryEnglishView({
  title,
  story,
  words = [],
}: DetailStoryEnglishViewProps) {
  // 返り値: 本文中の学習対象語をハイライトしたReactノードの配列
  const renderHighlightedStory = () => {
    const allSurfaces = Array.from(
      new Map(
        words
          .flatMap((wordInfo) => wordInfo.surfaces || [])
          .map((surface) => surface.trim())
          .filter(Boolean)
          .map((surface) => [surface.toLocaleLowerCase(), surface] as const),
      ).values(),
    );

    if (allSurfaces.length === 0) {
      return story;
    }

    const sortedSurfaces = [...allSurfaces].sort((a, b) => b.length - a.length);
    const escapedTerms = sortedSurfaces.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(
      `(?<![A-Za-z])(?:${escapedTerms.join('|')})(?![A-Za-z])`,
      'gi',
    );
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    for (const match of story.matchAll(regex)) {
      const matchedText = match[0];
      const matchIndex = match.index ?? 0;

      if (matchIndex > lastIndex) {
        parts.push(story.slice(lastIndex, matchIndex));
      }

      parts.push(
        <mark
          key={`${matchIndex}-${matchedText}`}
          className="bg-amber-100 text-amber-900 font-semibold px-1 py-0.5 rounded border-b-2 border-amber-300"
        >
          {matchedText}
        </mark>,
      );
      lastIndex = matchIndex + matchedText.length;
    }

    if (lastIndex < story.length) {
      parts.push(story.slice(lastIndex));
    }

    return parts;
  };

  return (
    <div>
      {/* 物語タイトル */}
      <h1 className="text-xl font-bold bg-white rounded-2xl p-6 shadow-sm border border-stone-200 mb-3 flex items-center gap-2">
        <span className="text-sky-600 leading-none">📖</span>
        {title || "無題の物語"}
      </h1>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 mb-3">
          {/* ハイライト付き英文本文 */}
        <div className="bg-stone-50 rounded-xl p-5 border border-stone-100">
          <p className="text-base sm:text-lg leading-relaxed text-stone-700 font-serif whitespace-pre-wrap">
            {renderHighlightedStory()}
          </p>
        </div>

        {/* 登場単語のタグ一覧 */}
        {words.length > 0 && (
          <div className="mt-4 pt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-stone-400">対象単語:</span>
            {words.map((item) => (
              <span
                key={item.meaningId}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-100"
              >
                {item.english}
                {item.surfaces?.[0] && item.surfaces[0].toLowerCase() !== item.english.toLowerCase() && (
                  <span className="text-sky-400 ml-1">({item.surfaces[0]})</span>
                )}
              </span>
            ))}
          </div>
        )}
        </div>
    </div>
  );
}