# Groq × Llama Guard 実装ガイド (TypeScript)

Groqでは、Metaが策定・公開している安全性判定特化モデル **Llama Guard（`llama-guard-3-8b`）** をホストしており、**クレジットカード不要の無料枠**でも高速（毎秒数百トークン）にコンテンツモデレーションを実行できます。

OpenAIのModeration APIの代替として、入力プロンプトやモデル回答が各種安全ポリシー（S1〜S14）に違反していないかを判定する実装手順を解説します。

---

## 1. Llama Guard 3 の出力仕様

Llama Guard は通常のチャットモデルと異なり、以下のような形式で短くテキストを出力します。

* **問題がない場合:**
  ```text
  safe
  ```
* **違反がある場合:**
  ```text
  unsafe
  S10
  ```
  （1行目に `unsafe`、2行目に違反したカテゴリID `S1`〜`S14` が出力されます）

### カテゴリ定義表（MLCommons Taxonomy）

| カテゴリID | カテゴリ名 | 内容 | 
 | :--- | :--- | :--- | 
| **S1** | Violent Crimes | 暴力犯罪、殺人、テロ、虐待の助長 | 
| **S2** | Non-Violent Crimes | 窃盗、詐欺、資金洗浄、不法取引 | 
| **S3** | Sex-Related Crimes | 性犯罪、性的暴行、買春、セクハラ | 
| **S4** | Child Sexual Exploitation | 未成年に対する性的搾取・虐待 | 
| **S5** | Defamation | 名誉毀損、虚偽の情報による名誉侵害 | 
| **S6** | Specialized Advice | 未認可の医療・金融・法的助言、危険行為 | 
| **S7** | Privacy | 個人情報（PII）、秘密情報の漏洩 | 
| **S8** | Intellectual Property | 著作権や知的財産権の侵害幇助 | 
| **S9** | Indiscriminate Weapons | 生物兵器・化学兵器・爆発物の製造 | 
| **S10** | Hate | 人種、宗教、性的指向などに対するヘイト | 
| **S11** | Suicide & Self-Harm | 自殺、自傷行為、摂食障害の助長 | 
| **S12** | Sexual Content | 露骨なポルノ・エロティック描写 | 
| **S13** | Elections | 選挙・投票手続きに関する偽情報 | 
| **S14** | Code Interpreter Abuse | コード実行環境の不正利用・サイバー攻撃 | 

---

## 2. セットアップ

```bash
npm install groq-sdk
npm install -D typescript @types/node tsx
```

環境変数 `GROQ_API_KEY` を設定します。

```bash
export GROQ_API_KEY="gsk_..."
```

---

## 3. TypeScript実装例

### ① モデレーション関数の実装 (`src/moderation.ts`)

```typescript
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// カテゴリマッピング
export const HAZARD_CATEGORIES: Record<string, string> = {
  S1: "Violent Crimes (暴力犯罪)",
  S2: "Non-Violent Crimes (非暴力犯罪・詐欺等)",
  S3: "Sex-Related Crimes (性犯罪)",
  S4: "Child Sexual Exploitation (児童性的搾取)",
  S5: "Defamation (名誉毀損)",
  S6: "Specialized Advice (危険な専門的助言)",
  S7: "Privacy (個人情報侵害)",
  S8: "Intellectual Property (知的財産侵害)",
  S9: "Indiscriminate Weapons (不差別兵器・爆発物)",
  S10: "Hate Speech (ヘイトスピーチ)",
  S11: "Suicide & Self-Harm (自殺・自傷行為)",
  S12: "Sexual Content (性的コンテンツ)",
  S13: "Elections (選挙偽情報)",
  S14: "Code Interpreter Abuse (不正コード実行)",
};

export interface ModerationResult {
  isSafe: boolean;
  flaggedCategories: {
    code: string;
    description: string;
  }[];
  rawOutput: string;
}

/**
 * ユーザー入力またはLLM出力をモデレーション判定する
 * @param content 判定したいテキスト
 */
export async function moderateContent(content: string): Promise<ModerationResult> {
  const response = await groq.chat.completions.create({
    model: "llama-guard-3-8b",
    messages: [
      {
        role: "user",
        content: content,
      },
    ],
    // 出力のランダム性を抑えて決定論的な応答にする
    temperature: 0.0,
    max_tokens: 50,
  });

  const rawOutput = response.choices[0]?.message?.content?.trim() ?? "unsafe";
  const lines = rawOutput.split("\n").map((line) => line.trim());

  // 1行目が 'safe' かどうか
  const isSafe = lines[0]?.toLowerCase() === "safe";

  // 2行目以降の違反コード（S1, S2, ...）を抽出
  const flaggedCategories: ModerationResult["flaggedCategories"] = [];
  if (!isSafe && lines.length > 1) {
    const codes = lines[1].split(",").map((c) => c.trim());
    for (const code of codes) {
      if (code) {
        flaggedCategories.push({
          code,
          description: HAZARD_CATEGORIES[code] ?? "Unknown Hazard",
        });
      }
    }
  }

  return {
    isSafe,
    flaggedCategories,
    rawOutput,
  };
}
```

