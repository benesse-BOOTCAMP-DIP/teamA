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

| フィールド         | 型            | 必須 | 説明                                 |
| ------------------ | ------------- | ---- | ------------------------------------ |
| `userId`           | `number`      | ○    | 登録するユーザーのID                 |
| `words`            | `WordInput[]` | ○    | 登録する単語の配列（1件以上）        |
| `words[].english`  | `string`      | ○    | 英単語（トリム後 1〜45文字）         |
| `words[].japanese` | `string`      | ○    | 日本語訳・意味（トリム後 1〜45文字） |

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

| フィールド          | 型            | 説明                                  |
| ------------------- | ------------- | ------------------------------------- |
| `success`           | `boolean`     | 成功フラグ（`true`）                  |
| `data`              | `SavedWord[]` | 登録・保存された単語情報の配列        |
| `data[].meaning_id` | `number`      | 意味ID（`meanings` テーブルの主キー） |
| `data[].word_id`    | `number`      | 単語ID（`words` テーブルの主キー）    |
| `data[].english`    | `string`      | 登録された英単語                      |
| `data[].japanese`   | `string`      | 登録された日本語訳                    |

#### バリデーションエラー時 `400 Bad Request`

リクエストボディの不足や、文字数オーバー（45文字超）・空文字などのバリデーションエラーが発生した場合に返ります。

```json
{
  "success": false,
  "error": "英単語は45文字以内で入力してください（現在: 48文字）"
}
```

| ケース                         | `error` の返却例                                       |
| ------------------------------ | ------------------------------------------------------ |
| `userId` の未指定              | `ユーザーID（userId）が指定されていません`             |
| `words` 配列の未指定・空配列   | `登録する単語の配列（words）が指定されていません`      |
| 英単語が空文字                 | `英単語を入力してください`                             |
| 意味（日本語訳）が空文字       | `意味を入力してください`                               |
| 英単語が 46 文字以上           | `英単語は45文字以内で入力してください（現在: XX文字）` |
| 意味（日本語訳）が 46 文字以上 | `意味は45文字以内で入力してください（現在: XX文字）`   |

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

| パラメータ | 型       | 必須 | 説明                                              |
| :--------- | :------- | :--- | :------------------------------------------------ |
| `userId`   | `number` | ○    | 取得対象のユーザーID（例: `/api/words?userId=1`） |

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
      "content": "Ken has a fish. He likes ramen very much.",
      "imageUrl": "https://example.supabase.co/storage/v1/object/public/story-images/abc123.webp"
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
| `stories[].imageUrl` | `string \| null` | 物語の挿絵画像URL（未設定時は `null`）                 |
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
  imageUrl?: string | null;
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

| フィールド | 型         | 必須 | 説明                                    |
| ---------- | ---------- | ---- | --------------------------------------- |
| `words`    | `string[]` | ○    | 訳候補を生成する英単語の配列（1件以上） |

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

| フィールド               | 型                    | 説明                                           |
| ------------------------ | --------------------- | ---------------------------------------------- |
| `translations`           | `TranslationOption[]` | 各単語の翻訳結果リスト                         |
| `translations[].english` | `string`              | 元の英単語                                     |
| `translations[].options` | `string[]`            | 代表的な日本語訳候補（良く使われる順に3〜5個） |

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

#### 利用制限時 `429 Too Many Requests`

AIの無料枠制限や短時間のアクセス集中時に返ります。

