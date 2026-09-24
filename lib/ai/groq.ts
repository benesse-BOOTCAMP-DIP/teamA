import Groq from "groq-sdk";

let client: Groq | null = null;

/**
 * GROQ_API_KEY 環境変数を明示的に渡してクライアントを初期化する
 */
export function getGroqClient(): Groq {
  if (client) return client;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY が環境変数に設定されていません");
  }
  client = new Groq({ apiKey });
  return client;
}

// 2026-09時点、このAPIキーのcatalogにはllama-3.1-8b-instant/llama-3.3-70b-versatileが存在せず
// 404 (model_not_found) となったため、利用可能なopenai/gpt-oss-20bを採用
// (品質不足時は openai/gpt-oss-120b を検討)
// このモデルは response_format: json_schema の strict モード(Gemini の responseSchema 相当)に対応している
export const GROQ_MODEL = "openai/gpt-oss-20b";

/**
 * Groq の chat.completions を Structured Outputs (json_schema, strict) で呼び出し、
 * 指定したJSON Schemaに厳密準拠したオブジェクトを取得する
 */
export async function generateJson<T>(params: {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  schemaName: string;
  schema: Record<string, unknown>;
  model?: string;
}): Promise<T> {
  const groq = getGroqClient();

  const messages: { role: "system" | "user"; content: string }[] = [];
  if (params.systemPrompt) {
    messages.push({ role: "system", content: params.systemPrompt });
  }
  messages.push({ role: "user", content: params.userPrompt });

  const completion = await groq.chat.completions.create({
    model: params.model ?? GROQ_MODEL,
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: params.schemaName,
        strict: true,
        schema: params.schema,
      },
    },
    temperature: params.temperature ?? 0.7,
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) {
    throw new Error("Groq APIからレスポンスを取得できませんでした。");
  }
  return JSON.parse(text) as T;
}

/**
 * Groq (OpenAI互換) のレート制限/クォータエラーを検知する
 * 現行のGemini向け429検知ロジックをそのまま流用できる形にしている
 */
export function isRateLimitError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const status = (error as { status?: unknown }).status;
  const message = (error as { message?: unknown }).message;
  return (
    status === 429 ||
    (typeof message === "string" &&
      (message.includes("429") ||
        message.includes("quota") ||
        message.includes("rate_limit") ||
        message.includes("RESOURCE_EXHAUSTED")))
  );
}
