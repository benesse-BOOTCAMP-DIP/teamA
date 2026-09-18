'use client';

// このコンポーネントでは、入力欄の変更やボタンのクリックといった
// ブラウザ上の操作を扱うため、Client Component として動かします。

import React from 'react';

// 画面に表示する「単語1行分」のデータの形を定義します。
// TypeScript は、この形と違うデータを渡したときにエラーで教えてくれます。
export type WordItem = {
  id: string; // 行を識別するためのID。削除や更新の対象を特定するために使います。
  english: string; // ユーザーが入力した英単語
  japanese: string; // 選択された日本語訳
  japaneseOptions: string[]; // プルダウンに表示する日本語訳の候補一覧
};

// 親コンポーネントから受け取る値と関数の一覧です。
// この行コンポーネントはデータを自分で保存せず、変更内容を親に知らせます。
// ここもただの型定義だよ。Voidとかの関数だよって定義しているだけ。しかもこの関数は親コンポのやつ
type WordInputRowProps = {
  item: WordItem; // この行に表示する単語データ
  index: number; // 何行目か。placeholder の番号表示に使います。
  canDelete: boolean; // 削除ボタンを表示してよいか
  onEnglishChange: (id: string, value: string) => void; // 英語が変更されたときに親へ知らせる関数
// 空にしているわけではない、なにも返さないという意味のVoid型を指定しています。
  onJapaneseChange: (id: string, value: string) => void; // 日本語訳が変更されたときに親へ知らせる関数
  onRemoveRow: (id: string) => void; // この行を削除するときに親へ知らせる関数
};


// 単語入力欄1行分を表示するコンポーネントです。
// item の実体は親が管理しているため、ここでは表示とイベント通知を担当します。
export default function WordInputRow({
  item,
  index,
  canDelete,
  onEnglishChange,
  onJapaneseChange,
  onRemoveRow,
}: WordInputRowProps) {
// ★★ここは、WordInputRowPropsと型が一緒かどうかをチェックしているTS特有の手法らしい。★★★

  // 翻訳候補が1つでもあれば、入力欄ではなくプルダウンを表示します。
  // これでTrueかFalseかを判定することができます。
  // 翻訳の選択肢が1つでもあるかどうかのちぇっく
  const hasOptions = item.japaneseOptions.length > 0;

  return (
    // この div が、英語欄・日本語欄・削除ボタンを横一列にまとめる外側の箱です。
    <div className="flex items-center gap-2 mb-3 w-full">
      
      {/* 
        入力エリアを grid grid-cols-2 にすることで、
        英語欄と日本語欄がカード幅の内側で「きっちり50%ずつ」の均等幅に固定され、
        中身の文字数に関係なく外枠からはみ出さなくなります。
      */}
      <div className="flex-1 grid grid-cols-2 gap-2 min-w-0">


        {/* 英語入力欄：翻訳候補生成後も常に編集可能です */}
        <input
          type="text"
          maxLength={45}
          // value を item.english に結び付けることで、親のデータを画面に表示します。
          value={item.english}
          placeholder={`英語 ${index + 1}`}
          // 入力されるたびに、行のIDと新しい文字列を親へ渡します。
          onChange={(e) => onEnglishChange(item.id, e.target.value)}
          className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 shadow-sm md:text-sm"
        />

        {/* 日本語選択欄 */}
        {hasOptions ? (//参考遠視Trueなので、まずは最初にセレクトタグになる。
          // 翻訳候補がある場合：候補から1つ選ぶプルダウンを表示します。
          // truncate を指定して、長い選択肢でも枠内に綺麗に収まるようにします。
          <select
            value={item.japanese}
            onChange={(e) => onJapaneseChange(item.id, e.target.value)}
            className="w-full px-2.5 py-2.5 bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 shadow-sm text-sm truncate cursor-pointer"
          >
            <option value="">訳を選択</option>
            {/* map は、候補の配列を option 要素の一覧に変換します。 */}
            {item.japaneseOptions.map((option, i) => (
              <option key={i} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          // まだ翻訳候補がない場合：翻訳取得まで日本語欄を無効にします。
          // こっちが三項演算子Falseの場合
          <input
            type="text"
            disabled
            placeholder="英語入力後取得"
            className="w-full px-3 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-400 cursor-not-allowed shadow-sm text-sm truncate"
          />
        )}
      </div>

      {/* 削除ボタン */}
      {/* 2行目以降（canDelete が true）であれば常に表示します */}
      {canDelete && (
        <button
          type="button"
          // 削除対象の行IDを親へ渡します。実際の削除は親が行います。
          onClick={() => onRemoveRow(item.id)}
          aria-label="行を削除"
          className="shrink-0 p-1.5 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}