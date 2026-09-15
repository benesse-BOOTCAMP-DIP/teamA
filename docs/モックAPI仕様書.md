# 英単語翻訳モック API (`translate.ts`) 利用ガイド

フロントエンド開発で英単語の翻訳（訳候補取得）機能を利用・検証するためのモック API (`translate.ts`) が作成されました。  
フロントエンド実装時は以下の仕様に沿って連携してください。

---

## 📌 概要・利用方法

利用方法は以下の **2通り** あります。

1. **HTTP リクエスト (標準の `fetch` 呼び出し)**  
   クライアントコンポーネントや通常の API 通信で使用します。
2. **TypeScript 関数の直接呼び出し**  
   Server Component や Server Actions から直接呼ぶ場合に使用できます。

---

## 1. HTTP リクエスト仕様

- **エンドポイント**: `/api/mocks/words/translate`
- **HTTP メソッド**: `POST`
- **リクエストヘッダー**: `Content-Type: application/json`

### 📥 リクエストデータ (JSON)

```json
{
  "words": ["spring", "apple", "banana"]
}
```

```typescript
export interface TranslateRequest {
  words: string[];
}
```

### 📤 レスポンスデータ (JSON)

```json
{
  "translations": [
    {
      "english": "spring",
      "options": ["春", "バネ", "温泉", "跳ぶ"]
    },
    {
      "english": "apple",
      "options": ["りんご", "リンゴの木"]
    },
    {
      "english": "banana",
      "options": ["辞書に登録されていません"]
    }
  ]
}
```

```typescript
export interface TranslationOption {
  english: string;
  options: string[];
}

export interface TranslateResponse {
  translations: TranslationOption[];
}
```

---

## 2. モック辞書データ & 動作仕様

### 📖 登録済み単語一覧（テスト用）
以下の英単語は複数の訳候補が登録されています。

| 英単語 | 返される訳候補 (`options`) |
| :--- | :--- |
| `spring` | `["春", "バネ", "温泉", "跳ぶ"]` |
| `apple` | `["りんご", "リンゴの木"]` |
| `book` | `["本", "予約する", "帳簿"]` |
| `run` | `["走る", "運営する", "運行する"]` |
| `bank` | `["銀行", "土手", "河岸"]` |
| `light` | `["光", "軽い", "点灯する", "明るい"]` |
| `right` | `["右", "正しい", "権利", "適切"]` |
| `orange` | `["オレンジ", "みかん色"]` |
| `star` | `["星", "主演する", "花形"]` |
| `plant` | `["植物", "工場", "植える"]` |
| `fly` | `["飛ぶ", "ハエ"]` |
| `match` | `["試合", "マッチ", "一致する"]` |
| `watch` | `["見る", "腕時計", "警戒する"]` |
| `set` | `["セット", "配置する", "沈む"]` |

### ❓ 未登録の単語を入力した場合
辞書に登録されていない英単語が渡された場合は、`options` に `["辞書に登録されていません"]` が返されます。

---

## 💻 フロントエンド実装サンプル

### A. `fetch` を使用した API 通信例 (React / Next.js Client Component)

```typescript
import { useState } from "react";
import type { TranslateResponse } from "@/app/api/mocks/words/translate";

export function WordTranslator() {
  const [translations, setTranslations] = useState<TranslateResponse["translations"]>([]);
  const [loading, setLoading] = useState(false);

  const handleTranslate = async (wordList: string[]) => {
    setLoading(true);
    try {
      const response = await fetch("/api/mocks/words/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ words: wordList }),
      });

      if (!response.ok) {
        throw new Error("翻訳リクエストに失敗しました");
      }

      const data: TranslateResponse = await response.json();
      setTranslations(data.translations);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => handleTranslate(["spring", "apple", "banana"])}>
        翻訳実行
      </button>
      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <ul>
          {translations.map((item) => (
            <li key={item.english}>
              <strong>{item.english}</strong>: {item.options.join(", ")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### B. TypeScript 関数を直接インポートして使用する例 (Server Component / Action)

```typescript
import { translateWords } from "@/app/api/mocks/words/translate";

export default async function Page() {
  // サーバー側で直接モック関数を実行
  const { translations } = translateWords(["spring", "apple"]);

  return (
    <div>
      {translations.map((item) => (
        <div key={item.english}>
          <h3>{item.english}</h3>
          <p>訳候補: {item.options.join(" / ")}</p>
        </div>
      ))}
    </div>
  );
}
```
