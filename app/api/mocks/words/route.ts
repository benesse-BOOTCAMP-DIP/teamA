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
  {
    id: 2,
    title: "朝の公園",
    content: "Every morning, Ken runs to the park. He enjoys the fresh air.",
  },
  {
    id: 3,
    title: "小さな猫",
    content: "Mika has a small cat. The cat likes to sleep on her bed.",
  },
  {
    id: 4,
    title: "週末の料理",
    content: "Tom cooks pasta every Sunday. His family enjoys his cooking.",
  },
  {
    id: 5,
    title: "雨の日",
    content: "It is raining today. Sara stays home and reads a book.",
  },
  {
    id: 6,
    title: "新しい自転車",
    content: "John bought a new bicycle. He rides it to school every day.",
  },
  {
    id: 7,
    title: "公園の犬",
    content: "A cute dog is playing in the park. Its owner is watching nearby.",
  },
  {
    id: 8,
    title: "夏の海",
    content: "Yuki goes to the beach with her friends. They swim in the warm sea.",
  },
  {
    id: 9,
    title: "図書館で勉強",
    content: "Mike studies English at the library. He wants to learn many new words.",
  },
  {
    id: 10,
    title: "夜の星空",
    content: "Emma looks at the stars every night. She thinks the sky is very beautiful.",
  },
],
  words: [
  {
    meaning_id: 1,
    word_id: 1,
    english: "book",
    japanese: "本",
  },
  {
    meaning_id: 2,
    word_id: 1,
    english: "book",
    japanese: "予約する",
  },
  {
    meaning_id: 3,
    word_id: 2,
    english: "fish",
    japanese: "魚",
  },
  {
    meaning_id: 4,
    word_id: 3,
    english: "ramen",
    japanese: "ラーメン",
  },
  {
    meaning_id: 5,
    word_id: 4,
    english: "park",
    japanese: "公園",
  },
  {
    meaning_id: 6,
    word_id: 5,
    english: "run",
    japanese: "走る",
  },
  {
    meaning_id: 7,
    word_id: 5,
    english: "run",
    japanese: "運営する",
  },
  {
    meaning_id: 8,
    word_id: 6,
    english: "play",
    japanese: "遊ぶ",
  },
  {
    meaning_id: 9,
    word_id: 6,
    english: "play",
    japanese: "演奏する",
  },
  {
    meaning_id: 10,
    word_id: 7,
    english: "light",
    japanese: "光",
  },
  {
    meaning_id: 11,
    word_id: 7,
    english: "light",
    japanese: "軽い",
  },
  {
    meaning_id: 12,
    word_id: 8,
    english: "read",
    japanese: "読む",
  },
  {
    meaning_id: 13,
    word_id: 9,
    english: "school",
    japanese: "学校",
  },
  {
    meaning_id: 14,
    word_id: 10,
    english: "cat",
    japanese: "猫",
  },
  {
    meaning_id: 15,
    word_id: 11,
    english: "dog",
    japanese: "犬",
  },
  {
    meaning_id: 16,
    word_id: 12,
    english: "beautiful",
    japanese: "美しい",
  },
  {
    meaning_id: 17,
    word_id: 13,
    english: "jump",
    japanese: "跳ぶ",
  },
  {
    meaning_id: 18,
    word_id: 14,
    english: "cook",
    japanese: "料理する",
  },
  {
    meaning_id: 19,
    word_id: 15,
    english: "water",
    japanese: "水",
  },
  {
    meaning_id: 20,
    word_id: 16,
    english: "morning",
    japanese: "朝",
  },
  {
    meaning_id: 21,
    word_id: 17,
    english: "friend",
    japanese: "友達",
  },
  {
    meaning_id: 22,
    word_id: 18,
    english: "school",
    japanese: "学校",
  },
  {
    meaning_id: 23,
    word_id: 19,
    english: "home",
    japanese: "家",
  },
  {
    meaning_id: 24,
    word_id: 20,
    english: "star",
    japanese: "星",
  },
],
};

/**
 * GET ハンドラー (API Endpoint: /api/mocks/words)
 */
export async function GET() {
  return NextResponse.json(MOCK_DATA);
}
