"use client";

import { useEffect, useState } from "react";
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
    <div className="container">
      <div className={styles.boxCenter}>
        <input
          className={styles.searchInput}
          type="text"
          value={searchWord}
          onChange={(e) => setSearchWord(e.target.value)}
          placeholder="検索キーワードを入力してください"
        />
      </div>
      <div className={`${styles.tabs} ${styles.boxCenter}`}>
        <button  className={`${styles.tab} ${
      activeTab === "story" ? styles.active : ""
    }`} onClick={() => setActiveTab("story")}>
          物語
        </button>

        <button className={`${styles.tab} ${
      activeTab === "word" ? styles.active : ""
    }`} onClick={() => setActiveTab("word")}>
          単語
        </button>
      </div>

      <div>
        {activeTab === "story" && (
          <div className={styles.story}>
            {filteredStories.map((story) => (
              <div key={story.id}>
                <h3 className={styles.title}>{story.title}</h3>
                <p className={styles.content}>{story.content}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "word" && (
          <div className={styles.boxCenter}>
            <table className={styles.wordTable}>
              <thead>
                <tr>
                  <th className={`${styles.tableRow} ${styles.textCenter}`}>英語</th>
                  <th className={`${styles.tableRow} ${styles.textCenter}`}>日本語</th>
                </tr>
              </thead>
              <tbody>
                  {filteredWords.map((word)=>{
                      return(         
                          <tr key={word.word_id}>
                              <td className={styles.textCenter}>{word.english}</td>
                              <td  className={styles.textCenter}>
                                {word.meanings.map((meaning) => {
                                  return <p key={meaning.meaning_id}>{meaning.meaning}</p>;
                                })}
                              </td>
                          </tr>
                      );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
