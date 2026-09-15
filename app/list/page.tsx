"use client";

import { useEffect, useState } from "react";
import type { MocksResponse, Word } from "@/app/api/mocks/words/route";
import styles from "./page.module.css";
import { mock } from "node:test";

type Tab = "story" | "word";

type GroupedWord = {
  word_id: number;
  english: string;
  meanings: string[];
};

export default function Tabs() {
  // 現在表示しているタブ
  const [activeTab, setActiveTab] = useState<Tab>("story");
  //単語データ
  const [words,setWords]=useState<GroupedWord[]>([]);

  useEffect(() => {
    async function getMockData() {
      const response = await fetch("/api/mocks/words");
      console.log(response);
      
      if (!response.ok) {
        // throw new Error("モックデータの取得に失敗しました");
        alert("モックデータの取得に失敗しました");
      }

      const data: MocksResponse = await response.json();

      console.log(data);

      const groupedWords = data.words.reduce<GroupedWord[]>((result, word) => {
        const existingWord = result.find(
          (item) => item.word_id === word.word_id
        );

        if (existingWord) {
          existingWord.meanings.push(word.japanese);
        } else {
          result.push({
            word_id: word.word_id,
            english: word.english,
            meanings: [word.japanese],
          });
        }

        return result;
    }, []);

      setWords(groupedWords);
    }

    getMockData();
  }, []);


  console.log(words);
  return (
    <div className="container">
      <div className={`${styles.tabs} ${styles.boxCenter}`}>
        <button className={styles.tab} onClick={() => setActiveTab("story")}>
          物語
        </button>

        <button className={styles.tab} onClick={() => setActiveTab("word")}>
          単語
        </button>
      </div>

      <div>
        {activeTab === "story" && (
          <div>
            <h2>物語一覧</h2>
            <p>ここに物語を表示</p>
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
                  {words.map((word)=>{
                      return(         
                          <tr key={word.word_id}>
                              <td className={styles.textCenter}>{word.english}</td>
                              <td  className={styles.textCenter}>
                                {word.meanings.map((meaning) => {
                                  return <p key={meaning}>{meaning}</p>;
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