```json
{
  "error": "AIの利用制限に達しました。しばらく時間を置いてから再度お試しください"
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

## 4. 単語から文章（物語）生成 API

選択した英単語リストおよび指定されたジャンル（任意）をもとに、AI が自然な英語のショートストーリー、和訳、日本語タイトル、文中での実際の使用形（活用形）を生成します。
※この時点ではまだデータベースには保存しません（画面でのプレビュー・確認用）。

- **URL**: `POST /api/stories/generate`
- **Content-Type**: `application/json`
- **実装ファイル**: `app/api/stories/generate/route.ts`

### 📥 リクエスト（フロント → バック）

```json
{
  "genre": "ファンタジー",
  "words": [
    { "meaningId": 1, "word": "run", "meaning": "走る" },
    { "meaningId": 2, "word": "park", "meaning": "公園" }
  ]
}
```

| フィールド          | 型                 | 必須 | 説明                                                                                                                                                                                    |
| :------------------ | :----------------- | :--- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `genre`             | `string`           | -    | 物語のジャンル・世界観（任意。例: `"ファンタジー"`, `"SF"`, `"日常"`, `"ミステリー"` など）。指定されたジャンルのテイストで物語が生成されます。省略時は通常の日常ストーリーになります。 |
| `words`             | `StoryWordInput[]` | ○    | 物語に含める単語の配列（1件以上、推奨3〜10件）                                                                                                                                          |
| `words[].meaningId` | `number`           | ○    | 単語の意味ID（DB保存時の紐付け用）                                                                                                                                                      |
| `words[].word`      | `string`           | ○    | 英単語                                                                                                                                                                                  |
| `words[].meaning`   | `string`           | ○    | 日本語の意味・訳                                                                                                                                                                        |

### 📤 レスポンス（バック → フロント）

#### 成功時 `200 OK`

```json
{
  "title": "朝の公園ルーティン",
  "story": "Every morning, I ran to the park to enjoy the fresh air.",
  "japaneseStory": "毎朝、私は新鮮な空気を楽しむために公園へ走りました。",
  "words": [
    {
      "meaningId": 1,
      "word": "run",
      "surfaces": ["ran"]
    },
    {
      "meaningId": 2,
      "word": "park",
      "surfaces": ["park"]
    }
  ]
}
```

| フィールド          | 型                     | 説明                                                        |
| :------------------ | :--------------------- | :---------------------------------------------------------- |
| `title`             | `string`               | 物語のタイトル（日本語）                                    |
| `story`             | `string`               | 英文本文                                                    |
| `japaneseStory`     | `string`               | 和訳本文                                                    |
| `words`             | `GeneratedStoryWord[]` | 本文中で使用された各単語の情報                              |
| `words[].meaningId` | `number`               | 単語の意味ID                                                |
| `words[].word`      | `string`               | 元の英単語                                                  |
| `words[].surfaces`  | `string[]`             | 物語の中で実際に使われた形（活用形など、例: `run` ➜ `ran`） |

#### エラー時 `400 Bad Request` / `429 Too Many Requests` / `500 Internal Server Error`

- `400`: `単語の配列（words）が指定されていません`
- `429`: `AIの利用制限に達しました。しばらく時間を置いてから再度お試しください`
- `500`: `物語の生成に失敗しました`

### TypeScript 型定義 (`@/app/api/stories/generate/route`)

```typescript
export interface StoryWordInput {
  meaningId: number;
  word: string;
  meaning: string;
}

export interface GenerateStoryRequest {
  genre?: string;
  words: StoryWordInput[];
}

export interface GeneratedStoryWord {
  meaningId: number;
  word: string;
  surfaces: string[];
}

