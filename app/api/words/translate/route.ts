import { NextResponse } from "next/server";
import { GoogleGenAI, Type, type Schema } from "@google/genai";

// 1. クライアントの初期化
// GEMINI_API_KEY 環境変数を明示的に渡す（設定されていない場合はエラーハンドリング）
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY が環境変数に設定されていません");
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * リクエストボディの型定義
 */
export interface TranslateRequest {
  words: string[];
}

/**
 * 各単語の翻訳結果の型定義
 */
export interface TranslationOption {
  english: string;
  options: string[];
}

/**
 * レスポンスボディの型定義
 */
export interface TranslateResponse {
  translations: TranslationOption[];
}

// 2. Gemini用のレスポンススキーマ定義 (JSONの形を固定する)
const translateSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    translations: {
      type: Type.ARRAY,
      description: "各単語の翻訳結果のリスト",
      items: {
        type: Type.OBJECT,
        properties: {
          english: {
            type: Type.STRING,
            description: "入力された元の英単語",
          },
          options: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
            description:
              "その英単語の代表的な日本語の意味（よく使われる順に3〜5個程度）",
          },
        },
        required: ["english", "options"],
      },
    },
  },
  required: ["translations"],
};

/**
 * Gemini API を呼び出して英単語の日本語訳候補を生成する処理
 * 返り値: { translations: [ { english: "spring", options: ["春", "バネ", "跳ぶ"] } ] }
 */
async function generateTranslations(
  words: string[],
): Promise<TranslateResponse> {
  const wordListText = words
    .map((word, index) => `${index + 1}. ${word}`)
    .join("\n");

  const prompt = `
以下の「英単語のリスト」に含まれる各単語について、日本人英語学習者が単語帳に登録する際に役立つ代表的な日本語の意味（訳候補）を、よく使われる順に3〜5個挙げてください。
品詞（動詞、名詞など）によって意味が大きく異なる場合は、代表的な品詞の意味をバランスよく含めてください。
また、UIのプルダウンで選択しやすいように、簡潔な日本語表現（例: 「走る」「経営する」など）にしてください。

【英単語リスト】
${wordListText}
  `.trim();

  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: translateSchema,
      temperature: 0.3, // 辞書的な意味なので低めの温度でブレを防ぐ
    },
  });

  if (!response.text) {
    throw new Error("Gemini APIからレスポンスを取得できませんでした。");
  }

  return JSON.parse(response.text) as TranslateResponse;
}

/**
 * POST ハンドラー (API Endpoint: POST /api/words/translate)
 * フロントエンドから送信された英単語リストを受け取り、Gemini で意味候補を生成して返す
 *
 * Request: JSON { "words": ["spring", "run", "apple"] }
 * Response: JSON { "translations": [ { "english": "spring", "options": ["春", "バネ", "温泉"] } ] }
 */
export async function POST(request: Request) {
  try {
    const body: Partial<TranslateRequest> = await request.json();

    // 1. リクエストボディの基本チェック（words 配列が存在するか）
    if (!body || !Array.isArray(body.words) || body.words.length === 0) {
      return NextResponse.json(
        { error: "翻訳する単語の配列（words）が指定されていません" },
        { status: 400 },
      );
    }

    // 2. 空白の除去と空文字の除外
    const cleanedWords = body.words
      .map((w) => (typeof w === "string" ? w.trim() : ""))
      .filter((w) => w.length > 0);

    if (cleanedWords.length === 0) {
      return NextResponse.json(
        { error: "有効な英単語が指定されていません" },
        { status: 400 },
      );
    }

    // 3. Gemini による翻訳候補の生成
    const result = await generateTranslations(cleanedWords);

    // 4. 成功レスポンス（200 OK）
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/words/translate エラー:", error);
    return NextResponse.json(
      { error: "英単語の意味候補の取得に失敗しました" },
      { status: 500 },
    );
  }
}