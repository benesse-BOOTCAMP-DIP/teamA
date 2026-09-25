# Cloudflare Workers AI を TypeScript (Next.js) で動かす実装ガイド

Cloudflare Workers を別途デプロイする必要はありません。**Next.js の Route Handler から直接 Cloudflare の REST API を叩く**ことで、クレジットカード登録不要の毎日無料枠（10,000 Neurons / 日）を活用できます。

---

## 1. 事前準備（認証情報の取得）

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) にログイン（未登録の場合は無料アカウントを作成）。
2. ホーム画面またはダッシュボード右側のサイドバーに表示されている **アカウント ID (Account ID)** を控えます。
3. **マイ プロファイル > API トークン > トークンを作成** に進みます。
4. テンプレート一覧から **「Workers AI (Workers AI を使用)」** を選択、またはカスタムトークンで以下を設定して作成します:
   - **アカウント / Workers AI / 読み取り (Read)**
5. 発行された **API トークン** を控えます。

プロジェクトルートの `.env.local` に以下を追記します:

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here
```

---

## 2. 実装コード (`app/api/stories/generate-image/route.ts`)

Pollinations を呼び出していた箇所を、Cloudflare の REST API エンドポイントに置き換えます。

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertTextsAreSafe, ModerationFlaggedError } from "@/lib/ai/moderation";

/**
 * リクエストボディ型定義
 */
export interface GenerateImageRequest {
  story: string;
  title?: string;
}

/**
 * レスポンス画像情報型定義
 */
export interface StoryImageInfo {
  url: string;
  alt: string;
}

/**
 * レスポンスボディ型定義
 */
export interface GenerateImageResponse {
  success: boolean;
  image?: StoryImageInfo;
  error?: string;
}

/**
 * POST /api/stories/generate-image
 * 物語のテキストから挿絵を生成し、Supabase Storage に保存して公開URLを返却する
 */
export async function POST(request: Request) {
  try {
    // 1. リクエストボディのパース
    const body: GenerateImageRequest = await request.json();

    // 2. 入力バリデーション
    if (!body || !body.story || typeof body.story !== "string" || body.story.trim() === "") {
      return NextResponse.json(
        { success: false, error: "物語の本文（story）を入力してください" },
        { status: 400 }
      );
    }

    if (body.story.trim().length > 1000) {
      return NextResponse.json(
        { success: false, error: "物語の本文は1000文字以内で入力してください" },
        { status: 400 }
      );
    }

    if (body.title && typeof body.title === "string" && body.title.trim().length > 100) {
      return NextResponse.json(
        { success: false, error: "タイトルは100文字以内で入力してください" },
        { status: 400 }
      );
    }

    const storyText = body.story.trim();
    const titleText = body.title?.trim() || "物語の挿絵イラスト";

    // 3. モデレーションチェック
    await assertTextsAreSafe([storyText, titleText]);

    // 4. プロンプトの構築
    const imagePrompt = `Anime-style illustration for high school English learning textbook, warm, clean, friendly, vibrant colors, depicting the scene: ${storyText}. High quality, beautiful scenery, no text, no letters, no typography`;

    // 5. Cloudflare Workers AI の REST API を呼び出し
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      console.error("Cloudflare の認証情報が設定されていません");
      return NextResponse.json(
        { success: false, error: "サーバー設定エラーが発生しました" },
        { status: 500 }
      );
    }

    // 消費 Neurons を抑えられる SDXL Lightning (ステップ数 4〜8 推奨)
    const model = "@cf/bytedance/stable-diffusion-xl-lightning";
    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

    const cfRes = await fetch(cfUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        num_steps: 4, // ステップ数を少なくすることで計算コストを削減
      }),
    });

    if (!cfRes.ok) {
      const errText = await cfRes.text();
      console.error("Cloudflare AI エラー:", cfRes.status, errText);

      // 1日の上限（10,000 Neurons）超過時
      if (cfRes.status === 429) {
        return NextResponse.json(
          {
            success: false,
            error: "本日の画像生成枠の上限に達しました。時間を置いて再度お試しください",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { success: false, error: "画像の生成に失敗しました" },
        { status: 500 }
      );
    }

    // Cloudflare Workers AI は画像バイナリ (image/png) を直接返す
    const arrayBuffer = await cfRes.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // 6. Supabase Storage (story-images) に保存
    const supabase = await createClient();
    const fileName = `story_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.png`;

    const { error: uploadError } = await supabase.storage
      .from("story-images")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase Storage アップロードエラー:", uploadError);
      return NextResponse.json(
        { success: false, error: "画像の保存に失敗しました" },
        { status: 500 }
      );
    }

    // 7. 公開 URL を取得
    const { data: urlData } = supabase.storage
      .from("story-images")
      .getPublicUrl(fileName);

    return NextResponse.json(
      {
        success: true,
        image: {
          url: urlData.publicUrl,
          alt: titleText,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("画像生成処理で予期せぬエラー:", err);

    if (err instanceof ModerationFlaggedError) {
      return NextResponse.json(
        { success: false, error: "生成された内容が不適切と判定されました。再度お試しください" },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { success: false, error: "画像の生成に失敗しました" },
      { status: 500 }
    );
  }
}
```

---

## 3. 注意点・仕様

1. **返却フォーマットが PNG**
   - Cloudflare の画像生成モデルはバイナリとして `image/png` を返します。そのため、Supabase 保存時の拡張子を `.png`、`contentType` を `image/png` に合わせています。
2. **モデルの選択肢**
   - `@cf/bytedance/stable-diffusion-xl-lightning`（推奨）:
     - 高速かつ低消費（約 500〜800 Neurons / 回）。1日に約 12〜20 枚生成可能。
   - `@cf/black-forest-labs/flux-1-schnell`:
     - 描写力重視（約 800〜1,000 Neurons / 回）。1日に約 10〜12 枚生成可能。
3. **無料枠のリセット時刻**
   - 毎日 10,000 Neurons は **00:00 UTC（日本時間 午前 9:00）** にリセットされます。