export interface GenerateStoryResponse {
  title: string;
  story: string;
  japaneseStory: string;
  words: GeneratedStoryWord[];
}
```

---

## 5. 文章（物語）登録 API

ユーザーが生成・プレビューして確定した物語をデータベース（`stories` テーブル）に保存し、物語に含まれる単語との紐付け（`meaning_story` テーブル）を作成します。

- **URL**: `POST /api/stories`
- **Content-Type**: `application/json`
- **実装ファイル**: `app/api/stories/route.ts`

### 📥 リクエスト（フロント → バック）

```json
{
  "userId": 1,
  "title": "朝の公園ルーティン",
  "story": "Every morning, I ran to the park to enjoy the fresh air.",
  "japaneseStory": "毎朝、私は新鮮な空気を楽しむために公園へ走りました。",
  "imageUrl": "https://example.supabase.co/storage/v1/object/public/story-images/abc123.webp",
  "words": [
    { "meaningId": 1, "surfaces": ["ran"] },
    { "meaningId": 2, "surfaces": ["park"] }
  ]
}
```

| フィールド          | 型                    | 必須 | 説明                                  |
| :------------------ | :-------------------- | :--- | :------------------------------------ |
| `userId`            | `number`              | ○    | 作成したユーザーID                    |
| `title`             | `string`              | ○    | 物語のタイトル（日本語）              |
| `story`             | `string`              | ○    | 英文本文                              |
| `japaneseStory`     | `string`              | -    | 和訳本文                              |
| `imageUrl`          | `string`              | -    | 生成された挿絵の画像URL（任意）       |
| `words`             | `StoryMeaningInput[]` | ○    | 物語に含まれる単語と活用形の配列      |
| `words[].meaningId` | `number`              | ○    | 紐付ける意味ID（`meaning_id`）        |
| `words[].surfaces`  | `string[]`            | -    | 物語中での実際の表記（例: `["ran"]`） |

### 📤 レスポンス（バック → フロント）

#### 成功時 `200 OK`

```json
{
  "success": true,
  "data": {
    "storyId": 10,
    "title": "朝の公園ルーティン",
    "createdAt": "2026-09-16T10:00:00Z"
  }
}
```

| フィールド       | 型        | 説明                           |
| :--------------- | :-------- | :----------------------------- |
| `success`        | `boolean` | 成功フラグ（`true`）           |
| `data.storyId`   | `number`  | 登録された物語ID（`story_id`） |
| `data.title`     | `string`  | 物語タイトル                   |
| `data.createdAt` | `string`  | 登録日時 (ISO 8601)            |

#### エラー時 `400 Bad Request` / `500 Internal Server Error`

- `400`: `タイトルおよび英文本文を入力してください`
- `500`: `物語の登録処理中に予期せぬエラーが発生しました`

### TypeScript 型定義 (`@/app/api/stories/route`)

```typescript
export interface StoryMeaningInput {
  meaningId: number;
  surfaces: string[];
}

export interface RegisterStoryRequest {
  userId: number;
  title: string;
  story: string;
  japaneseStory?: string;
  imageUrl?: string;
  words: StoryMeaningInput[];
}

export interface RegisterStoryResponse {
  success: boolean;
  data?: {
    storyId: number;
    title: string;
    createdAt: string;
  };
  error?: string;
}
```

---

## 6. 物語詳細取得 API

ユーザーが作成した物語の一覧、および特定の物語の詳細（本文＋使用されている単語カード情報）を取得します。

- **URL**:
  - **詳細取得**: `GET /api/stories/[id]` （例: `GET /api/stories/10`）
- **実装ファイル**:
  - 詳細: `app/api/stories/[id]/route.ts`

### 6.1 物語詳細取得 (`GET /api/stories/[id]`)

物語詳細画面を開いた際に、本文と同時に**「この物語で学べる単語リスト（意味や文中での活用形を含む）」**を一度に取得します。

#### 📤 レスポンス `200 OK`

```json
{
  "storyId": 10,
  "title": "朝の公園ルーティン",
  "story": "Every morning, I ran to the park to enjoy the fresh air.",
  "japaneseStory": "毎朝、私は新鮮な空気を楽しむために公園へ走りました。",
  "imageUrl": "https://example.supabase.co/storage/v1/object/public/story-images/abc123.webp",
  "createdAt": "2026-09-16T10:00:00Z",
  "words": [
    {
      "meaningId": 1,
      "english": "run",
      "japanese": "走る",
      "surfaces": ["ran"]
    },
    {
      "meaningId": 2,
      "english": "park",
      "japanese": "公園",
      "surfaces": ["park"]
    }
  ]
}
```

| フィールド          | 型                  | 説明                                                |
| :------------------ | :------------------ | :-------------------------------------------------- |
| `storyId`           | `number`            | 物語ID                                              |
| `title`             | `string`            | 物語タイトル（日本語）                              |
| `story`             | `string`            | 英文本文                                            |
| `japaneseStory`     | `string`            | 和訳本文                                            |
| `imageUrl`          | `string`            | 物語の挿絵画像URL（未設定時は `null` または空文字） |
| `createdAt`         | `string`            | 作成日時                                            |
| `words`             | `StoryDetailWord[]` | 物語で使用されている単語リスト                      |
| `words[].meaningId` | `number`            | 意味ID                                              |
| `words[].english`   | `string`            | 英単語                                              |
| `words[].japanese`  | `string`            | 日本語訳                                            |
| `words[].surfaces`  | `string[]`          | 物語中での実際の表記（活用形など）                  |

### TypeScript 型定義

```typescript
export interface StoryListItem {
  storyId: number;
  title: string;
  story: string;
  japaneseStory: string;
  createdAt: string;
}

