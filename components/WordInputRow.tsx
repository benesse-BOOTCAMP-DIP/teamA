'use client';

import React from 'react';

export type WordItem = {
  id: string;
  english: string;
  japanese: string;
  japaneseOptions: string[];
};

type WordInputRowProps = {
  item: WordItem;
  index: number;
  canDelete: boolean;
  onEnglishChange: (id: string, value: string) => void;
  onJapaneseChange: (id: string, value: string) => void;
  onRemoveRow: (id: string) => void;
};

export default function WordInputRow({
  item,
  index,
  canDelete,
  onEnglishChange,
  onJapaneseChange,
  onRemoveRow,
}: WordInputRowProps) {
  const hasOptions = item.japaneseOptions.length > 0;

  return (
    <div className="flex items-center gap-2 mb-3 w-full group">
      <div className="flex-1 grid grid-cols-2 gap-2.5 min-w-0">
        {/* 英語入力欄 */}
        <div className="relative">
          <input
            type="text"
            maxLength={45}
            value={item.english}
            placeholder={`英単語 ${index + 1}`}
            onChange={(e) => onEnglishChange(item.id, e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#19183b]/80 border border-[#3c3876] rounded-xl text-[#f5e6ab] placeholder-[#f5e6ab]/40 focus:outline-none focus:border-[#e79f4d] focus:ring-1 focus:ring-[#e79f4d] shadow-inner text-sm transition-all"
          />
        </div>

        {/* 日本語選択欄 */}
        {hasOptions ? (
          <div className="relative">
            <select
              value={item.japanese}
              onChange={(e) => onJapaneseChange(item.id, e.target.value)}
              className="w-full px-3 py-2.5 bg-[#272d64] border border-[#e79f4d]/50 rounded-xl text-[#f5e6ab] focus:outline-none focus:border-[#e79f4d] focus:ring-1 focus:ring-[#e79f4d] shadow-sm text-sm truncate cursor-pointer transition-all"
            >
              <option value="" className="bg-[#0f0f28] text-[#f5e6ab]/60">
                訳を選択してください
              </option>
              {item.japaneseOptions.map((option, i) => (
                <option key={i} value={option} className="bg-[#0f0f28] text-[#f5e6ab]">
                  {option}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input
            type="text"
            disabled
            placeholder="英語入力後、翻訳取得"
            className="w-full px-3 py-2.5 bg-[#0f0f28]/40 border border-[#3c3876]/40 rounded-xl text-[#f5e6ab]/30 cursor-not-allowed text-sm truncate"
          />
        )}
      </div>

      {/* 削除ボタン */}
      {canDelete && (
        <button
          type="button"
          onClick={() => onRemoveRow(item.id)}
          aria-label="行を削除"
          className="shrink-0 p-2 text-[#ba666b] hover:text-[#dd7c5d] rounded-xl hover:bg-[#823228]/30 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}