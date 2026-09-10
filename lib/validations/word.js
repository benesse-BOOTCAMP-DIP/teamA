/**
 * Validates word creation / update data.
 * @param {Object} data
 * @param {string} data.word - The word or phrase in original language
 * @param {string} data.meaning - Meaning or definition
 * @param {string} [data.example] - Example sentence
 * @param {string} [data.notes] - Additional notes
 * @returns {{ success: boolean, errors: Record<string, string>, data: Object }}
 */
export function validateWordData(data) {
  const errors = {};

  const word = (data.word || "").trim();
  const meaning = (data.meaning || "").trim();
  const example = (data.example || "").trim();
  const notes = (data.notes || "").trim();

  if (!word) {
    errors.word = "単語またはフレーズは必須項目です。";
  } else if (word.length > 200) {
    errors.word = "単語は200文字以内で入力してください。";
  }

  if (!meaning) {
    errors.meaning = "意味・訳語は必須項目です。";
  } else if (meaning.length > 500) {
    errors.meaning = "意味は500文字以内で入力してください。";
  }

  if (example.length > 1000) {
    errors.example = "例文は1000文字以内で入力してください。";
  }

  if (notes.length > 1000) {
    errors.notes = "メモは1000文字以内で入力してください。";
  }

  return {
    success: Object.keys(errors).length === 0,
    errors,
    data: {
      word,
      meaning,
      example,
      notes,
    },
  };
}
