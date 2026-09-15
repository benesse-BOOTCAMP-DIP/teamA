"use server";
//Supabaseとの接続を行うため
import { createClient } from "@/lib/supabase/server";
import { validateWordInput } from "@/lib/validations/word";

/**
 * 単語データの型定義(英単語と意味)
 */
export type WordItem = {
  word: string;
  meaning: string;
};

/**
 * addWordsに渡す引数の型(フロントエンドからの入力)
 */
export type AddWordsParams = {
  userId: number;
  words: WordItem[];
};

/**
 * 保存された単語情報の型(DBに保存されたあとの単語情報)
 */
export type SavedWordItem = {
  meaning_id: number;
  word_id: number;
  word: string;
  meaning: string;
};

/**
 * addWordsの返り値の型
 */
export type AddWordsResponse = {
  success: boolean; // 成功した場合は true、失敗した場合は false
  data?: SavedWordItem[]; // 成功した場合は保存された単語情報の配列
  error?: string; // 失敗した場合はエラーメッセージ
};

/**
 * 単語登録関数 (addWords)
 * ユーザーが入力した英単語と日本語訳のペアを受け取り、DBに登録します。
 * words / meanings / user_meaning の3テーブルにまたがる処理を行い、既存データは再利用します。
 *
 * 返り値: { success: true } または { success: false, error: string }
 *
 * @param {AddWordsParams} params
 * @returns {Promise<AddWordsResponse>}
 */
export async function addWords(
  params: AddWordsParams,
): Promise<AddWordsResponse> {
  const { userId, words } = params;

  // 1. 引数の基本チェック
  if (!userId) {
    return { success: false, error: "ユーザーIDが指定されていません" };
  }

  if (!words || !Array.isArray(words) || words.length === 0) {
    return { success: false, error: "登録する単語が指定されていません" };
  }

  // 2. 各単語の入力バリデーション（空文字、45文字上限）
  for (const item of words) {
    // 単語と意味のバリデーションチェック
    const validation = validateWordInput(item.word, item.meaning);
    // バリデーションエラーがあれば処理を中断してエラーを返す
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error || "入力内容に不備があります",
      };
    }
  }

  try {
    // Supabase接続
    const supabase = await createClient();

    // 保存できた単語の情報を集める配列
    const savedWords: SavedWordItem[] = [];

    // 3. 単語ごとに words, meanings, user_meaning へ順次登録
    for (const item of words) {
      const trimmedWord = item.word.trim();
      const trimmedMeaning = item.meaning.trim();

      // --- ① words テーブルへの登録（既存があれば再利用） ---
      let wordId: number;

      // すでに同じ単語が存在するか確認
      const { data: existingWord, error: wordSelectError } = await supabase
        .from("words")
        .select("word_id")
        .eq("word", trimmedWord)
        .maybeSingle();

      if (wordSelectError) {
        console.error("words 検索エラー:", wordSelectError);
        return { success: false, error: "単語データの確認に失敗しました" };
      }
      // 既存の単語があればその word_id を再利用、なければ新規作成
      if (existingWord) {
        wordId = existingWord.word_id;
      } else {
        // 新規作成
        const { data: newWord, error: wordInsertError } = await supabase
          .from("words")
          .insert({ word: trimmedWord })
          .select("word_id")
          .single();

        if (wordInsertError || !newWord) {
          console.error("words 登録エラー:", wordInsertError);
          return { success: false, error: "単語の登録に失敗しました" };
        }
        wordId = newWord.word_id;
      }

      // --- ② meanings テーブルへの登録（同じ word_id に同じ meaning があれば再利用） ---
      let meaningId: number;

      const { data: existingMeaning, error: meaningSelectError } =
        await supabase
          .from("meanings")
          .select("meaning_id")
          .eq("word_id", wordId)
          .eq("meaning", trimmedMeaning)
          .maybeSingle();

      if (meaningSelectError) {
        console.error("meanings 検索エラー:", meaningSelectError);
        return { success: false, error: "意味データの確認に失敗しました" };
      }

      if (existingMeaning) {
        // 既存の meaning_id を再利用
        meaningId = existingMeaning.meaning_id;
      } else {
        // 新規作成
        const { data: newMeaning, error: meaningInsertError } = await supabase
          .from("meanings")
          .insert({
            word_id: wordId,
            meaning: trimmedMeaning,
          })
          .select("meaning_id")
          .single();

        if (meaningInsertError || !newMeaning) {
          console.error("meanings 登録エラー:", meaningInsertError);
          return { success: false, error: "意味の登録に失敗しました" };
        }
        meaningId = newMeaning.meaning_id;
      }

      // --- ③ user_meaning への登録（登録済みかどうかの確認） ---
      const { data: existingUserMeaning, error: userMeaningSelectError } =
        await supabase
          .from("user_meaning")
          .select("meaning_id")
          .eq("user_id", userId)
          .eq("meaning_id", meaningId)
          .maybeSingle();

      if (userMeaningSelectError) {
        console.error("user_meaning 検索エラー:", userMeaningSelectError);
        return { success: false, error: "ユーザー単語帳の確認に失敗しました" };
      }

      if (!existingUserMeaning) {
        const { error: userMeaningInsertError } = await supabase
          .from("user_meaning")
          .insert({
            user_id: userId,
            meaning_id: meaningId,
          });

        if (userMeaningInsertError) {
          console.error("user_meaning 登録エラー:", userMeaningInsertError);
          return {
            success: false,
            error: "ユーザー単語帳への登録に失敗しました",
          };
        }
      }

      // 正常に登録・紐付けできた単語の情報をリストに追加
      savedWords.push({
        meaning_id: meaningId,
        word_id: wordId,
        word: trimmedWord,
        meaning: trimmedMeaning,
      });
    }

    // 全ての登録・紐付けが成功した場合、保存したデータ一覧を添えて返す
    return {
      success: true,
      data: savedWords,
    };
  } catch (error) {
    console.error("addWords 予期せぬエラー:", error);
    return {
      success: false,
      error: "登録処理中に予期せぬエラーが発生しました",
    };
  }
}
