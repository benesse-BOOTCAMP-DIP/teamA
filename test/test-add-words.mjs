import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// 1. .env.local を読み込む
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

// 2. バリデーション関数（簡易版）
const MAX_LENGTH = 45;
function validate(word, meaning) {
  if (!word?.trim()) return "英単語を入力してください";
  if (!meaning?.trim()) return "意味を入力してください";
  if (word.trim().length > MAX_LENGTH)
    return "単語は45文字以内で入力してください";
  if (meaning.trim().length > MAX_LENGTH)
    return "意味は45文字以内で入力してください";
  return null;
}

// 3. addWords の実行テスト関数
async function runAddWordsTest(userId, words) {
  // バリデーション
  for (const item of words) {
    const err = validate(item.word, item.meaning);
    if (err) return { success: false, error: err };
  }

  const savedWords = [];

  for (const item of words) {
    const trimmedWord = item.word.trim();
    const trimmedMeaning = item.meaning.trim();

    // ① words テーブル（既存再利用または新規作成）
    let wordId;
    const { data: existingWord } = await supabase
      .from("words")
      .select("word_id")
      .eq("word", trimmedWord)
      .maybeSingle();

    if (existingWord) {
      wordId = existingWord.word_id;
    } else {
      const { data: newWord, error } = await supabase
        .from("words")
        .insert({ word: trimmedWord })
        .select("word_id")
        .single();
      if (error) return { success: false, error: error.message };
      wordId = newWord.word_id;
    }

    // ② meanings テーブル（既存再利用または新規作成）
    let meaningId;
    const { data: existingMeaning } = await supabase
      .from("meanings")
      .select("meaning_id")
      .eq("word_id", wordId)
      .eq("meaning", trimmedMeaning)
      .maybeSingle();

    if (existingMeaning) {
      meaningId = existingMeaning.meaning_id;
    } else {
      const { data: newMeaning, error } = await supabase
        .from("meanings")
        .insert({ word_id: wordId, meaning: trimmedMeaning })
        .select("meaning_id")
        .single();
      if (error) return { success: false, error: error.message };
      meaningId = newMeaning.meaning_id;
    }

    // ③ user_meaning テーブル（重複チェックして登録）
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
      if (error) return { success: false, error: error.message };
    }

    savedWords.push({
      meaning_id: meaningId,
      word_id: wordId,
      word: trimmedWord,
      meaning: trimmedMeaning,
    });
  }

  return { success: true, data: savedWords };
}

async function main() {
  console.log("🚀 addWords の動作確認テストを開始します...\n");

  // テスト用ユーザーの準備
  let { data: user } = await supabase
    .from("users")
    .select("user_id")
    .limit(1)
    .maybeSingle();
  if (!user) {
    console.log("👤 テスト用ユーザーを作成中...");
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({ name: "テストユーザー" })
      .select("user_id")
      .single();
    if (error) {
      console.error("❌ ユーザー作成エラー:", error.message);
      return;
    }
    user = newUser;
  }
  console.log(`✅ テスト用ユーザーID: ${user.user_id}`);

  // テスト1: 複数単語の新規登録
  console.log("\n--- [テスト1] 複数単語の登録（apple, banana）---");
  const result1 = await runAddWordsTest(user.user_id, [
    { word: "apple", meaning: "りんご" },
    { word: "banana", meaning: "バナナ" },
  ]);
  console.log("結果:", JSON.stringify(result1, null, 2));

  // テスト2: 同じ単語をもう一度登録（再利用されるか確認）
  console.log(
    "\n--- [テスト2] 同じ単語を再度登録（再利用・重複防止チェック）---",
  );
  const result2 = await runAddWordsTest(user.user_id, [
    { word: "apple", meaning: "りんご" }, // 既存
    { word: "ramen", meaning: "ラーメン" }, // 新規
  ]);
  console.log("結果:", JSON.stringify(result2, null, 2));

  // テスト3: 45文字オーバーのエラーチェック
  console.log(
    "\n--- [テスト3] バリデーションエラーのチェック（文字数超過）---",
  );
  const result3 = await runAddWordsTest(user.user_id, [
    { word: "a".repeat(50), meaning: "長すぎる単語" },
  ]);
  console.log("結果:", JSON.stringify(result3, null, 2));

  console.log("\n🎉 全ての動作確認が完了しました！");
}

main();
