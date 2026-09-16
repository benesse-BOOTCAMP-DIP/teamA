# API 仕様書

本ドキュメントは、Word-to-Text Anki のバックエンド API（`app/api/words/...`）の最終実装仕様を記述したものです。

---

## 📌 概要・共通仕様

- **ベース URL**: `/api`
- **データ形式**: JSON (`Content-Type: application/json`)
- **必要な環境変数**:
  - `NEXT_PUBLIC_SUPABASE_URL`: Supabase プロジェクト URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key
  - `GEMINI_API_KEY`: Google Gemini AI API キー (翻訳生成で使用)

---

## 1. 単語登録 API

ユーザーが入力・選択した英単語と日本語訳のペアを Supabase データベース（`words`, `meanings`, `user_meaning` テーブル）に保存します。

- **URL**: `POST /api/words`
- **Content-Type**: `application/json`
- **実装ファイル**: [`app/api/words/route.ts`](file:///c:/Users/onlyb/word-to-text-anki-ts/app/api/words/route.ts)

### 📥 リクエスト（フロント → バック）

```json
{
  "userId": 1,
  "words": [
    { "english": "spring", "japanese": "春" },
    { "english": "apple", "japanese": "りんご" }
  ]
}
```

| フィールド         | 型            | 必須 | 説明                                   |
| ------------------ | ------------- | ---- | -------------------------------------- |
| `userId`           | `number`      | ○    | 登録するユーザーのID                   |
| `words`            | `WordInput[]` | ○    | 登録する単語の配列（1件以上）          |
| `words[].english`  | `string`      | ○    | 英単語（トリム後 1〜45文字）           |
| `words[].japanese` | `string`      | ○    | 日本語訳・意味（トリム後 1〜45文字）   |

> ℹ️ `userId` はログイン機能が実装されるまで、仮の値（例: `1`）を指定します。

### 📤 レスポンス（バック → フロント）

#### 成功時 `200 OK`

保存された単語の ID（`meaning_id`, `word_id`）を含んだ配列が返ります。

```json
{
  "success": true,
  "data": [
    {
      "meaning_id": 8,
      "word_id": 6,
      "english": "spring",
      "japanese": "春"
    },
    {
      "meaning_id": 9,
      "word_id": 7,
      "english": "apple",
      "japanese": "りんご"
    }
  ]
}
```

| フィールド        | 型            | 説明                                      |
| ----------------- | ------------- | ----------------------------------------- |
| `success`         | `boolean`     | 成功フラグ（`true`）                      |
| `data`            | `SavedWord[]` | 登録・保存された単語情報の配列            |
| `data[].meaning_id` | `number`    | 意味ID（`meanings` テーブルの主キー）     |
| `data[].word_id`    | `number`    | 単語ID（`words` テーブルの主キー）        |
| `data[].english`   | `string`    | 登録された英単語                          |
| `data[].japanese`  | `string`    | 登録された日本語訳                        |

#### バリデーションエラー時 `400 Bad Request`

リクエストボディの不足や、文字数オーバー（45文字超）・空文字などのバリデーションエラーが発生した場合に返ります。

```json
{
  "success": false,
  "error": "英単語は45文字以内で入力してください（現在: 48文字）"
}
```

| ケース                              | `error` の返却例                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| `userId` の未指定                  | `ユーザーID（userId）が指定されていません`                                      |
| `words` 配列の未指定・空配列       | `登録する単語の配列（words）が指定されていません`                              |
| 英単語が空文字                     | `英単語を入力してください`                                                      |
| 意味（日本語訳）が空文字           | `意味を入力してください`                                                        |
| 英単語が 46 文字以上               | `英単語は45文字以内で入力してください（現在: XX文字）`                           |
| 意味（日本語訳）が 46 文字以上     | `意味は45文字以内で入力してください（現在: XX文字）`                             |

#### サーバー・DBエラー時 `500 Internal Server Error`

Database 処理失敗時や予期せぬエラー発生時に返ります。

```json
{
  "success": false,
  "error": "単語の登録処理中に予期せぬエラーが発生しました"
}
```

### TypeScript 型定義 (`@/app/api/words/route`)

```typescript
export interface WordInput {
  english: string;
  japanese: string;
}

export interface RegisterWordsRequest {
  userId: number;
  words: WordInput[];
}

export interface SavedWord {
  meaning_id: number;
  word_id: number;
  english: string;
  japanese: string;
}
```

---

## 2. 単語・物語一覧取得 API

ログイン中のユーザーが登録した単語一覧および作成した物語一覧を取得します。
単語一覧画面や、物語生成時の単語選択画面で使用します。

- **URL**: `GET /api/words`
- **Query Parameters**: `userId` (例: `/api/words?userId=1`)
- **実装ファイル**: [`app/api/words/route.ts`](file:///c:/Users/onlyb/word-to-text-anki-ts/app/api/words/route.ts)

### 📥 リクエスト（フロント → バック）

| パラメータ | 型       | 必須 | 説明                                                        |
| :--------- | :------- | :--- | :---------------------------------------------------------- |
| `userId`   | `number` | ○    | 取得対象のユーザーID（例: `/api/words?userId=1`）          |

> ℹ️ クエリパラメータ `userId` 省略時は `0` として扱われます。

### 📤 レスポンス（バック → フロント）

#### 成功時 `200 OK`

単語・物語ともに**登録/作成日時の新しい順（降順 `created_at DESC`）**でソートされています。
同じ英単語（例: `book`）で複数の意味（「本」「予約する」）が登録されている場合、それぞれ別の `meaning_id` を保持します。

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
      "id": 9,
      "meaning_id": 9,
      "word_id": 7,
      "english": "summer",
      "japanese": "夏"
    },
    {
      "id": 4,
      "meaning_id": 4,
      "word_id": 1,
      "english": "book",
      "japanese": "予約する"
    },
    {
      "id": 1,
      "meaning_id": 1,
      "word_id": 1,
      "english": "book",
      "japanese": "本"
    }
  ]
}
```

| フィールド           | 型               | 説明                                                   |
| :------------------- | :--------------- | :----------------------------------------------------- |
| `stories`            | `StoryItem[]`    | そのユーザーが作成した物語の配列（作成日時の新しい順） |
| `stories[].id`       | `number`         | 物語ID (`story_id`)                                    |
| `stories[].title`    | `string`         | 物語タイトル（未設定時は `"無題の物語"`）              |
| `stories[].content`  | `string`         | 物語本文 (`story`)                                     |
| `words`              | `WordListItem[]` | そのユーザーが登録した単語の配列（登録日時の新しい順） |
| `words[].id`         | `number`         | 識別用ID（`meaning_id` と同値）                        |
| `words[].meaning_id` | `number`         | 意味ID（`meanings` テーブルの主キー）                  |
| `words[].word_id`    | `number`         | 単語ID（`words` テーブルの主キー）                     |
| `words[].english`    | `string`         | 英単語                                                 |
| `words[].japanese`   | `string`         | 日本語訳                                               |

#### 失敗時 `500 Internal Server Error`

```json
{
  "error": "単語一覧の取得に失敗しました"
}
```

### TypeScript 型定義 (`@/app/api/words/route`)

```typescript
export interface StoryItem {
  id: number;
  title: string;
  content: string;
}