export interface StoryListResponse {
  stories: StoryListItem[];
}

export interface StoryDetailWord {
  meaningId: number;
  english: string;
  japanese: string;
  surfaces: string[];
}

export interface StoryDetailResponse {
  storyId: number;
  title: string;
  story: string;
  japaneseStory: string;
  imageUrl?: string | null;
  createdAt: string;
  words: StoryDetailWord[];
}
```

---

## 7. 物語削除 API

指定した物語を削除します。
データベース上では `meaning_story` の紐付けを削除し、`stories` テーブルのレコードを削除します（※単語帳自体の単語や意味は保持されます）。

- **URL**: `DELETE /api/stories/[id]` （例: `DELETE /api/stories/10`）
- **実装ファイル**: `app/api/stories/[id]/route.ts`

### 📤 レスポンス

#### 成功時 `200 OK`

```json
{
  "success": true,
  "message": "物語を削除しました"
}
```

#### 失敗時 `404 Not Found` / `500 Internal Server Error`

- `404`: `指定された物語が見つかりません`
- `500`: `物語の削除処理中に予期せぬエラーが発生しました`

### TypeScript 型定義

```typescript
export interface DeleteStoryResponse {
  success: boolean;
  message?: string;
  error?: string;
}
```

---

## 8. 物語画像生成 API

生成された物語の英文（またはタイトル）を元に、Google Gemini (Imagen 3) を用いて高校生向け英語学習アプリ「スト単」の挿絵（イラスト）画像を生成し、Supabase Storage に保存して公開画像URLを返却します。

- **URL**: `POST /api/stories/generate-image`
- **Content-Type**: `application/json`
- **実装ファイル**: `app/api/stories/generate-image/route.ts`

### 📥 リクエスト（フロント → バック）

```json
{
  "story": "Every morning, I ran to the park to enjoy the fresh air.",
  "title": "朝の公園ルーティン"
}
```

| フィールド | 型       | 必須 | 説明                                     |
| :--------- | :------- | :--- | :--------------------------------------- |
| `story`    | `string` | ○    | 物語の英文本文（画像生成の元となる英文） |
| `title`    | `string` | -    | 物語のタイトル（日本語、任意）           |

### 📤 レスポンス（バック → フロント）

#### 成功時 `200 OK`

```json
{
  "success": true,
  "image": {
    "url": "https://example.supabase.co/storage/v1/object/public/story-images/abc123.webp",
    "alt": "朝の公園で走る学生"
  }
}
```

| フィールド  | 型               | 説明                                           |
| :---------- | :--------------- | :--------------------------------------------- |
| `success`   | `boolean`        | 成功フラグ（`true`）                           |
| `image`     | `StoryImageInfo` | 生成された画像情報                             |
| `image.url` | `string`         | Supabase Storage の公開画像URL                 |
| `image.alt` | `string`         | 画像の代替テキスト（アクセシビリティ・説明用） |

#### エラー時 `400 Bad Request` / `429 Too Many Requests` / `500 Internal Server Error`

- `400`: `物語の本文（story）を入力してください`
- `429`: `AIの利用制限に達しました。しばらく時間を置いてから再度お試しください`
- `500`: `画像の生成に失敗しました`

### TypeScript 型定義 (`@/app/api/stories/generate-image/route`)

```typescript
export interface GenerateImageRequest {
  story: string;
  title?: string;
}

export interface StoryImageInfo {
  url: string;
  alt: string;
}

