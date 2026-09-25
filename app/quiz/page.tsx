"use client";

import { useState } from "react";
import styles from "./page.module.css";

type QuizWord = {
  meaningId: number;
  wordId: number;
  word: string;
  meaning: string;
  surfaces: string[];
};

type QuizStory = {
  storyId: number;
  title: string;
  story: string;
  japaneseStory: string;
  imageUrl: string | null;
  words: QuizWord[];
};

type QuizResponseData = {
  totalStories: number;
  stories: QuizStory[];
};

type RandomQuizResponse = {
  success: boolean;
  data?: QuizResponseData;
  error?: string;
};

type StoryPart =
  | { type: "text"; value: string }
  | {
      type: "blank";
      id: string;
      value: string;
      word: QuizWord;
    };

type BlankResult = {
  id: string;
  answer: string;
  isCorrect: boolean;
  word: QuizWord;
};

type StoryResult = {
  storyId: number;
  blanks: BlankResult[];
};

const QUIZ_API_URL = "/api/quiz/random";
const USER_ID = 1;
const QUIZ_LIMIT = 3;
const MAX_ANSWER_LENGTH = 45;
const ENGLISH_ANSWER_PATTERN = /^[a-zA-Z\s\-']+$/;

/**
 * 正規表現の特殊文字をエスケープする関数
 * @param value エスケープする文字列
 * @returns エスケープされた文字列
 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


/**
 * 物語の文章を解析し、テキスト部分と空欄部分に分割する関数
 * @param story 解析する物語データ
 * @returns 分割された物語のパーツの配列
 */
function buildStoryParts(story: QuizStory): StoryPart[] {
  const surfaceMap = new Map<string, QuizWord>();

  story.words.forEach((word) => {
    const surfaces = word.surfaces.length > 0 ? word.surfaces : [word.word];
    surfaces.forEach((surface) => {
      surfaceMap.set(surface.toLowerCase(), word);
    });
  });

  const surfaces = Array.from(surfaceMap.keys()).sort(
    (first, second) => second.length - first.length,
  );

  if (surfaces.length === 0) {
    return [{ type: "text", value: story.story }];
  }

  const matcher = new RegExp(`\\b(${surfaces.map(escapeRegExp).join("|")})\\b`, "gi");
  const parts: StoryPart[] = [];
  let lastIndex = 0;
  let blankNumber = 0;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(story.story)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        value: story.story.slice(lastIndex, match.index),
      });
    }

    const matchedSurface = match[0].toLowerCase();
    const word = surfaceMap.get(matchedSurface);
    if (!word) {
      parts.push({ type: "text", value: match[0] });
    } else {
      parts.push({
        type: "blank",
        id: `${story.storyId}-${blankNumber}`,
        value: match[0],
        word,
      });
      blankNumber += 1;
    }

    lastIndex = matcher.lastIndex;
  }

  if (lastIndex < story.story.length) {
    parts.push({ type: "text", value: story.story.slice(lastIndex) });
  }

  return parts;
}

/**
 * 空欄の答えを正規化する関数
 * @param value 正規化する文字列
 * @returns 正規化された文字列
 */

// 1. 引数の文字列をトリムして、先頭と末尾の空白を削除する
// 2. トリムした文字列を小文字に変換する
// 3. 変換した文字列を返す

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}

function getAcceptedAnswers(word: QuizWord): string[] {
  return Array.from(new Set([word.word, ...word.surfaces]));
}

function getAnswerValidationError(value: string): string {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return "";
  }

  if (trimmedValue.length > MAX_ANSWER_LENGTH) {
    return `回答は${MAX_ANSWER_LENGTH}文字以内で入力してください。`;
  }

  if (!ENGLISH_ANSWER_PATTERN.test(trimmedValue)) {
    return "回答は半角英字のみで入力してください。";
  }

  return "";
}



// この関数 `normalizeAnswer` は、与えられた文字列を正規化するための関数です。正規化とは、文字列を比較しやすい形に変換することを指します。この関数では、以下の3つのステップで文字列を処理しています。

// 1. **トリム**: 引数として渡された文字列の先頭と末尾の空白を削除します。これにより、余分な空白が答えの比較に影響を与えないようにします。 
// 2. **小文字変換**: トリムした文字列を小文字に変換します。これにより、大文字と小文字の違いによる比較の誤りを防ぎます。
// 3. **返却**: 変換した文字列を返します。
function isCorrectAnswer(answer: string, word: QuizWord): boolean {
  const normalizedAnswer = normalizeAnswer(answer);
  return getAcceptedAnswers(word).some(
    (correctAnswer) => normalizeAnswer(correctAnswer) === normalizedAnswer,
  );
}

