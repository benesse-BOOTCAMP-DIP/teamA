import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// .env.local 読み込み
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx !== -1) {
    env[trimmed.slice(0, idx).trim()] = trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

// route.ts と全く同じロジックの検証
const MAX_LENGTH = 45;
function validate(english, japanese) {
  if (!english?.trim()) return "英単語を入力してください";
  if (!japanese?.trim()) return "意味を入力してください";
  if (english.trim().length > MAX_LENGTH)
    return `英単語は${MAX_LENGTH}文字以内で入力してください`;
  if (japanese.trim().length > MAX_LENGTH)
    return `意味は${MAX_LENGTH}文字以内で入力してください`;
  return null;
}

async function simulatePostApiWords(body) {
  // 1. userId チェック
  if (!body || !body.userId) {
    return {
      status: 400,
      body: {
        success: false,
        error: "ユーザーID（userId）が指定されていません",
      },
    };
  }

  // words チェック
  if (!Array.isArray(body.words) || body.words.length === 0) {
    return {
      status: 400,
      body: {
        success: false,
        error: "登録する単語の配列（words）が指定されていません",
      },
    };
  }

  const userId = body.userId;

  // 2. バリデーション
  for (const item of body.words) {
    const err = validate(item.english, item.japanese);
    if (err) return { status: 400, body: { success: false, error: err } };
  }

  // 3. Supabase 処理
  const savedWords = [];
  for (const item of body.words) {
    const trimmedEnglish = item.english.trim();
    const trimmedJapanese = item.japanese.trim();

    // words
    let wordId;
    const { data: existingWord } = await supabase
      .from("words")
      .select("word_id")
      .eq("word", trimmedEnglish)
      .maybeSingle();

    if (existingWord) {
      wordId = existingWord.word_id;
    } else {
      const { data: newWord, error } = await supabase
        .from("words")
        .insert({ word: trimmedEnglish })
        .select("word_id")
        .single();
      if (error)
        return { status: 500, body: { success: false, error: error.message } };
      wordId = newWord.word_id;
    }

    // meanings
    let meaningId;
    const { data: existingMeaning } = await supabase
      .from("meanings")
      .select("meaning_id")
      .eq("word_id", wordId)
      .eq("meaning", trimmedJapanese)
      .maybeSingle();

    if (existingMeaning) {
      meaningId = existingMeaning.meaning_id;
    } else {
      const { data: newMeaning, error } = await supabase
        .from("meanings")
        .insert({ word_id: wordId, meaning: trimmedJapanese })
        .select("meaning_id")
        .single();
      if (error)
        return { status: 500, body: { success: false, error: error.message } };
      meaningId = newMeaning.meaning_id;
    }

    // user_meaning
    const { data: existingUserMeaning } = await supabase
      .from("user_meaning")
      .select("meaning_id")
      .eq("user_id", userId)
      .eq("meaning_id", meaningId)
      .maybeSingle();

    if (!existingUserMeaning) {
      const { error } = await supabase
        .from("user_meaning")
        .insert({ user_id: userId, meaning_id: meaningId });
      if (error)
        return { status: 500, body: { success: false, error: error.message } };
    }

    savedWords.push({
      meaning_id: meaningId,
      word_id: wordId,
      english: trimmedEnglish,
      japanese: trimmedJapanese,
    });
  }

  return { status: 200, body: { success: true, data: savedWords } };
}

async function main() {
  console.log("🚀 新仕様 POST /api/words の動作確認テストを開始します！\n");

  // テスト1: 正常系（english, japanese の新仕様で送信）
  console.log("--- [テスト1] 正常系: spring と summer を登録 ---");
  const res1 = await simulatePostApiWords({
    userId: 1,
    words: [
      { english: "spring", japanese: "春" },
      { english: "summer", japanese: "夏" },
    ],
  });
  console.log("Status:", res1.status);
  console.log("Response:", JSON.stringify(res1.body, null, 2));

  // テスト2: 異常系（userId なし）
  console.log("\n--- [テスト2] 異常系: userId を入れずに送信 ---");
  const res2 = await simulatePostApiWords({
    words: [{ english: "autumn", japanese: "秋" }],
  });
  console.log("Status:", res2.status);
  console.log("Response:", JSON.stringify(res2.body, null, 2));

  // テスト3: 異常系（45文字オーバー）
  console.log("\n--- [テスト3] 異常系: 45文字を超える単語を送信 ---");
  const res3 = await simulatePostApiWords({
    userId: 1,
    words: [{ english: "a".repeat(50), japanese: "長すぎる単語" }],
  });
  console.log("Status:", res3.status);
  console.log("Response:", JSON.stringify(res3.body, null, 2));

  console.log("\n🎉 全てのテストが終了しました！");
}

main();
