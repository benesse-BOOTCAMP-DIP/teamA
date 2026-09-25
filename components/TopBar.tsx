"use client";
import styles from "./TopBar.module.css";
import "../app/globals.css";

export default function TopBar() {
  return (
    <div className={styles.headerBlock}>
     <header className={`font ${styles.header}`}>MONOGATAN</header>
     <p className={styles.icon}>icon</p>
    </div>
  );
}
