import fs from "fs";
import path from "path";

// 1. .env.local から GROQ_API_KEY / OPENAI_API_KEY を読み込む
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    for (const key of ["GROQ_API_KEY", "OPENAI_API_KEY"]) {
      if (trimmed.startsWith(`${key}=`)) {
        process.env[key] = trimmed
          .replace(`${key}=`, "")
          .replace(/["']/g, "")
          .trim();
      }
    }
  }
}

// 2. 作成したAPIのPOSTハンドラーをインポート
import { POST } from "./app/api/words/translate/route";

async function runTest() {
  // コマンド引数から単語を取得（指定がなければデフォルトの単語を使用）
  const customWords = process.argv.slice(2);
  const wordsToTest =
    customWords.length > 0 ? customWords : ["coffee", "piano", "develop"];

  console.log("==================================================");
  console.log("🔍 送信する英単語:", wordsToTest);
  console.log("🤖 Groq API に問い合わせ中... 少々お待ちください");
  console.log("==================================================");

  // 3. 擬似的な HTTP POST リクエストを作成
  const request = new Request("http://localhost:3000/api/words/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      words: wordsToTest,
    }),
  });

  const startTime = Date.now();
  const response = await POST(request);
  const result = await response.json();
  const duration = Date.now() - startTime;

  console.log(
    `\n✅ レスポンス受信完了 (ステータス: ${response.status}, 所要時間: ${duration}ms)`,
  );
  console.log("\n【フロントエンドに届くレスポンス結果 (JSON)】");
  console.log(JSON.stringify(result, null, 2));

  console.log("\n【プルダウンの表示イメージ】");
  if (result.translations) {
    for (const item of result.translations) {
      console.log(`  単語: ${item.english}`);
      console.log(`  └ 選択肢: [ ${item.options.join(" | ")} ]`);
    }
  }
  console.log("==================================================");
}

runTest().catch((err) => {
  console.error("❌ エラーが発生しました:", err);
});
