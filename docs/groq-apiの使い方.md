# Groq API × TypeScript でスキーマを指定して構造化JSONを取得する完全ガイド

Groq APIでは、OpenAI互換のパラメータを活用してレスポンスを厳格なJSONフォーマット（Structured Outputs / JSON Schema）で返すことが可能です。

TypeScript環境において、型安全性を維持しながらGroq APIからスキーマ準拠のJSONを取得する方法を解説します。

---


## 1. 純粋な JSON Schema を直接定義する実装

Zodを導入せず、標準ライブラリのみで完結させたい場合の実装です。

### インストール

```bash
npm install groq-sdk
```

### 実装コード (`src/structured-raw.ts`)

```typescript
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// 1. TypeScript型定義
interface WeatherForecast {
  location: string;
  temperatureCelsius: number;
  condition: "Sunny" | "Rainy" | "Cloudy" | "Snowy";
  recommendations: string[];
}

// 2. Groq向けJSON Schemaの定義
const weatherSchema = {
  type: "object",
  properties: {
    location: { type: "string", description: "都市名や地名" },
    temperatureCelsius: { type: "number", description: "摂氏温度" },
    condition: {
      type: "string",
      enum: ["Sunny", "Rainy", "Cloudy", "Snowy"],
      description: "天候状態",
    },
    recommendations: {
      type: "array",
      items: { type: "string" },
      description: "おすすめの持ち物や服装",
    },
  },
  required: ["location", "temperatureCelsius", "condition", "recommendations"],
  additionalProperties: false, // 厳格なスキーマ準拠に必須
} as const;

async function getWeatherSummary(text: string): Promise<WeatherForecast> {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "入力テキストから気象情報を抽出し、指定スキーマのJSONを出力してください。",
      },
      {
        role: "user",
        content: text,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "weather_summary",
        strict: true,
        schema: weatherSchema,
      },
    },
    temperature: 0.1,
  });

  const rawJson = response.choices[0]?.message?.content;
  if (!rawJson) {
    throw new Error("レスポンス本文が取得できませんでした。");
  }

  // 型アサーション付きでJSONパース
  return JSON.parse(rawJson) as WeatherForecast;
}

// 実行例
async function main() {
  const text = "東京は現在快晴で、気温は18度前後です。風が少しあるので薄手の上着があると良いでしょう。";
  const result = await getWeatherSummary(text);
  console.log("解析結果:", result);
}

main();
```

---

## 2. TypeScript実装における重要プラクティス

1. **`additionalProperties: false` の明示**
   * Groqの `strict: true` モードでは、すべてのオブジェクト型スキーマに `"additionalProperties": false` が必須となります。これを忘れるとAPIからバリデーションエラーが返却されます。
2. **`temperature` の設定**
   * 情報抽出やスキーマ準拠が目的の場合、モデルのランダム性を抑えるため `0.0` 〜 `0.2` の低い値を指定してください。
3. **`JSON.parse()` の例外ハンドリング**
   * `strict: true` を指定していれば構文エラーはほぼ起きませんが、通信寸断や予期せぬトークン上限切れ（`finish_reason: "length"`）を考慮し、必ず `try...catch` でパースエラーを補足してください。
4. **推奨モデル**
   * 複雑なネスト構造や厳格な型推論を安定して出力させるには、`llama-3.3-70b-versatile` などの大型モデルを推奨します。