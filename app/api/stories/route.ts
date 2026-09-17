import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 一覧取得で返す物語アイテムの型定義
 */
export interface StoryListItem {
  storyId: number;
  title: string;
  story: string;
  japaneseStory: string;
  createdAt: string;
}

/**
 * 一覧取得のレスポンスボディの型定義
 */
export interface StoryListResponse {
  stories: StoryListItem[];
}

/**
 * GET ハンドラー (API Endpoint: GET /api/stories)
 * ログイン中のユーザーが作成した物語一覧を登録日の新しい順（降順）で取得します。
 *
 * Query: ?userId=1 (必須)
 * Response: JSON { "stories": [ { "storyId": 10, "title": "...", "story": "...", "japaneseStory": "...", "createdAt": "..." } ] }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");

    // 1. クエリパラメータ userId のチェック
    if (!userIdParam) {
      return NextResponse.json(
        { error: "ユーザーID（userId）が指定されていません" },
        { status: 400 },
      );
    }

    const userId = Number(userIdParam);
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { error: "有効なユーザーIDを指定してください" },
        { status: 400 },
      );
    }

    // 2. Supabase へ接続して stories テーブルからデータ取得
    const supabase = await createClient();

    const { data: storiesData, error: storiesError } = await supabase
      .from("stories")
      .select("story_id, title, story, japanese_story, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (storiesError) {
      return NextResponse.json(
        { error: "物語一覧の取得に失敗しました" },
        { status: 500 },
      );
    }

    // 3. レスポンス用データに整形
    const stories: StoryListItem[] = (storiesData || []).map((s: any) => ({
      storyId: s.story_id,
      title: s.title ?? "",
      story: s.story ?? "",
      japaneseStory: s.japanese_story ?? "",
      createdAt: typeof s.created_at === "string" ? s.created_at : new Date(s.created_at).toISOString(),
    }));

    const responseData: StoryListResponse = {
      stories,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    return NextResponse.json(
      { error: "物語一覧の取得処理中に予期せぬエラーが発生しました" },
      { status: 500 },
    );
  }
}
