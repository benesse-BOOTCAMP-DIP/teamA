import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ .env.local が見つかりません");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx !== -1) {
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    env[key] = val;
  }
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const BASE_URL = "http://localhost:3000";

async function main() {
  console.log("🌐 実際の HTTP サーバー (http://localhost:3000) に対する API 動作テストを開始します...\n");

  // 1. テスト用ユーザー準備
  let { data: user } = await supabase
    .from("users")
    .select("user_id")
    .limit(1)
    .maybeSingle();

  if (!user) {
    const { data: newUser } = await supabase
      .from("users")
      .insert({ name: "テストユーザー" })
      .select("user_id")
      .single();
    user = newUser;
  }

  // 2. DB に直接テスト用物語を作成
  console.log("--- [セットアップ] DBにテスト用物語を作成中... ---");
  const { data: newStory, error: createError } = await supabase
    .from("stories")
    .insert({
      user_id: user.user_id,
      title: "HTTP API削除テスト用物語",
      story: "HTTP API test story content.",
      japanese_story: "HTTP API削除テスト用コンテンツ",
    })
    .select("story_id")
    .single();

  if (createError || !newStory) {
    console.error("❌ テスト用物語作成エラー:", createError);
    return;
  }
  const storyId = newStory.story_id;
  console.log(`✅ 作成されたテスト用物語ID: ${storyId}`);

  // meaning_story 紐付け作成
  const { data: meaning } = await supabase
    .from("meanings")
    .select("meaning_id")
    .limit(1)
    .maybeSingle();

  if (meaning) {
    await supabase.from("meaning_story").insert({
      story_id: storyId,
      meaning_id: meaning.meaning_id,
      surfaces: ["test"],
    });
    console.log(`✅ テスト用 meaning_story 紐付け作成 (meaning_id=${meaning.meaning_id})`);
  }

  // テスト1: 異常系（不正なIDパラメータ）
  console.log("\n--- [テスト1] HTTP DELETE /api/stories/abc (400 Bad Request) ---");
  const res1 = await fetch(`${BASE_URL}/api/stories/abc`, { method: "DELETE" });
  const body1 = await res1.json();
  console.log("HTTP Status:", res1.status);
  console.log("Response Body:", body1);

  // テスト2: 異常系（存在しない物語ID）
  console.log("\n--- [テスト2] HTTP DELETE /api/stories/9999999 (404 Not Found) ---");
  const res2 = await fetch(`${BASE_URL}/api/stories/9999999`, { method: "DELETE" });
  const body2 = await res2.json();
  console.log("HTTP Status:", res2.status);
  console.log("Response Body:", body2);

  // テスト3: 正常系（作成した物語の削除）
  console.log(`\n--- [テスト3] HTTP DELETE /api/stories/${storyId} (200 OK) ---`);
  const res3 = await fetch(`${BASE_URL}/api/stories/${storyId}`, { method: "DELETE" });
  const body3 = await res3.json();
  console.log("HTTP Status:", res3.status);
  console.log("Response Body:", body3);

  // テスト4: 再度削除を試行 (404 Not Found)
  console.log(`\n--- [テスト4] HTTP DELETE /api/stories/${storyId} (再実行 -> 404 Not Found) ---`);
  const res4 = await fetch(`${BASE_URL}/api/stories/${storyId}`, { method: "DELETE" });
  const body4 = await res4.json();
  console.log("HTTP Status:", res4.status);
  console.log("Response Body:", body4);

  // 5. DB 直接確認
  const { data: checkStory } = await supabase
    .from("stories")
    .select("story_id")
    .eq("story_id", storyId)
    .maybeSingle();

  const { data: checkRelation } = await supabase
    .from("meaning_story")
    .select("*")
    .eq("story_id", storyId);

  console.log("\n--- [DB直接検証] ---");
  console.log("stories レコード存在:", !!checkStory);
  console.log("meaning_story レコード件数:", checkRelation ? checkRelation.length : 0);

  if (
    res3.status === 200 &&
    body3.success === true &&
    !checkStory &&
    (!checkRelation || checkRelation.length === 0)
  ) {
    console.log("\n🎉 HTTP API 削除エンドポイントの動作テストが完全合格しました！");
  } else {
    console.log("\n❌ HTTP API 動作テストに失敗しました。");
  }
}

main();
