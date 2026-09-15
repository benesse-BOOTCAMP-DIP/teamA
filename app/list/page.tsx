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

type Story={
  id:number;
  title:string;
  content:string;
};

export default function Tabs() {
  // 現在表示しているタブ
  const [activeTab, setActiveTab] = useState<Tab>("story");
  //単語データ
  const [words,setWords]=useState<GroupedWord[]>([]);
  //物語データ
  const [stories,setStories]=useState<Story[]>([]);

  useEffect(() => {
    async function getMockData() {
      const response = await fetch("/api/mocks/words");

      if (!response.ok) {
        // throw new Error("モックデータの取得に失敗しました");
        alert("モックデータの取得に失敗しました");
      }

      const data: MocksResponse = await response.json();

      //英単語の取得
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

      //物語データの取得
      setStories(data.stories);
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
            {stories.map((story) => (
              <div key={story.id}>
                <h3>{story.title}</h3>
                <p>{story.content}</p>
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
