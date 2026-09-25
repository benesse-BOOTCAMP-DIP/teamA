"use client";

import styles from "./Loading.module.css";

export default function Loading() {
  return (
    <div className={styles.loading}>
        <p className="radius">読み込み中…</p>
    </div>
  );
}
