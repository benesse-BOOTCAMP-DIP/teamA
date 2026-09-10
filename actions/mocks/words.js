// actions/mocks/words.js

// ① モック用初期データ（メモリ上で保持）
let mockWords = [
  { id: 1, term: 'Apple', definition: 'りんご', created_at: '2026-09-01T00:00:00Z' },
  { id: 2, term: 'Database', definition: 'データの基地・保管庫', created_at: '2026-09-02T00:00:00Z' },
  { id: 3, term: 'Frontend', definition: 'ユーザーが見る画面側', created_at: '2026-09-03T00:00:00Z' },
];

// 擬似的な通信待ち時間（500ms）を作る補助関数
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ② 単語一覧取得のモック
export async function getWords0Mock() {
  await sleep(500); // 通信ディレイを再現
  return [...mockWords];
}

// ③ 単語登録のモック
export async function addWordMock(data) {
  await sleep(500);

  // かんたんなバリデーション確認もできる
  if (!data.term || !data.definition) {
    return { success: false, error: '単語と意味を入力してください（Mock）' };
  }

  const newWord = {
    id: Date.now(), // 簡易的なID採番
    term: data.term,
    definition: data.definition,
    created_at: new Date().toISOString(),
  };

  mockWords.unshift(newWord); // 先頭に追加
  return { success: true, data: newWord };
}