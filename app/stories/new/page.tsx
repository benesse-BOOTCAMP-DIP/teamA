'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import StoryEnglishView, { type StoryWordInfo } from '@/components/StoryEnglishView';

// ※他者が作成した和訳コンポーネント用スロット
// import JapaneseStoryView from '@/components/JapaneseStoryView';

interface GeneratedStoryResponse {
  title: string;
  story: string;
  japaneseStory: string;
  words: StoryWordInfo[];
}

interface RegisteredWord {
  meaning_id?: number;
  meaningId?: number;
  english?: string;
  word?: string;
  japanese?: string;
  meaning?: string;
}

interface StoredWordsData {
  data?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isRegisteredWord(value: unknown): value is RegisteredWord {
  return isRecord(value);
}

function getRegisteredWords(value: unknown): RegisteredWord[] {
  if (Array.isArray(value)) {
    return value.filter(isRegisteredWord);
  }

  if (isRecord(value)) {
    const storedData = value as StoredWordsData;
    return Array.isArray(storedData.data)
      ? storedData.data.filter(isRegisteredWord)
      : [];
  }

  return [];
}

export default function StoryGeneratorPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isJapaneseVisible, setIsJapaneseVisible] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [storyData, setStoryData] = useState<GeneratedStoryResponse | null>(null);

  // 物語生成処理（再生成ボタンからも呼び出せるよう関数化）
  const generateStory = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    setStoryData(null);

    try {
      // 1. 直前に登録した単語セットを取得
      const savedData = sessionStorage.getItem('latestRegisteredWords');
      if (!savedData) {
        throw new Error('登録された単語データが見つかりません。単語登録画面からやり直してください。');
      }

      const registeredWords = getRegisteredWords(JSON.parse(savedData));

      if (registeredWords.length === 0) {
        throw new Error('登録された単語リストが空です。');
      }

      // 返り値: 物語生成APIが受け取る単語情報の配列
      const requestPayload = {
        words: registeredWords.map((w) => ({
          meaningId: Number(w.meaning_id || w.meaningId),
          word: String(w.english || w.word || '').trim(),
          meaning: String(w.japanese || w.meaning || '').trim(),
        })),
      };

      if (
        requestPayload.words.some(
          (word) =>
            !Number.isFinite(word.meaningId) || !word.word || !word.meaning,
        )
      ) {
        throw new Error('登録された単語データの形式が不正です。');
      }

      // 3. 物語生成API（POST /api/stories/generate）を実行
      const genRes = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      const genJson = await genRes.json().catch(() => ({}));

      if (!genRes.ok) {
        throw new Error(
          genRes.status >= 500
            ? '物語生成サーバーでエラーが発生しました。時間を置いて再試行してください。'
            : genJson.error || `物語の生成に失敗しました (Status: ${genRes.status})`,
        );
      }

      setStoryData(genJson);
      setIsJapaneseVisible(false);
    } catch (error: unknown) {
      console.error('物語生成エラー:', error);
      const message = error instanceof Error ? error.message : '';
      setErrorMessage(message || '物語の生成中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 返り値: 物語をDBへ保存して一覧画面へ遷移するPromise
  const saveStoryAndNavigate = async (): Promise<void> => {
    if (!storyData || isSaving) return;

    setIsSaving(true);
    setErrorMessage('');

    try {
      const saveRes = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1,
          title: storyData.title,
          story: storyData.story,
          japaneseStory: storyData.japaneseStory,
          words: storyData.words.map((word) => ({
            meaningId: word.meaningId,
            surfaces: word.surfaces || [],
          })),
        }),
      });

      const saveJson = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok) {
        throw new Error(
          saveJson.error || `物語の登録に失敗しました (Status: ${saveRes.status})`,
        );
      }

      router.push('/list');
    } catch (error: unknown) {
      console.error('物語登録エラー:', error);
      const message = error instanceof Error ? error.message : '';
      setErrorMessage(message || '物語の登録中にエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 初回マウント時に自動生成を実行
  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void generateStory();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [generateStory]);

  return (
    <main className="min-h-screen py-10 px-4 flex justify-center items-start text-[#f5e6ab]">
      <div className="w-full max-w-[560px]">
        {/* ナビゲーションバー */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/register')}
            className="text-xs font-semibold text-[#e79f4d] hover:text-[#f5e6ab] transition flex items-center gap-1 bg-[#3c3876]/40 px-3 py-1.5 rounded-xl border border-[#3c3876]"
          >
            ← 単語登録へ戻る
          </button>

          <button
            type="button"
            onClick={saveStoryAndNavigate}
            disabled={isSaving || isLoading || !storyData}
            className="text-xs font-bold text-[#f5e6ab] bg-gradient-to-r from-[#dd7c5d] to-[#ba666b] px-3.5 py-1.5 rounded-xl shadow-md border border-[#e79f4d]/30 hover:brightness-110 transition disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '一覧へ保存 ➔'}
          </button>
        </div>

        {/* 生成中ローディング */}
        {isLoading && (
          <div className="sunset-glass-card rounded-3xl p-10 text-center border border-[#e79f4d]/30 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#5f448a]/20 to-[#dd7c5d]/20 animate-pulse pointer-events-none"></div>
            <div className="animate-spin h-10 w-10 border-3 border-[#dd7c5d] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-base font-bold sunset-gradient-text">夕焼けの物語を生成中...</p>
            <p className="text-xs text-[#f5e6ab]/60 mt-1.5">登録した英単語を使ってAIがストーリーを描いています</p>
          </div>
        )}

        {/* エラー表示と再試行ボタン */}
        {!isLoading && errorMessage && (
          <div className="bg-[#823228]/50 border border-[#ba666b] text-[#f5e6ab] p-6 rounded-3xl mb-6 text-xs shadow-xl">
            <p className="font-bold text-sm text-[#e79f4d] mb-1">⚠️ 生成エラー</p>
            <p className="mb-4 leading-relaxed">{errorMessage}</p>
            <button
              type="button"
              onClick={generateStory}
              className="bg-gradient-to-r from-[#dd7c5d] to-[#ba666b] text-white px-4 py-2 rounded-xl font-bold hover:brightness-110 transition shadow-md"
            >
              もう一度試す
            </button>
          </div>
        )}

        {/* 物語のメイン表示 */}
        {!isLoading && storyData && (
          <>
            <StoryEnglishView
              title={storyData.title}
              story={storyData.story}
              words={storyData.words}
            />

            {/* 和訳アコーディオン */}
            <section className="mb-6 sunset-glass-card rounded-2xl border border-[#3c3876] shadow-md overflow-hidden">
              <button
                type="button"
                onClick={() => setIsJapaneseVisible((visible) => !visible)}
                aria-expanded={isJapaneseVisible}
                className="w-full flex items-center justify-between gap-3 p-4 text-left text-sm font-bold text-[#f5e6ab] hover:bg-[#5f448a]/30 transition"
              >
                <span className="flex items-center gap-2">
                  <span>🇯🇵</span>
                  <span>日本語の和訳を見る</span>
                </span>
                <span aria-hidden="true" className="text-[#e79f4d] text-lg leading-none font-bold">
                  {isJapaneseVisible ? '−' : '+'}
                </span>
              </button>
              {isJapaneseVisible && (
                <div className="border-t border-[#3c3876]/80 p-5 bg-[#0f0f28]/60 text-sm leading-relaxed text-[#f5e6ab]/90 whitespace-pre-wrap font-sans">
                  {storyData.japaneseStory}
                </div>
              )}
            </section>

            {/* アクションボタン群 */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={generateStory}
                className="flex-1 py-3 bg-[#3c3876]/60 border border-[#e79f4d]/40 text-[#f5e6ab] hover:bg-[#5f448a]/60 font-bold rounded-2xl text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >

                <span>別の物語を再生成</span>
              </button>

              <button
                type="button"
                onClick={saveStoryAndNavigate}
                disabled={isSaving}
                className="flex-1 py-3 bg-gradient-to-r from-[#dd7c5d] via-[#ba666b] to-[#5f448a] text-white hover:brightness-110 font-bold rounded-2xl text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <span>保存処理中...</span>
                ) : (
                  <>
                    <span> 物語を保存して一覧へ</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
