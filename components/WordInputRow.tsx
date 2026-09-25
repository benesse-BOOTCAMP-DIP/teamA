"use client";

import React from "react";
import "./WordInputRow.css";

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
    <div className="row">
      <div className="inputArea">
        {/* 英語入力欄 */}
        <input
          type="text"
          maxLength={45}
          value={item.english}
          placeholder={`英語 ${index + 1}`}
          onChange={(e) =>
            onEnglishChange(item.id, e.target.value)
          }
          className="englishInput"
        />

        {/* 日本語選択欄 */}
        {hasOptions ? (
          <select
            value={item.japanese}
            onChange={(e) =>
              onJapaneseChange(item.id, e.target.value)
            }
            className="japaneseSelect"
          >
            <option value="">訳を選択</option>

            {item.japaneseOptions.map((option, i) => (
              <option key={i} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            disabled
            placeholder="英語入力後取得"
            className="disabledInput"
          />
        )}
      </div>

      {/* 削除ボタン */}
      {canDelete && (
        <button
          type="button"
          onClick={() => onRemoveRow(item.id)}
          aria-label="行を削除"
          className="deleteButton"
        >
          <svg
            className="deleteIcon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}