export interface GenerateImageResponse {
  success: boolean;
  image?: StoryImageInfo;
  error?: string;
}
```

---

## 9. ランダム物語クイズ取得 API

ユーザーが作成・保存した物語の中からランダムに **指定件数（デフォルト 3 件）の物語** を取得し、それぞれの物語に含まれる **すべての設定単語** を穴埋めクイズ用データとして返却します。

フロントエンドでは、1 つの物語ごとに英文本文（`story`）内の対象単語箇所（`surfaces`）を入力ボックス（`<input>`）に置き換え、下部に和訳本文（`japaneseStory`）を表示します。ユーザーは **全 3 話の物語を 1 話ずつ順番に穴埋めタイピングで解いていき、最後に総合結果画面を表示** します。

- **URL**: `GET /api/quiz/random`
- **Content-Type**: なし（クエリパラメータ）
- **実装ファイル**: `app/api/quiz/random/route.ts`

### 📥 リクエスト（フロント → バック）

| パラメータ | 型       | 必須 | デフォルト | 説明                                                   |
| :--------- | :------- | :--- | :--------- | :----------------------------------------------------- |
| `userId`   | `number` | ○    | -          | クイズ対象のユーザーID                                 |
| `limit`    | `number` | -    | `3`        | ランダムに取得する**物語の件数**（出題数。通常は 3 件） |

例: `GET /api/quiz/random?userId=1&limit=3`

> ℹ️ `userId` はログイン機能が実装されるまで、仮の値（例: `1`）を指定します。
> ℹ️ ユーザーが作成した物語が 3 件未満（例: 2 件）の場合は、存在するすべての物語（2 件）を返却します。

### 📤 レスポンス（バック → フロント）

#### 成功時 `200 OK`

```json
{
  "success": true,
  "data": {
    "totalStories": 3,
    "stories": [
      {
        "storyId": 12,
        "title": "騎士とドラゴンの城",
        "story": "A brave knight drew his shiny sword. He walked into the dark castle. Suddenly, a huge dragon appeared in front of him.",
        "japaneseStory": "勇敢な騎士は光り輝く剣を抜きました。彼は暗い城へと足を踏み入れました。突然、巨大なドラゴンが彼の目の前に現れました。",
        "imageUrl": "https://yvrlwyhermccaunyoefz.supabase.co/storage/v1/object/public/story-images/user_1_story_12.png",
        "words": [
          {
            "meaningId": 8,
            "wordId": 6,
            "word": "sword",
            "meaning": "剣",
            "surfaces": ["sword"]
          },
          {
            "meaningId": 9,
            "wordId": 7,
            "word": "castle",
            "meaning": "城",
            "surfaces": ["castle"]
          },
          {
            "meaningId": 10,
            "wordId": 8,
            "word": "dragon",
            "meaning": "ドラゴン",
            "surfaces": ["dragon"]
          }
        ]
      },
      {
        "storyId": 15,
        "title": "公園での朝のルーティン",
        "story": "Every morning, I run through the green park and greet my neighbor...",
        "japaneseStory": "毎朝、私は緑豊かな公園を走り、近所の人に挨拶をします...",
        "imageUrl": null,
        "words": [
          {
            "meaningId": 14,
            "wordId": 11,
            "word": "park",
            "meaning": "公園",
            "surfaces": ["park"]
          },
          {
            "meaningId": 15,
            "wordId": 12,
            "word": "greet",
            "meaning": "挨拶する",
            "surfaces": ["greet"]
          }
        ]
      },
      {
        "storyId": 18,
        "title": "不思議な図書館の秘密",
        "story": "In the silent library, she discovered an ancient book...",
        "japaneseStory": "静かな図書館で、彼女は一冊の古い本を見つけました...",
        "imageUrl": null,
        "words": [
          {
            "meaningId": 21,
            "wordId": 16,
            "word": "library",
            "meaning": "図書館",
            "surfaces": ["library"]
          },
          {
            "meaningId": 22,
            "wordId": 17,
            "word": "discover",
            "meaning": "発見する",
            "surfaces": ["discovered"]
          },
          {
            "meaningId": 23,
            "wordId": 18,
            "word": "ancient",
            "meaning": "古代の",
            "surfaces": ["ancient"]
          }
        ]
      }
    ]
  }
}
```

| フィールド                          | 型               | 説明                                                     |
| :---------------------------------- | :--------------- | :------------------------------------------------------- |
| `success`                           | `boolean`        | 成功フラグ（`true`）                                     |
| `data`                              | `QuizResponseData` | 出題されるクイズデータ全体                             |
| `data.totalStories`                 | `number`         | 取得された物語の件数（最大 `limit` 件）                  |
| `data.stories`                      | `QuizStory[]`    | 出題される物語の配列（全 3 話）                          |
| `data.stories[].storyId`            | `number`         | 物語ID                                                   |
| `data.stories[].title`              | `string`         | 物語の日本語タイトル                                     |
| `data.stories[].story`              | `string`         | 英文本文（フロントで対象単語箇所を入力欄に置換）         |
| `data.stories[].japaneseStory`      | `string`         | 和訳本文（画面下部に表示）                               |
| `data.stories[].imageUrl`           | `string \| null` | 物語の挿絵画像URL（あれば表示、なければ `null`）         |
| `data.stories[].words`              | `QuizWord[]`     | その物語に含まれる**すべての設定単語**                   |
| `data.stories[].words[].meaningId`  | `number`         | 意味ID（`meanings` テーブルの主キー）                    |
| `data.stories[].words[].wordId`     | `number`         | 単語ID（`words` テーブルの主キー）                       |
| `data.stories[].words[].word`       | `string`         | 原形の英単語（正解判定用）                               |
| `data.stories[].words[].meaning`    | `string`         | 日本語の意味                                             |
| `data.stories[].words[].surfaces`   | `string[]`       | 本文中での活用形（本文の穴埋め対象特定および正解判定用） |

#### エラー時

| ステータスコード            | ケース                             | レスポンス例                                                                |
| :-------------------------- | :--------------------------------- | :-------------------------------------------------------------------------- |
| `400 Bad Request`           | `userId` の未指定                  | `{"success": false, "error": "ユーザーID（userId）が指定されていません"}`   |
| `404 Not Found`             | 出題可能な物語が1件も存在しない    | `{"success": false, "error": "クイズを出題できる物語が登録されていません"}` |
| `500 Internal Server Error` | DB接続エラー等のサーバー内部エラー | `{"success": false, "error": "クイズデータの取得に失敗しました"}`           |

### 💡 フロントエンドでのクイズ進行・正誤判定仕様（実装推奨）

1. **画面の進行フロー（全 3 話）**:
   - **ステップ 1（1話目）**: 1 つ目の物語を表示。本文中の全単語箇所を `<input>` にして、和訳を見ながら埋める。
   - **ステップ 2（2話目）**: 2 つ目の物語を表示して同様に解く。
   - **ステップ 3（3話目）**: 3 つ目の物語を表示して同様に解く。
   - **ステップ 4（総合結果画面）**: 全 3 話で出題された全単語の正誤まとめとスコア（例: 「全 8 単語中 7 単語正解！🎉」）を表示。
2. **穴埋め表示**:
   - 物語英文本文（`story`）の中から `words[i].surfaces`（または `word`）に一致する箇所を、`<input placeholder="①">` のような入力フィールドに置き換えてレンダリングします。
   - 英文の下部には `japaneseStory`（和訳）を表示し、全体の文脈を把握しながら解けるようにします。
3. **正誤判定（大文字・小文字の許容）**:
   - ユーザー入力値（トリム後）と `words[i].word` または `words[i].surfaces` を **大文字小文字を区別せず（`toLowerCase()`）** 比較します。
   - 原形・活用形のどちらを入力しても正解と判定します。

### TypeScript 型定義 (`@/app/api/quiz/random/route`)

```typescript
export interface QuizWord {
  meaningId: number;
  wordId: number;
  word: string;
  meaning: string;
  surfaces: string[];
}

export interface QuizStory {
  storyId: number;
  title: string;
  story: string;
  japaneseStory: string;
  imageUrl: string | null;
  words: QuizWord[];
}

export interface QuizResponseData {
  totalStories: number;
  stories: QuizStory[];
}

export interface RandomQuizResponse {
  success: boolean;
  data?: QuizResponseData;
  error?: string;
}
```

---