export default function QuizPage() {
  const [quizData, setQuizData] = useState<QuizResponseData | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [storyResults, setStoryResults] = useState<StoryResult[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const currentStory = quizData?.stories[currentStoryIndex];
  const currentParts = currentStory ? buildStoryParts(currentStory) : [];
  const currentBlanks = currentParts.filter(
    (part): part is Extract<StoryPart, { type: "blank" }> =>
      part.type === "blank",
  );
  const totalQuestions = storyResults.reduce(
    (total, result) => total + result.blanks.length,
    0,
  );
  const totalCorrect = storyResults.reduce(
    (total, result) =>
      total + result.blanks.filter((blank) => blank.isCorrect).length,
    0,
  );
  const learnedWords = quizData
    ? Array.from(
        new Map(
          quizData.stories
            .flatMap((story) => story.words)
            .map((word) => [`${word.meaningId}-${word.wordId}`, word]),
        ).values(),
      )
    : [];

  async function handleStartQuiz(): Promise<void> {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `${QUIZ_API_URL}?userId=${USER_ID}&limit=${QUIZ_LIMIT}`,
      );
      const data: RandomQuizResponse = await response.json().catch(() => ({}));

      if (!response.ok || !data.success || !data.data?.stories.length) {
        throw new Error(data.error || "クイズデータの取得に失敗しました。");
      }

      setQuizData(data.data);
      setCurrentStoryIndex(0);
      setAnswers({});
      setStoryResults([]);
      setIsAnswered(false);
      setIsFinished(false);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "クイズデータの取得に失敗しました。",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleAnswerChange(id: string, value: string): void {
    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [id]: value,
    }));
  }

  function handleSubmitStory(): void {
    if (!currentStory || isAnswered) return;

    for (const blank of currentBlanks) {
      const validationError = getAnswerValidationError(answers[blank.id] || "");
      if (validationError) {
        setErrorMessage(validationError);
        return;
      }
    }

    const blanks = currentBlanks.map((blank) => ({
      id: blank.id,
      answer: answers[blank.id] || "",
      isCorrect: isCorrectAnswer(answers[blank.id] || "", blank.word),
      word: blank.word,
    }));

    setStoryResults((previousResults) => [
      ...previousResults.filter((result) => result.storyId !== currentStory.storyId),
      { storyId: currentStory.storyId, blanks },
    ]);
    setErrorMessage("");
    setIsAnswered(true);
  }

  function handleNextStory(): void {
    if (!quizData || !isAnswered) return;

    if (currentStoryIndex >= quizData.stories.length - 1) {
      setIsFinished(true);
      return;
    }

    setCurrentStoryIndex((previousIndex) => previousIndex + 1);
    setAnswers({});
    setIsAnswered(false);
    setErrorMessage("");
  }



  
  // この関数は、現在の物語の内容をレンダリングするために使用されます。
  // 物語の各パーツ（テキストや空欄）を順番に処理し、適切なコンポーネントを返します。
  function renderStoryContent(): React.ReactNode {
    return currentParts.map((part) => {
      if (part.type === "text") {
        return <span key={`${part.type}-${part.value}`}>{part.value}</span>;
      }

      const result = storyResults
        .find((storyResult) => storyResult.storyId === currentStory?.storyId)
        ?.blanks.find((blank) => blank.id === part.id);

      return (
        <span
          key={part.id}
          className={`inline-flex flex-col align-middle mx-1 ${
            result
              ? result.isCorrect
                ? styles.correctBlank
                : styles.wrongBlank
              : ""
          }`}
        >
          <input
            aria-label={`${part.word.meaning}の回答`}
            className={`min-w-24 border-b-2 bg-white px-2 py-1 text-center text-base outline-none ${
              result
                ? result.isCorrect
                  ? "border-emerald-500 text-emerald-700"
                  : "border-rose-500 text-rose-700"
                : "border-sky-500"
            }`}
            disabled={isAnswered}
            maxLength={MAX_ANSWER_LENGTH}
            value={answers[part.id] || ""}
            onChange={(event) => handleAnswerChange(part.id, event.target.value)}
            placeholder="入力"
          />
          {result && (
            <span
              className={`${styles.feedback} mt-1 text-center text-xs font-bold ${
                result.isCorrect ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {result.isCorrect
                ? "正解"
                : `正解: ${getAcceptedAnswers(result.word).join(" / ")}`}
            </span>
          )}
        </span>
      );
    });
  }

  return (
    <main className={`${styles.page} min-h-screen px-4 py-8 text-stone-800`}>
      <div className="mx-auto w-full max-w-[393px]">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">
            English Story Quiz
          </p>
          <h1 className="mt-2 text-3xl font-bold">物語クイズ</h1>
        </header>

        {!quizData && !isLoading && (
          <section className={`${styles.startCard} rounded-2xl border border-stone-200 bg-white p-6 shadow-sm`}>
            <h2 className="text-xl font-bold">保存した物語で学習する</h2>
            <p className="mt-3 leading-7 text-stone-600">
              英文の空欄を入力して、物語の中で覚えた単語を確認します。
            </p>
            <button
              type="button"
              onClick={handleStartQuiz}
              className={`${styles.startButton} mt-6 w-full rounded-xl bg-sky-600 px-4 py-3 font-bold text-white transition hover:bg-sky-700`}
            >
              クイズを開始
            </button>
          </section>
        )}

        {isLoading && (
          <p className={`${styles.loading} rounded-xl bg-white p-6 text-center text-stone-600`}>
            クイズを準備しています...
          </p>
        )}

        {errorMessage && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            {errorMessage}
          </p>
        )}

        {quizData && !isFinished && currentStory && (
          <section className={`${styles.quizCard} rounded-2xl border border-stone-200 bg-white p-6 shadow-sm`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-sky-600">
                  第 {currentStoryIndex + 1} 話 / {quizData.totalStories} 話
                </p>
                <h2 className="mt-1 text-xl font-bold">{currentStory.title}</h2>
              </div>
              <p className="text-sm text-stone-500">
                正解 {totalCorrect} / {totalQuestions}
              </p>
            </div>

            <div className="mt-5">
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressBar}
                  style={{
                    width: `${((currentStoryIndex + 1) / quizData.totalStories) * 100}%`,
                  }}
                />
              </div>
            </div>

            {currentStory.imageUrl && (
              <img
                src={currentStory.imageUrl}
                alt="物語の挿絵"
                className="mt-6 max-h-56 w-full rounded-xl object-cover"
              />
            )}

            <div className="mt-6 rounded-xl bg-sky-50 p-5 text-lg leading-10">
              {renderStoryContent()}
            </div>

            <div className="mt-6 border-t border-stone-200 pt-5">
              <p className="text-sm font-bold text-stone-500">日本語訳</p>
              <p className="mt-2 leading-7">{currentStory.japaneseStory}</p>
            </div>

            {currentStory.words.length > 0 && (
              <div className="mt-6 border-t border-stone-200 pt-5">
                <p className="text-sm font-bold text-stone-500">ヒント</p>
                <p className="mt-2 text-sm text-stone-600">
                  空欄の意味: {currentStory.words.map((word) => word.meaning).join(" / ")}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={isAnswered ? handleNextStory : handleSubmitStory}
              className="mt-6 w-full rounded-xl bg-stone-800 px-4 py-3 font-bold text-white transition hover:bg-stone-900"
            >
              {isAnswered
                ? currentStoryIndex === quizData.stories.length - 1
                  ? "結果を見る"
                  : "次の物語へ"
                : "回答する"}
            </button>
          </section>
        )}

        {isFinished && (
          <section className={`${styles.resultCard} rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm`}>
            <p className="text-sm font-bold text-sky-600">QUIZ COMPLETE</p>
            <h2 className="mt-2 text-2xl font-bold">おつかれさまでした</h2>
            <p className={`${styles.score} mt-5 text-4xl font-bold`}>
              {totalCorrect} / {totalQuestions}
            </p>
            <p className="mt-3 text-stone-600">正解しました</p>

            <div className="mt-8 border-t border-stone-200 pt-6 text-left">
              <h3 className="text-base font-bold text-stone-800">
                今回学んだ英単語
              </h3>
              <dl className="mt-3 divide-y divide-stone-200">
                {learnedWords.map((word) => (
                  <div
                    key={`${word.meaningId}-${word.wordId}`}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <dt className="font-bold text-stone-800">{word.word}</dt>
                    <dd className="text-right text-sm text-stone-600">
                      {word.meaning}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <button
              type="button"
              onClick={() => {
                setQuizData(null);
                setIsFinished(false);
                setStoryResults([]);
                setAnswers({});
                setIsAnswered(false);
              }}
              className="mt-8 w-full rounded-xl border border-stone-300 px-4 py-3 font-bold text-stone-700 transition hover:bg-stone-50"
            >
              もう一度挑戦する
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
