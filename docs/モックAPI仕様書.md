# モック API 仕様書・利用ガイド

フロントエンド開発で利用する各種モック API の仕様書です。

---

## 📚 1. ストーリー・単語一覧取得 API

ストーリーおよび単語リストのモックデータを取得する API です。

### 📌 基本情報

- **エンドポイント**: `/api/mocks/words`
- **HTTP メソッド**: `GET`
- **実装ファイル**: `app/api/mocks/words/route.ts`

### 📤 レスポンス仕様 (JSON)

```json
{
  "stories": [
    {
      "id": 1,
      "title": "魚とラーメン",
      "content": "Ken has a fish. He likes ramen very much."
    }
  ],
  "words": [
    {
      "id": 1,
      "english": "fish",
      "japanese": "魚"
    },
    {
      "id": 2,
      "english": "ramen",
      "japanese": "ラーメン"
    }
  ]
}
```

### 📐 TypeScript 型定義 (`@/app/api/mocks/words/route`)

```typescript
export interface Story {
  id: number;
  title: string;
  content: string;
}

export interface Word {
  id: number;
  english: string;
  japanese: string;
}

export interface MocksResponse {
  stories: Story[];
  words: Word[];
}
```

### 💻 フロントエンド実装コード例 (`fetch`)

```typescript
import type { MocksResponse } from "@/app/api/mocks/words/route";

async function getMockData(): Promise<MocksResponse> {
  const res = await fetch("/api/mocks/words");
  if (!res.ok) {
    throw new Error("モックデータの取得に失敗しました");
  }
  return res.json();
}
```

---

## 🔤 2. 英単語翻訳（訳候補取得） API

英単語の配列を受け取り、各単語の日本語訳候補を返す API です。

### 📌 基本情報

- **エンドポイント**: `/api/mocks/words/translate`
- **HTTP メソッド**: `POST`
- **リクエストヘッダー**: `Content-Type: application/json`
- **実装ファイル**: `app/api/mocks/words/translate/route.ts`

### 📥 リクエスト仕様 (JSON)

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

### 📤 レスポンス仕様 (JSON)

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

### 📖 登録済み単語一覧（テスト用）

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

* ※ 辞書に登録されていない英単語が渡された場合は、`options` に `["辞書に登録されていません"]` が返されます。

### 💻 フロントエンド実装コード例 (`fetch`)

```typescript
import type { TranslateRequest, TranslateResponse } from "@/app/api/mocks/words/translate/route";

async function fetchTranslations(words: string[]): Promise<TranslateResponse> {
  const response = await fetch("/api/mocks/words/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ words } satisfies TranslateRequest),
  });

  if (!response.ok) {
    throw new Error("翻訳リクエストに失敗しました");
  }

  return response.json();
}
```

### 💻 サーバー側で直接関数を呼び出す例 (Server Component / Action)

```typescript
import { translateWords } from "@/app/api/mocks/words/translate/route";

const { translations } = translateWords(["spring", "apple"]);
```
