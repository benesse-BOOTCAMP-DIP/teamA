import { NextResponse } from "next/server";
import { GoogleGenAI, Type, type Schema } from "@google/genai";

// 1. クライアントの初期化
// GEMINI_API_KEY 環境変数を明示的に渡す
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY が環境変数に設定されていません");
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * フロントエンドから送信される単語情報の型定義
 */
export interface StoryWordInput {
  meaningId: number;
  word: string;
  meaning: string;
}

/**
 * リクエストボディの型定義
 */
export interface GenerateStoryRequest {
  words: StoryWordInput[];
}

/**
 * 物語中で使用された各単語の情報の型定義
 */
export interface GeneratedStoryWord {
  meaningId: number;
  word: string;
  surfaces: string[];
}

/**
 * 物語生成APIのレスポンスボディの型定義(その単語が物語中でどのように使用されたかを含む)
 */
export interface GenerateStoryResponse {
  title: string;
  story: string;
  japaneseStory: string;
  words: GeneratedStoryWord[];
}

// 2. Gemini用のレスポンススキーマ定義（JSONの構造を固定する）
const storySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "物語の魅力的な日本語タイトル（例: 「朝の公園ルーティン」）",
    },
    story: {
      type: Type.STRING,
      description:
        "指定された単語をすべて使用した、自然な英語のショートストーリー（高校生レベルの読みやすい英文、3〜5文程度）",
    },
    japaneseStory: {
      type: Type.STRING,
      description: "英文ストーリーの自然な日本語訳",
    },
    words: {
      type: Type.ARRAY,
      description:
        "各入力単語が物語の中で実際にどのような形（活用形など）で使用されたかのリスト",
      items: {
        type: Type.OBJECT,
        properties: {
          meaningId: {
            type: Type.INTEGER,
            description: "入力された単語の meaningId",
          },
          word: {
            type: Type.STRING,
            description: "元の英単語",
          },
          surfaces: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
            description:
              "物語の中で実際に使用された形（例: run なら ran や running など、使用されたすべての形）",
          },
        },
        required: ["meaningId", "word", "surfaces"],
      },
    },
  },
  required: ["title", "story", "japaneseStory", "words"],
};

/**
 * Gemini API を呼び出してショートストーリーを生成する処理
 * 返り値: { title, story, japaneseStory, words: [{ meaningId, word, surfaces }] }
 */
async function generateStory(
  words: StoryWordInput[],
): Promise<GenerateStoryResponse> {
  const wordListText = words
    .map(
      (item, index) =>
        `${index + 1}. [ID: ${item.meaningId}] ${item.word}（意味: ${item.meaning}）`,
    )
    .join("\n");

  const prompt = `
あなたは英語学習者向けのストーリーテラーです。
以下の「単語リスト」に含まれるすべての単語を使用して、高校生（英語コミュニケーションⅡレベル）が楽しく読める、自然な英語のショートストーリーを作成してください。

【要件】
1. タイトルは親しみやすい【日本語】にしてください（例: 「朝の公園ルーティン」）。
2. ストーリーは短編（3〜5文程度、80〜150語程度）で、高校2年生が理解しやすい自然な英文にしてください。
3. 文脈に合わせて単語の活用形（過去形、進行形、複数形など）を自由に変えて構いません。指定された意味に沿った文脈で使用してください。
4. 各単語について、英文本文中で実際にどのような形で使用されたか（活用形など）を "surfaces" 配列にすべて記録してください。元の meaningId と単語スペルを保持してください。
5. 全文の自然な日本語訳（japaneseStory）も作成してください。

【単語リスト】
${wordListText}
  `.trim();

  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    // model: "gemini-3.6-flash",
    model: "gemini-3.1-flash-lite",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: storySchema,
      temperature: 0.7, // ストーリーの創造性を出すため0.7に設定
    },
  });

  if (!response.text) {
    throw new Error("Gemini APIからレスポンスを取得できませんでした。");
  }
  //返ってきたテキストをオブジェクトに変換して返す
  return JSON.parse(response.text) as GenerateStoryResponse;
}

/**
 * POST ハンドラー (API Endpoint: POST /api/stories/generate)
 * フロントエンドから送信された単語リストを受け取り、Gemini でショートストーリーを生成して返す
 *
 * Request: JSON { "words": [ { "meaningId": 1, "word": "run", "meaning": "走る" }, ... ] }
 * Response: JSON { "title": "朝の公園ルーティン", "story": "...", "japaneseStory": "...", "words": [...] }
 */
export async function POST(request: Request) {
  try {
    //フロントエンドから送信されたリクエストボディを取得
    const body: Partial<GenerateStoryRequest> = await request.json();

    // 1. リクエストボディの基本チェック（words 配列が存在するか）
    if (!body || !Array.isArray(body.words) || body.words.length === 0) {
      return NextResponse.json(
        { error: "単語の配列（words）が指定されていません" },
        { status: 400 },
      );
    }

    // 2. 各単語のバリデーションチェック（meaningId, word, meaning の存在確認）
    const validWords: StoryWordInput[] = [];
    for (const item of body.words) {
      if (
        typeof item.meaningId !== "number" ||
        typeof item.word !== "string" ||
        item.word.trim() === "" ||
        typeof item.meaning !== "string" ||
        item.meaning.trim() === ""
      ) {
        return NextResponse.json(
          {
            error:
              "単語のデータ形式が不正です（meaningId, word, meaning は必須です）",
          },
          { status: 400 },
        );
      }
      validWords.push({
        meaningId: item.meaningId,
        word: item.word.trim(),
        meaning: item.meaning.trim(),
      });
    }

    // 3. Gemini による物語生成処理
    const result = await generateStory(validWords);

    // 4. 成功レスポンス（200 OK）
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("物語生成エラー:", error);

    // Gemini API の利用制限（429 Too Many Requests / RESOURCE_EXHAUSTED）を検知
    if (
      error?.status === 429 ||
      error?.message?.includes("429") ||
      error?.message?.includes("quota") ||
      error?.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      return NextResponse.json(
        {
          error:
            "AIの利用制限に達しました。しばらく時間を置いてから再度お試しください",
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: "物語の生成に失敗しました" },
      { status: 500 },
    );
  }
}
