import { NextResponse } from "next/server";

/**
 * ストーリーの型定義
 */
export interface Story {
  id: number;
  title: string;
  content: string;
}

/**
 * 単語の型定義
 */
export interface Word {
  meaning_id: number;
  word_id:number;
  english: string;
  japanese: string;
}

/**
 * モックレスポンス全体の型定義
 */
export interface MocksResponse {
  stories: Story[];
  words: Word[];
}

/**
 * モックデータ
 */
const MOCK_DATA: MocksResponse = {
  stories: [
    {
      id: 1,
      title: "魚とラーメン",
      content: "Ken has a fish. He likes ramen very much.",
    },
  ],
  words: [
    {
      meaning_id: 1,
      word_id:1,
      english: "book",
      japanese: "本",
    },
    {
      meaning_id: 2,
      word_id:2,
      english: "fish",
      japanese: "魚",
    },
    {
      meaning_id:3,
      word_id:3,
      english: "ramen",
      japanese: "ラーメン",
    },
    {
      meaning_id: 4,
      word_id:1,
      english: "book",
      japanese: "予約する",
    },
  ],
};

/**
 * GET ハンドラー (API Endpoint: /api/mocks/words)
 */
export async function GET() {
  return NextResponse.json(MOCK_DATA);
}
