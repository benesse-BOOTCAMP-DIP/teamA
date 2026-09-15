// lib/validations/word.ts

// 単語・意味の最大文字数
export const MAX_WORD_LENGTH = 45;
export const MAX_MEANING_LENGTH = 45;

/**
 * 単語と意味のバリデーションチェック
 * @param {string} word - 英単語
 * @param {string} meaning - 日本語の意味
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateWordInput(
  word: string,
  meaning: string,
): { isValid: boolean; error?: string } {
  // 入力値をトリムして空白を除去
  const trimmedWord = (word || "").trim();
  const trimmedMeaning = (meaning || "").trim();

  // 空文字チェック
  if (!trimmedWord) {
    return { isValid: false, error: "英単語を入力してください" };
  }
  if (!trimmedMeaning) {
    return { isValid: false, error: "意味を入力してください" };
  }

  // 文字数チェック（45文字以内）
  if (trimmedWord.length > MAX_WORD_LENGTH) {
    return {
      isValid: false,
      error: `英単語は${MAX_WORD_LENGTH}文字以内で入力してください（現在: ${trimmedWord.length}文字）`,
    };
  }
  if (trimmedMeaning.length > MAX_MEANING_LENGTH) {
    return {
      isValid: false,
      error: `意味は${MAX_MEANING_LENGTH}文字以内で入力してください（現在: ${trimmedMeaning.length}文字）`,
    };
  }

  return { isValid: true };
}
