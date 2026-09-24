import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 画像生成リクエストボディの型定義
 */
export interface GenerateImageRequest {
  story: string;
  title?: string;
}

/**
 * レスポンスに含まれる画像情報の型定義
 */
export interface StoryImageInfo {
  url: string;
  alt: string;
}

/**
 * 画像生成レスポンスボディの型定義
 */
export interface GenerateImageResponse {
  success: boolean;
  image?: StoryImageInfo;
  error?: string;
}

/**
 * POST /api/stories/generate-image
 * 物語の英文を元に挿絵イラストを生成し、Supabase Storage に保存して公開URLを返却するAPI
 */
export async function POST(request: Request) {
  try {
    // 1. リクエストボディのJSONパース
    const body: GenerateImageRequest = await request.json();

    // 2. 入力値バリデーション
    if (
      !body ||
      !body.story ||
      typeof body.story !== "string" ||
      body.story.trim() === ""
    ) {
      return NextResponse.json(
        { error: "物語の本文（story）を入力してください" },
        { status: 400 },
      );
    }

    const storyText = body.story.trim();
    const titleText = body.title?.trim() || "物語の挿絵イラスト";

    // 3. AI画像生成用プロンプトの構築（高校生向け英語教材らしい温かいアニメ調スタイル）
    const imagePrompt = `Anime-style illustration for high school English learning textbook, warm, clean, friendly, vibrant colors, depicting the scene: ${storyText}. High quality, beautiful scenery, no text, no letters, no typography`;

    // 4. 無料のAI画像生成エンジンで画像を生成（512x512 JPEG）
    const seed = Math.floor(Math.random() * 1000000);
    const generateUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=512&height=512&nologo=true&seed=${seed}`;

    const imageRes = await fetch(generateUrl);
    if (!imageRes.ok) {
      console.error("画像生成APIエラー:", imageRes.status, imageRes.statusText);
      return NextResponse.json(
        { error: "画像の生成に失敗しました" },
        { status: 500 },
      );
    }

    const arrayBuffer = await imageRes.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // 5. Supabase Storage の story-images バケットに保存
    const supabase = await createClient();
    const fileName = `story_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("story-images")
      .upload(fileName, imageBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase Storage アップロードエラー:", uploadError);
      return NextResponse.json(
        { error: "画像の生成に失敗しました" },
        { status: 500 },
      );
    }

    // 6. 保存した画像の公開URLを取得
    const { data: urlData } = supabase.storage
      .from("story-images")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // 7. 成功レスポンス返却
    const responseData: GenerateImageResponse = {
      success: true,
      image: {
        url: publicUrl,
        alt: titleText,
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (err) {
    console.error("画像生成処理で予期せぬエラー:", err);
    return NextResponse.json(
      { error: "画像の生成に失敗しました" },
      { status: 500 },
    );
  }
}
