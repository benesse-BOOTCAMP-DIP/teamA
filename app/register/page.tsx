'use client';

// このページでは、入力・クリック・画面遷移などブラウザ上の操作を扱うため、
// Client Component として実行します。
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// これは子コンポを読んでいる。
import WordInputRow, { type WordItem } from '@/components/WordInputRow';

// 登録時に使用する仮のユーザーIDです。
// プログラム全体で使う固定値のため、大文字とアンダースコアで命名しています。
const DEFAULT_USER_ID = 1;

// 入力可能な最大文字数です（仕様：45文字）
const MAX_WORD_LENGTH = 45;

// モックやバックエンドから返される「未登録」を示す固定メッセージです。
const NOT_FOUND_TEXT = '辞書に登録されていません';

export default function WordRegisterPage() {
  // router は、登録完了後に別のページへ移動するための機能です。
  const router = useRouter();

  // words が、この画面で入力している単語一覧の本体です。
  // useState を使うと、setWords で値を更新したときに画面も自動で再表示されます。
  // 最初は空の入力行を1行だけ用意します。
  const [words, setWords] = useState<WordItem[]>([
    { id: '1', english: '', japanese: '', japaneseOptions: [] },
  ]);

  // 画面上に表示するエラーメッセージを管理する状態です。
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 通信中かどうかを管理する状態です（二重送信防止と再試行制御）。
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 英語入力が変更されたときに、対象の行だけを更新します。
  const handleEnglishChange = (id: string, value: string): void => {//ここ、Void方と等しいならって言うTSの書き方。★★★★★★★
    // 文字を入力し直したときは、既存のエラーメッセージをクリアします。
    if (errorMessage) setErrorMessage('');

    // setWords に関数を渡すと、更新直前の最新の配列を prevWords として受け取れます。
    setWords((prevWords) =>
      // map は配列の各要素を順番に確認し、新しい配列を作ります。
      prevWords.map((word) =>
        word.id === id
          // ID が一致する行だけ、スプレッド構文 (...) でコピーして値を差し替えます。
          // 英語を変更したら、以前の翻訳候補は古くなるため消します。
          ? { ...word, english: value, japanese: '', japaneseOptions: [] }
          // ID が違う行は、そのまま残します。
          : word
      )
    );
  };

  // 日本語の候補が選択されたときに、対象の行の japanese だけを更新します。
  const handleJapaneseChange = (id: string, value: string): void => {
    if (errorMessage) setErrorMessage('');
    setWords((prevWords) =>
      prevWords.map((word) =>
        word.id === id ? { ...word, japanese: value } : word
      )
    );
  };

  // 「行を追加する」ボタンが押されたときの処理です。
  const handleAddRow = (): void => {
    if (isLoading) return;
    if (errorMessage) setErrorMessage('');//一旦エラーを消して。

    // Date.now() は現在時刻を数字で返します。
    // 文字列に変換して、既存の行と重ならないIDとして使います。
    const newId = Date.now().toString();
    setWords((prevWords) => [
      // 既存の行を残したまま、末尾に新しい空行を追加します。
      ...prevWords,
      { id: newId, english: '', japanese: '', japaneseOptions: [] },
    ]);
  };

  // 行の削除ボタンが押されたときの処理です。
  const handleRemoveRow = (id: string): void => {
    // 入力行が1行だけのときは、空の画面にならないよう削除しません。
    if (words.length <= 1) return;
    if (errorMessage) setErrorMessage('');

    // filter は、条件に合う要素だけを残した新しい配列を作ります。
    // ここでは、削除対象のIDと異なる行だけを残しています。
    setWords((prevWords) => prevWords.filter((word) => word.id !== id));
  };

  // 入力された英単語のバリデーション（入力チェック）を行います。
  const validateEnglishInputs = (): boolean => {
    // 空文字チェック：1行でも空の行があれば弾きます
    const hasEmpty = words.some((w) => w.english.trim() === '');
    if (hasEmpty) {
      setErrorMessage('すべての行に英単語を入力してください。');
      return false;
    }

    // 45文字制限チェック：45時の理由は最長の英単語。Pneumonoultramicroscopicsilicovolcanoconiosis
    const isOverLength = words.some((w) => w.english.trim().length > MAX_WORD_LENGTH);
    if (isOverLength) {
      setErrorMessage(`英単語は${MAX_WORD_LENGTH}文字以内で入力してください。`);
      return false;
    }

    // 日本語混入チェック（半角英字・スペース・ハイフン・アポストロフィのみ許容）
    // ひらがな・カタカナ・漢字・全角文字が含まれている場合は false になります。
    const englishPattern = /^[a-zA-Z\s\-']+$/;
    const hasInvalidChar = words.some((w) => !englishPattern.test(w.english.trim()));
    if (hasInvalidChar) {
      setErrorMessage('英語欄には半角英字のみを入力してください（日本語は含められません）。');
      return false;
    }

    return true;
  };

  // 「翻訳を取得」ボタンの処理です。本番API（POST /api/words/translate）と通信します。
  const handleFetchTranslations = async (): Promise<void> => {
    // 送信前にバリデーションを実施
    if (!validateEnglishInputs()) return;

    setErrorMessage('');
    setIsLoading(true);

    // 入力されている英単語の配列を作成します。
    // 小文字に統一し、前後の空白を除去し、API用のデータ形式へ整えます。
    const englishWordList = words.map((w) => w.english.trim().toLowerCase());

    // 本番API仕様書に合わせたリクエストボディ { words: string[] }
    const requestBody = {
      words: englishWordList,
    };

    try {
      // 本番AI翻訳APIへPOSTリクエストを送信
      const response = await fetch('/api/words/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '翻訳候補の取得に失敗しました');
      }

      // レスポンス受け取り { translations: [{ english: "...", options: [...] }] }
      // APIから返ってきた候補を、画面の各入力行（words）に反映します。
      const hasNotFound = data.translations?.some(
        (item: { options: string[] }) =>
          item.options?.length === 1 && item.options[0] === NOT_FOUND_TEXT
      );

      setWords((prevWords) =>
        prevWords.map((word) => {
          // 入力された英語と一致する候補結果を探します。
          const matched = data.translations?.find(
            (item: { english: string; options: string[] }) =>
              item.english.toLowerCase() === word.english.trim().toLowerCase()
          );

          let options = matched ? matched.options : [];
          let nextJapanese = '';

          if (options.length === 1 && options[0] === NOT_FOUND_TEXT) {
            // NOT_FOUND_TEXT だけが届いた場合は候補に入れず空にします
            options = [];
            nextJapanese = '';
          } else if (word.japanese && options.includes(word.japanese)) {
            // 以前の選択がまだ使えるならそれを維持
            nextJapanese = word.japanese;
          } else {
            // どちらでもなければ空文字にする
            nextJapanese = '';
          }

          return {
            ...word,
            japaneseOptions: options,
            japanese: nextJapanese,
          };
        })
      );

      if (hasNotFound) {
        setErrorMessage('単語が見つかりませんでした。一般的でないか、スペルミスの可能性があります。');
      }
    } catch (error: unknown) {
      console.error(error);
      // 失敗時はユーザーに通知し、そのまま再試行できるようにします。
      const message = error instanceof Error ? error.message : '';
      setErrorMessage(message || '翻訳の取得に失敗しました。もう一度「翻訳を取得」を押して再試行してください。');
    } finally {
      setIsLoading(false);
    }
  };

  // 「この単語で登録する」ボタンの処理です。本番API（POST /api/words）にデータを送信します。
  const handleRegisterSubmit = async (): Promise<void> => {
    // 日本語訳が未選択の行がないかチェック（プルダウンを選んでいない行を防止）
    const isMissingJapanese = words.some((w) => w.japanese.trim() === '');
    if (isMissingJapanese) {
      setErrorMessage('すべての単語の日本語訳を選択してください。');
      return;
    }

    // 「辞書に登録されていません」となった単語を除外（削る）します。
    const validWords = words.filter(
      (w) => w.japanese.trim() !== NOT_FOUND_TEXT
    );

    // 有効な単語が1つも残らなかった場合は登録できないようにブロックします。
    if (validWords.length === 0) {
      setErrorMessage('登録できる単語がありません（すべての単語が辞書未登録です）。');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    // RegisterWordsRequest の型定義に準拠したデータ構造を作成
    // WordInput[] の形式に整形
    const formattedWords = validWords.map(({ english, japanese }) => ({
      english: english.trim(),
      japanese: japanese.trim(),
    }));

    // RegisterWordsRequest { userId: number; words: WordInput[] } を構築
    // 一つ上のブロックで作った配列と、IDを会わせて、JSONにして送っている★★★★★★★★
    const registerPayload = {
      userId: DEFAULT_USER_ID,
      words: formattedWords,
    };

    try {
      // 本番の単語登録API（POST /api/words）に送信
      const response = await fetch('/api/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '単語の登録に失敗しました');
      }

      // 今回の登録結果だけを保存し、物語生成では過去の登録単語を使わないようにします。
      const savedWords = Array.isArray(data.data) ? data.data : [];
      if (savedWords.length === 0) {
        throw new Error('登録された単語データを取得できませんでした');
      }
      sessionStorage.setItem('latestRegisteredWords', JSON.stringify(savedWords));

      // 登録成功時は、登録された単語の meaning_id をクエリに持たせて物語生成画面（/stories/new）へ遷移します。
      const meaningIds = savedWords
        .map((item: { meaning_id: number }) => item.meaning_id)
        .join(',');
      router.push(meaningIds ? `/stories/new?meaningIds=${meaningIds}` : '/stories/new');
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : '';
      setErrorMessage(message || '登録処理中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  // 画面下部に表示するボタンの状態を決めるための判定です。
  // すべての行で翻訳候補が生成されているかを判定します。
  // 1行でも japaneseOptions が空の行（編集された行や新規追加行）があれば false になり、「翻訳を取得」ボタンに戻ります。
  const isAllOptionsGenerated =
    words.length > 0 && words.every((w) => w.japaneseOptions.length > 0);

  // 英語が1つでも入力されていれば、翻訳取得ボタンを押せるようにします。
  const hasEnglishInput = words.some((w) => w.english.trim() !== '');
  // すべての行で日本語訳が選択されていれば、登録ボタンを押せるようにします。
  const isAllJapaneseSelected =
    words.length > 0 && words.every((w) => w.japanese.trim() !== '');

  return (
    <main className="min-h-screen py-10 px-4 text-[#f5e6ab] flex justify-center items-start">
      <div className="w-full max-w-[480px] sunset-glass-card p-6 sm:p-8 rounded-3xl border border-[#e79f4d]/30 shadow-2xl relative overflow-hidden">
        {/* Decorative sunset glow background circle */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#dd7c5d]/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-8">

          <h1 className="text-2xl font-extrabold tracking-wide sunset-gradient-text">
            単語を登録する
          </h1>
          <p className="text-xs text-[#f5e6ab]/70 mt-1">
            覚えたい英単語を入力し、翻訳を取得して物語を生成しましょう
          </p>
        </div>

        {/* 単語入力行 */}
        <div className="mb-6 space-y-2">
          {words.map((item, index) => (
            <WordInputRow
              key={item.id}
              item={item}
              index={index}
              canDelete={words.length > 1}
              onEnglishChange={handleEnglishChange}
              onJapaneseChange={handleJapaneseChange}
              onRemoveRow={handleRemoveRow}
            />
          ))}
        </div>

        {/* 行追加ボタン */}
        <button
          type="button"
          disabled={isLoading}
          onClick={handleAddRow}
          className={`w-full py-3 mb-6 border-2 border-dashed rounded-2xl font-bold flex items-center justify-center gap-2 text-sm transition-all ${
            isAllOptionsGenerated || isLoading
              ? 'border-[#3c3876]/40 text-[#f5e6ab]/30 bg-[#0f0f28]/30 cursor-not-allowed'
              : 'border-[#5f448a] text-[#e79f4d] hover:bg-[#5f448a]/30 hover:border-[#e79f4d] cursor-pointer'
          }`}
        >
          <span className="text-lg font-bold leading-none">＋</span>
          <span>単語行を追加する</span>
        </button>

        {/* エラーメッセージ表示エリア */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-[#823228]/40 border border-[#ba666b]/60 rounded-2xl text-xs text-[#f5e6ab] leading-relaxed flex items-start gap-2 shadow-md">
            <span className="text-base shrink-0">⚠️</span>
            <div>{errorMessage}</div>
          </div>
        )}

        {/* アクションボタン */}
        {!isAllOptionsGenerated ? (
          <button
            type="button"
            disabled={!hasEnglishInput || isLoading}
            onClick={handleFetchTranslations}
            className={`w-full py-3.5 font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 ${
              hasEnglishInput && !isLoading
                ? 'sunset-btn-primary cursor-pointer'
                : 'bg-[#3c3876]/40 text-[#f5e6ab]/30 border border-[#3c3876]/60 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-[#f5e6ab] border-t-transparent rounded-full"></span>
                <span>翻訳を取得中...</span>
              </>
            ) : (
              <>
                <span> 翻訳を取得</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            disabled={!isAllJapaneseSelected || isLoading}
            onClick={handleRegisterSubmit}
            className={`w-full py-3.5 font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 ${
              isAllJapaneseSelected && !isLoading
                ? 'bg-gradient-to-r from-[#dd7c5d] via-[#ba666b] to-[#5f448a] text-white hover:brightness-110 shadow-lg cursor-pointer'
                : 'bg-[#3c3876]/40 text-[#f5e6ab]/30 border border-[#3c3876]/60 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                <span>登録中...</span>
              </>
            ) : (
              <>
                <span>この単語で物語をつくる ➔</span>
              </>
            )}
          </button>
        )}
      </div>
    </main>
  );
}

