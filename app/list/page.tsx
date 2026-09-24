"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { WordsListResponse } from "@/app/api/words/route";
import styles from "./page.module.css";

type Tab = "story" | "word";

type GroupedWord = {
  word_id: number;
  english: string;
  meanings:Meaning[];
};

type Meaning={
  meaning_id:number;
  meaning:string;
}

type Story={
  id:number;
  title:string;
  content:string;
};

export default function Tabs() {
  //検索キーワード
  const [searchWord, setSearchWord] = useState("");
  // 現在表示しているタブ
  const [activeTab, setActiveTab] = useState<Tab>("story");
  //単語データ
  const [words,setWords]=useState<GroupedWord[]>([]);
  //物語データ
  const [stories,setStories]=useState<Story[]>([]);

  useEffect(() => {
    async function getData() {
      const response = await fetch("/api/words?userId=1");

      if (!response.ok) {
        alert("モックデータの取得に失敗しました");
      }

      const data: WordsListResponse = await response.json();

      //同じ英単語の意味を配列に保持
      const groupedWords = data.words.reduce<GroupedWord[]>((result, word) => {
        const existingWord = result.find(
          (item) => item.word_id === word.word_id
        );

        if (existingWord) {
          existingWord.meanings.push({ meaning_id: word.meaning_id, meaning: word.japanese, });
        } else {
          result.push({
             word_id: word.word_id,
             english: word.english, 
             meanings: [ { meaning_id: word.meaning_id, meaning: word.japanese, }, ], });
        }

        return result;
      }, []);

      setWords(groupedWords);

      //物語データの取得
      setStories(data.stories);
    }

    getData();
  }, []);

  const filteredStories = stories.filter(
    (story) =>
      story.title.includes(searchWord) ||
      story.content.includes(searchWord)
  );

  const filteredWords = words.filter(
    (word) =>
      word.english.includes(searchWord) ||
      word.meanings.some((meaning) =>
        meaning.meaning.includes(searchWord)
      )
  );
  
  return (
    <div className="container py-8 px-4">
      {/* Top Header / Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold tracking-wide sunset-gradient-text flex items-center gap-2">
          <span>ライブラリ一覧</span>
        </h1>
        <Link
          href="/register"
          className="text-xs font-bold text-[#f5e6ab] bg-gradient-to-r from-[#dd7c5d] to-[#ba666b] px-3.5 py-2 rounded-xl shadow-md border border-[#e79f4d]/30 hover:brightness-110 transition flex items-center gap-1.5"
        >
          <span>単語を登録する</span>
        </Link>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <input
          className={styles.searchInput}
          type="text"
          value={searchWord}
          onChange={(e) => setSearchWord(e.target.value)}
          placeholder="🔍 キーワードで物語・単語を検索..."
        />
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "story" ? styles.active : ""}`}
          onClick={() => setActiveTab("story")}
        >
       物語一覧 ({filteredStories.length})
        </button>

        <button
          className={`${styles.tab} ${activeTab === "word" ? styles.active : ""}`}
          onClick={() => setActiveTab("word")}
        >
        単語一覧 ({filteredWords.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === "story" && (
          <div className={styles.story}>
            {filteredStories.length === 0 ? (
              <div className="sunset-glass-card rounded-2xl p-8 text-center text-[#f5e6ab]/60 text-sm">
                該当する物語が見つかりませんでした。
              </div>
            ) : (
              filteredStories.map((story) => (
                <Link key={story.id} href={`/list/${story.id}`} className="block group">
                  <div className={styles.storyContainer}>
                    <div className="flex-1 min-w-0">
                      <h3 className={styles.title}>{story.title}</h3>
                      <p className={styles.storyText}>{story.content}</p>
                    </div>
                    <span className={`${styles.titleLink} group-hover:translate-x-1 transition-transform`}>
                      ➔
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === "word" && (
          <div>
            {filteredWords.length === 0 ? (
              <div className="sunset-glass-card rounded-2xl p-8 text-center text-[#f5e6ab]/60 text-sm">
                該当する単語が見つかりませんでした。
              </div>
            ) : (
              <table className={styles.wordTable}>
                <thead>
                  <tr>
                    <th className={styles.tableRow}>英単語</th>
                    <th className={styles.tableRow}>日本語訳</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWords.map((word) => {
                    return (
                      <tr key={word.word_id}>
                        <td className="font-bold text-[#f5e6ab] px-4 py-3">{word.english}</td>
                        <td className="px-4 py-3 text-[#f5e6ab]/80">
                          {word.meanings.map((meaning) => (
                            <span key={meaning.meaning_id} className="inline-block bg-[#5f448a]/40 border border-[#e79f4d]/30 rounded-lg px-2.5 py-0.5 text-xs mr-1.5 my-0.5 text-[#f5e6ab]">
                              {meaning.meaning}
                            </span>
                          ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

