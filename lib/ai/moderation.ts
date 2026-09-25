import { generateJson } from "./groq";

// gpt-oss-safeguard-20b: カスタムポリシーに基づく安全性判定用モデル(Groq提供)
// このアカウントのカタログには古典的なLlama Guard系モデルは存在しないため代替として採用
const SAFEGUARD_MODEL = "openai/gpt-oss-safeguard-20b";

/// カスタムポリシーの定義
const MODERATION_POLICY = `
# Content Safety Policy for English Learning App

## INSTRUCTIONS
あなたは日本の高校生向け英語学習アプリで、AIが生成した文章(短編ストーリーや単語の訳候補)が生徒に見せて問題ないか判定するモデレーターです。
入力された文章がポリシーに違反していないか判定し、JSONのみを返してください。

## VIOLATES (violation=1)
- 性的な内容、暴力的・残酷な描写、自傷・自殺の助長、薬物、ヘイトスピーチや差別的表現
- その他、高校の教室で生徒に見せるのが不適切な内容

## SAFE (violation=0)
- 学校生活、スポーツ、食べ物、趣味など、10代の生徒にとって健全で日常的な内容
`.trim();

const moderationSchema = {
  type: "object",
  properties: {
    violation: {
      type: "integer",
      description: "1 = ポリシー違反, 0 = 安全",
    },
    category: {
      type: "string",
      description: "違反の種類。安全な場合は空文字列",
    },
    rationale: {
      type: "string",
      description: "判定理由の簡潔な説明",
    },
  },
  required: ["violation", "category", "rationale"],
  additionalProperties: false,
};

interface ModerationResult {
  violation: number;
  category: string;
  rationale: string;
}

export class ModerationFlaggedError extends Error {
  category: string;

  constructor(category: string, rationale: string) {
    super(`不適切なコンテンツが検出されました: ${category} (${rationale})`);
    this.category = category;
  }
}

/**
 * Groqが生成したテキストをユーザーに返す前にチェックする層
 * gpt-oss-safeguard-20b にカスタムポリシーを渡して判定させる
 * 不適切と判定された場合は ModerationFlaggedError を throw する
 */
export async function assertTextsAreSafe(texts: string[]): Promise<void> {
  const inputs = texts.filter((t) => t.trim().length > 0);
  if (inputs.length === 0) return;

  const userPrompt = inputs
    .map((text, index) => `${index + 1}. ${text}`)
    .join("\n\n");

  const result = await generateJson<ModerationResult>({
    model: SAFEGUARD_MODEL,
    systemPrompt: MODERATION_POLICY,
    userPrompt,
    temperature: 0,
    schemaName: "moderation",
    schema: moderationSchema,
  });

  if (result.violation === 1) {
    throw new ModerationFlaggedError(result.category, result.rationale);
  }
}
