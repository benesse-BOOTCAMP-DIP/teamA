"use client";

import styles from "./page.module.css";

import { useState } from "react";

type Tab = "story" | "word";

export default function Tabs() {
  // 現在表示しているタブ
  const [activeTab, setActiveTab] = useState<Tab>("story");

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
          <div>
            <h2>単語一覧</h2>
            <p>ここに単語を表示</p>
          </div>
        )}
      </div>
    </div>
  );
}
