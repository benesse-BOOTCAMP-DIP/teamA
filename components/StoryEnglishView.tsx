'use client';

import React from 'react';

export interface StoryWordInfo {
  meaningId: number;
  word: string;
  surfaces: string[];
}

interface StoryEnglishViewProps {
  title: string;
  story: string;
  words?: StoryWordInfo[];
}

export default function StoryEnglishView({
  title,
  story,
  words = [],
}: StoryEnglishViewProps) {
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
          className="bg-gradient-to-r from-[#6c3224] to-[#823228] text-[#f5e6ab] font-bold px-2 py-0.5 rounded-lg border border-[#e79f4d]/60 shadow-sm inline-block my-0.5"
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
    <div className="sunset-glass-card rounded-3xl p-6 sm:p-8 mb-6 border border-[#e79f4d]/30 shadow-2xl relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#dd7c5d]/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* 物語タイトル */}
      <h2 className="text-xl sm:text-2xl font-extrabold mb-4 pb-3 border-b border-[#3c3876]/80 flex items-center gap-2.5">

        <span className="sunset-gradient-text">{title || '無題の物語'}</span>
      </h2>

      {/* ハイライト付き英文本文 */}
      <div className="bg-[#0f0f28]/75 rounded-2xl p-5 sm:p-6 border border-[#3c3876]/80 shadow-inner">
        <p className="text-base sm:text-lg leading-relaxed text-[#f5e6ab] font-serif whitespace-pre-wrap">
          {renderHighlightedStory()}
        </p>
      </div>

      {/* 登場単語のタグ一覧 */}
      {words.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[#3c3876]/50 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#e79f4d] flex items-center gap-1">
 学習対象単語:
          </span>
          {words.map((item) => (
            <span
              key={item.meaningId}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#5f448a]/50 text-[#f5e6ab] border border-[#e79f4d]/40 shadow-sm"
            >
              {item.word}
              {item.surfaces?.[0] && item.surfaces[0].toLowerCase() !== item.word.toLowerCase() && (
                <span className="text-[#e99d6b] ml-1 font-normal">({item.surfaces[0]})</span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