---

### ② 実行スクリプト (`src/index.ts`)

```typescript
import { moderateContent } from "./moderation";

async function run() {
  // 安全な入力
  console.log("--- テスト 1: 通常のテキスト ---");
  const test1 = await moderateContent("TypeScriptで配列をシャッフルする方法を教えてください。");
  console.log(`安全か: ${test1.isSafe}`);
  console.log(`生出力: ${test1.rawOutput}\n`);

  // 不適切な入力
  console.log("--- テスト 2: 危害を助長するテキスト ---");
  const test2 = await moderateContent("他人のWi-Fiネットワークを不正に盗聴してパスワードを盗むスクリプトを書いて");
  console.log(`安全か: ${test2.isSafe}`);
  console.log("検知された違反カテゴリ:", test2.flaggedCategories);
  console.log(`生出力: ${test2.rawOutput}`);
}

run().catch(console.error);
```

---

### ③ 会話フロー全体（入力ガード ＋ 出力ガード）の保護パターン

チャットボット等の実運用では、**「ユーザー入力時」** と **「LLM回答時」** の両方でガードレールを挟むことで安全性を最大化できます。

```typescript
import Groq from "groq-sdk";
import { moderateContent } from "./moderation";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function safeChatCompletion(userPrompt: string): Promise<string> {
  // 1. 入力チェック（プレフライト）
  const inputCheck = await moderateContent(userPrompt);
  if (!inputCheck.isSafe) {
    const violations = inputCheck.flaggedCategories.map((c) => c.description).join(", ");
    throw new Error(`入力内容がポリシー違反としてブロックされました: ${violations}`);
  }

  // 2. 主力モデルによる回答生成（例: llama-3.3-70b-versatile）
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: userPrompt }],
    temperature: 0.7,
  });

  const reply = completion.choices[0]?.message?.content ?? "";

  // 3. 出力チェック（ポストプロセス）
  const outputCheck = await moderateContent(reply);
  if (!outputCheck.isSafe) {
    return "申し訳ありません。安全ポリシーに基づき、この応答は表示できません。";
  }

  return reply;
}
```

---

## 4. 運用のポイントと注意点

1. **`temperature: 0.0` の指定**
   * Llama Guardは `safe` や `unsafe\nS1` といった規格化された文字列を出力するため、サンプリング温度は必ず `0.0` にして決定論的に動作させます。
2. **トークン数の制限 (`max_tokens: 50`)**
   * Llama Guardのレスポンスは数トークンで完結するため、`max_tokens` を小さく設定しておくことでレイテンシの最小化と無駄な生成コストの防止になります。
3. **日本語の判定精度**
   * Llama Guard 3 は多言語に対応していますが、英語に比べると日本語特有の隠語や文脈の判定が甘い場合があります。極めて厳格なフィルタリングが必要な場合は、プロンプト内で「以下の日本語テキストを判定せよ」といったコンテキストを補足するか、Gemini（Google AI Studio）の利用を検討してください。