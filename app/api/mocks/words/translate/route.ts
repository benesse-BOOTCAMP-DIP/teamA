import { NextResponse } from "next/server";

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

/**
 * モック用の英和辞書データ
 */
const MOCK_DICTIONARY: Record<string, string[]> = {
  spring: ["春", "バネ", "温泉", "跳ぶ"],
  apple: ["りんご", "リンゴの木"],
  book: ["本", "予約する", "帳簿"],
  run: ["走る", "運営する", "運行する"],
  bank: ["銀行", "土手", "河岸"],
  light: ["光", "軽い", "点灯する", "明るい"],
  right: ["右", "正しい", "権利", "適切"],
  orange: ["オレンジ", "みかん色"],
  star: ["星", "主演する", "花形"],
  plant: ["植物", "工場", "植える"],
  fly: ["飛ぶ", "ハエ"],
  match: ["試合", "マッチ", "一致する"],
  watch: ["見る", "腕時計", "警戒する"],
  set: ["セット", "配置する", "沈む"],
};

/**
 * 英単語の配列を受け取り、それぞれの訳候補を返す処理関数
 * @param words 英語単語の配列
 * @returns 翻訳結果オブジェクト
 */
export function translateWords(words: string[]): TranslateResponse {
  const translations: TranslationOption[] = words.map((word) => {
    //空白を除去、小文字変換
    const key = word.trim().toLowerCase();
    const options = MOCK_DICTIONARY[key] ?? ["辞書に登録されていません"];

    return {
      english: word,
      options,
    };
  });

  return { translations };
}

/**
 * POST ハンドラー (API Endpoint 用)
 * Request: JSON { "words": ["spring", "apple"] }
 * Response: JSON { "translations": [...] }
 */
export async function POST(request: Request) {
  try {
    // 間違えて {} や { "foo": "bar" } のようなデータが送信される可能性があるためPartial<T>を使う
    const body: Partial<TranslateRequest> = await request.json();

    // body.words は undefined の可能性もあるため、安全にチェックする
    if (!body || !Array.isArray(body.words)) {
      return NextResponse.json(
        { error: "Invalid request body. 'words' array is required." },
        { status: 400 }
      );
    }

    const result = translateWords(body.words);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process translation request." },
      { status: 500 }
    );
  }
}
