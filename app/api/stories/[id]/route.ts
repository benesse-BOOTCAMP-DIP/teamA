import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 物語詳細で返却する単語アイテムの型定義
 */
export interface StoryDetailWord {
  meaningId: number;
  english: string;
  japanese: string;
  surfaces: string[];
}

/**
 * 物語詳細レスポンスボディの型定義
 */
export interface StoryDetailResponse {
  storyId: number;
  title: string;
  story: string;
  japaneseStory: string;
  createdAt: string;
  words: StoryDetailWord[]; //物語に含まれる単語と活用形のリスト
}

/**
 * GET /api/stories/[id]
 * 指定された物語の詳細情報（本文、和訳、含まれる単語一覧・活用形）を取得するAPI
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. パスパラメータから id を取得してバリデーション
    const { id } = await params;
    const storyId = Number(id);

    if (isNaN(storyId) || storyId <= 0) {
      return NextResponse.json(
        { error: "有効な物語ID（数値）を指定してください" },
        { status: 400 },
      );
    }

    // 2. Supabase クライアントの初期化
    const supabase = await createClient();

    // 3. stories テーブルから物語本体を取得
    const { data: storyData, error: storyError } = await supabase
      .from("stories")
      .select("story_id, title, story, japanese_story, created_at")
      .eq("story_id", storyId)
      .maybeSingle();

    if (storyError) {
      console.error("stories 取得エラー:", storyError);
      return NextResponse.json(
        { error: "物語詳細の取得処理中に予期せぬエラーが発生しました" },
        { status: 500 },
      );
    }

    // 物語が存在しない場合は 404 を返却
    if (!storyData) {
      return NextResponse.json(
        { error: "指定された物語が見つかりません" },
        { status: 404 },
      );
    }

    // 4. meaning_story テーブルから関連する単語と表記ゆれ（活用形）を取得
    const { data: relationsData, error: relationsError } = await supabase
      .from("meaning_story")
      .select(
        `
        meaning_id,
        surfaces,
        meanings (
          meaning_id,
          meaning,
          words (
            word_id,
            word
          )
        )
      `,
      )
      .eq("story_id", storyId);

    if (relationsError) {
      console.error("meaning_story 取得エラー:", relationsError);
      return NextResponse.json(
        { error: "物語詳細の取得処理中に予期せぬエラーが発生しました" },
        { status: 500 },
      );
    }

    // 5. 単語リストをレスポンスの形式に整形
    const words: StoryDetailWord[] = (relationsData || []).map((item: any) => {
      const meaningObj = Array.isArray(item.meanings)
        ? item.meanings[0]
        : item.meanings;
      const wordObj = meaningObj
        ? Array.isArray(meaningObj.words)
          ? meaningObj.words[0]
          : meaningObj.words
        : null;

      return {
        meaningId: item.meaning_id,
        english: wordObj?.word ?? "",
        japanese: meaningObj?.meaning ?? "",
        surfaces: Array.isArray(item.surfaces) ? item.surfaces : [],
      };
    });

    // 6. 成功レスポンスを返却
    const responseData: StoryDetailResponse = {
      storyId: storyData.story_id,
      title: storyData.title ?? "",
      story: storyData.story ?? "",
      japaneseStory: storyData.japanese_story ?? "",
      createdAt: storyData.created_at,
      words,
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (err) {
    console.error("物語詳細取得で予期せぬエラー:", err);
    return NextResponse.json(
      { error: "物語詳細の取得処理中に予期せぬエラーが発生しました" },
      { status: 500 },
    );
  }
}