export interface WordListItem {
  id: number;
  meaning_id: number;
  word_id: number;
  english: string;
  japanese: string;
}

export interface WordsListResponse {
  stories: StoryItem[];
  words: WordListItem[];
}
```

---

## 3. 英単語 AI 翻訳（訳候補生成） API

入力された英単語のリストを受け取り、Google Gemini AI (`gemini-3.6-flash`) を用いて日本人英語学習者向けの代表的な日本語訳候補（3〜5個程度）を生成・返却します。

- **URL**: `POST /api/words/translate`
- **Content-Type**: `application/json`
- **実装ファイル**: [`app/api/words/translate/route.ts`](file:///c:/Users/onlyb/word-to-text-anki-ts/app/api/words/translate/route.ts)

### 📥 リクエスト（フロント → バック）

```json
{
  "words": ["spring", "run", "apple"]
}
```

| フィールド | 型         | 必須 | 説明                                     |
| ---------- | ---------- | ---- | ---------------------------------------- |
| `words`    | `string[]` | ○    | 訳候補を生成する英単語の配列（1件以上）  |

### 📤 レスポンス（バック → フロント）

#### 成功時 `200 OK`

各英単語に対する日本語訳の選択肢（`options`）が格納された配列が返ります。

```json
{
  "translations": [
    {
      "english": "spring",
      "options": ["春", "バネ", "温泉", "跳ぶ"]
    },
    {
      "english": "run",
      "options": ["走る", "運営する", "運行する"]
    },
    {
      "english": "apple",
      "options": ["りんご", "リンゴの木"]
    }
  ]
}
```

| フィールド                   | 型                    | 説明                                           |
| ---------------------------- | --------------------- | ---------------------------------------------- |
| `translations`               | `TranslationOption[]` | 各単語の翻訳結果リスト                         |
| `translations[].english`     | `string`              | 元の英単語                                     |
| `translations[].options`     | `string[]`            | 代表的な日本語訳候補（良く使われる順に3〜5個） |

#### リクエスト不備時 `400 Bad Request`

```json
{
  "error": "翻訳する単語の配列（words）が指定されていません"
}
```

または

```json
{
  "error": "有効な英単語が指定されていません"
}
```

#### API/サーバーエラー時 `500 Internal Server Error`

環境変数 `GEMINI_API_KEY` の未設定や、Gemini API 呼び出しの失敗時などに返ります。

```json
{
  "error": "英単語の意味候補の取得に失敗しました"
}
```

### TypeScript 型定義 (`@/app/api/words/translate/route`)

```typescript
export interface TranslateRequest {
  words: string[];
}

export interface TranslationOption {
  english: string;
  options: string[];
}

export interface TranslateResponse {
  translations: TranslationOption[];
}
```

---
