import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 物語に含まれる単語と活用形の型定義
 */
export interface StoryMeaningInput {
  meaningId: number;
  surfaces: string[];
}

/**
 * 物語登録リクエストボディの型定義
 */
export interface RegisterStoryRequest {
  userId: number;
  title: string;
  story: string;
  japaneseStory?: string;
  words: StoryMeaningInput[];
}

/**
 * 物語登録レスポンスボディの型定義
 */
export interface RegisterStoryResponse {
  success: boolean;
  data?: {
    storyId: number;
    title: string;
    createdAt: string;
  };
  error?: string;
}

/**
 * POST /api/stories
 * 生成・プレビューされた物語をデータベースに保存するAPI
 */
export async function POST(request: Request) {
  try {
    // 1. リクエストボディのJSONパース
    const body: RegisterStoryRequest = await request.json();

    // 2. 入力値バリデーション
    if (!body.userId || typeof body.userId !== "number") {
      return NextResponse.json(
        { error: "有効なユーザーIDを指定してください" },
        { status: 400 },
      );
    }

    if (
      !body.title ||
      typeof body.title !== "string" ||
      body.title.trim() === "" ||
      !body.story ||
      typeof body.story !== "string" ||
      body.story.trim() === ""
    ) {
      return NextResponse.json(
        { error: "タイトルおよび英文本文を入力してください" },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.words)) {
      return NextResponse.json(
        { error: "単語リスト（words）の形式が正しくありません" },
        { status: 400 },
      );
    }

    // 3. Supabase クライアント初期化
    const supabase = await createClient();

    // 4. stories テーブルに物語本体を保存
    const { data: storyData, error: storyError } = await supabase
      .from("stories")
      .insert({
        user_id: body.userId,
        title: body.title.trim(),
        story: body.story.trim(),
        japanese_story: body.japaneseStory?.trim() || null,
      })
      .select("story_id, title, created_at")
      .single();

    if (storyError || !storyData) {
      console.error("stories 登録エラー:", storyError);
      return NextResponse.json(
        { error: "物語の登録処理中に予期せぬエラーが発生しました" },
        { status: 500 },
      );
    }

    // 5. meaning_story 中間テーブルに単語・活用形を保存
    if (body.words.length > 0) {
      const relationRecords = body.words.map((item) => ({
        story_id: storyData.story_id,
        meaning_id: item.meaningId,
        surfaces: Array.isArray(item.surfaces) ? item.surfaces : [],
      }));

      const { error: relationError } = await supabase
        .from("meaning_story")
        .insert(relationRecords);

      if (relationError) {
        console.error("meaning_story 登録エラー:", relationError);
        // データ不整合（孤立レコード）を防ぐため、作成した story を削除してロールバック
        await supabase
          .from("stories")
          .delete()
          .eq("story_id", storyData.story_id);

        return NextResponse.json(
          { error: "物語と単語の紐付け登録に失敗しました" },
          { status: 500 },
        );
      }
    }

    // 6. 成功レスポンスを返却
    const responseData: RegisterStoryResponse = {
      success: true,
      data: {
        storyId: storyData.story_id,
        title: storyData.title,
        createdAt: storyData.created_at,
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (err) {
    console.error("予期せぬエラー:", err);
    return NextResponse.json(
      { error: "物語の登録処理中に予期せぬエラーが発生しました" },
      { status: 500 },
    );
  }
}
