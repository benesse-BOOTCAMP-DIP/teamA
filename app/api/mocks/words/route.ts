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
  id: number;
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
      id: 1,
      english: "fish",
      japanese: "魚",
    },
    {
      id: 2,
      english: "ramen",
      japanese: "ラーメン",
    },
  ],
};

/**
 * GET ハンドラー (API Endpoint: /api/mocks/words)
 */
export async function GET() {
  return NextResponse.json(MOCK_DATA);
}
