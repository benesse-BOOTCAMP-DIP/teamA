"use client";
import styles from "./TopBar.module.css";

export default function TopBar() {
  return (
    <div className={styles.headerBlock}>
     <header className={styles.header}>MONOGATAN</header>
     <p className={styles.icon}>icon</p>
    </div>
  );
}
