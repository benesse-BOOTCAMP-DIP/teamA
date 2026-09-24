# OpenAI Moderation API 実装ガイド (TypeScript)

OpenAIの **Moderation API** は、ユーザーからの入力テキストやアップロードされた画像が利用規約（ヘイトスピーチ、自傷行為、性的コンテンツ、暴力など）に違反していないかを自動判定するAPIです。OpenAIサービス利用者のセーフガードとして**無料**で利用できます。

---

## 1. 主要モデルと仕様

現在、マルチモーダル（テキスト＋画像）に対応した `omni-moderation-*` 系列が標準モデルです。

| モデル名 | 特徴 | 対象メディア |
| :--- | :--- | :--- |
| **`omni-moderation-latest`** | 常に最新版を参照する推奨モデル | テキスト / 画像 |
| **`omni-moderation-2024-09-26`** | バージョン固定のスナップショットモデル | テキスト / 画像 |

> **注意:** 過去の `text-moderation-latest` / `text-moderation-stable` は非推奨化・提供終了となっているため、新規実装では必ず `omni-moderation-latest` を指定してください。

---

## 2. 判定カテゴリ一覧

APIレスポンスでは、以下のカテゴリごとにフラグ（`boolean`）とスコア（`0.0 〜 1.0`）が返されます。

| カテゴリ | 内容説明 |
| :--- | :--- |
| **`harassment`** | 嫌がらせ、脅迫、いじめ表現 |
| **`harassment/threatening`** | 暴力や身体的危害を予告・示唆する深刻な嫌がらせ |
| **`hate`** | 人種、民族、宗教、ジェンダー、性的指向等に対する差別・憎悪表現 |
| **`hate/threatening`** | 保護対象グループに対する暴力の扇動や脅迫 |
| **`illicit`** | 違法薬物・不法行為・銃器製造などの指南 |
| **`illicit/violent`** | 暴力的犯罪やテロ行為などの計画・幇助 |
| **`self-harm`** | 自傷行為や自殺の助長・美化 |
| **`self-harm/intent`** | 自傷行為を行おうとする具体的な意図の表明 |
| **`self-harm/instructions`** | 自傷行為・自殺の具体的な手段や手順の記述 |
| **`sexual`** | 性的描写、性行為の勧誘、露骨なポルノ表現 |
| **`sexual/minors`** | 未成年に関連する性的描写（児童性的虐待コンテンツ含む） |
| **`violence`** | 死亡、重傷、身体的危害を賛美・描写する表現 |
| **`violence/graphic`** | 流血や重度外傷など、グロテスクな描写 |

---

## 3. 環境セットアップ

```bash
npm install openai
npm install -D typescript @types/node tsx
```

環境変数 `OPENAI_API_KEY` を設定します。

```bash
export OPENAI_API_KEY="sk-..."
```

---

## 4. TypeScript実装例

### ① テキストのモデレーション（基本形）

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function checkTextModeration(userInput: string) {
  const moderation = await openai.moderations.create({
    model: "omni-moderation-latest",
    input: userInput,
  });

  const result = moderation.results[0];

  console.log(`違反判定 (flagged): ${result.flagged}`);

  if (result.flagged) {
    console.log("【検知された違反カテゴリ】");
    for (const [category, isViolated] of Object.entries(result.categories)) {
      if (isViolated) {
        const score = result.category_scores[category as keyof typeof result.category_scores];
        console.log(`- ${category}: ${(score * 100).toFixed(2)}%`);
      }
    }
  }

  return result;
}

// 実行例
async function main() {
  const safeText = "こんにちは！TypeScriptとOpenAI APIの連携について教えてください。";
  const result = await checkTextModeration(safeText);
  console.log("チェック完了:", result.flagged ? "NG" : "OK");
}

main();
```

---

### ② 独自しきい値（Threshold）による厳格な判定

OpenAI既定の `flagged: true` は確実な違反を検知するための高めの基準になっています。教育・子ども向けアプリなどでは、スコアを用いたカスタムしきい値の運用が有効です。

```typescript
import OpenAI from "openai";

const openai = new OpenAI();

interface SafetyCheckResult {
  isSafe: boolean;
  blockedCategories: string[];
}

async function strictContentFilter(
  text: string,
  threshold = 0.35 // 確からしさ35%以上でブロック
): Promise<SafetyCheckResult> {
  const response = await openai.moderations.create({
    model: "omni-moderation-latest",
    input: text,
  });

  const result = response.results[0];
  const blockedCategories: string[] = [];

  for (const [category, score] of Object.entries(result.category_scores)) {
    if (score >= threshold) {
      blockedCategories.push(`${category} (${(score * 100).toFixed(1)}%)`);
    }
  }

  return {
    isSafe: blockedCategories.length === 0,
    blockedCategories,
  };
}
```

---

### ③ マルチモーダル（画像＋テキスト）のモデレーション

`omni-moderation-latest` では画像URLやBase64形式の画像も同時に検査できます。

```typescript
import OpenAI from "openai";

const openai = new OpenAI();

async function checkMultimodalContent(imageUrl: string, userComment: string) {
  const response = await openai.moderations.create({
    model: "omni-moderation-latest",
    input: [
      {
        type: "text",
        text: userComment,
      },
      {
        type: "image_url",
        image_url: {
          url: imageUrl,
        },
      },
    ],
  });

  const result = response.results[0];
  return {
    flagged: result.flagged,
    categories: result.categories,
    scores: result.category_scores,
  };
}
```

---

## 5. ベストプラクティス

1. **プリフライトチェックとして配置する**
   LLM（GPT-4oなど）に入力テキストを送る前に Moderation API を挟むことで、利用規約違反リクエストの早期遮断と、不要なトークン消費（コスト）の削減が可能です。
2. **モデル出力の検証にも使用する**
   ユーザーからの入力だけでなく、LLMが生成した出力側にも適用することで、ハルシネーションや脱獄（Jailbreak）による不適切な応答がユーザーに届くのを防げます。
3. **生テキストと併せて配列で一括送信する**
   `input` パラメータには文字列配列（`string[]`）を渡すことができます。会話ログの全ターンや複数メッセージを1回のリクエストにまとめて送ることで、ネットワークオーバーヘッドを削減できます。