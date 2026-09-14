// app/page.jsx
"use client";

import { useEffect, useState } from "react";
import { getTodos, createTodo, updateTodo, deleteTodo } from "../api/exampleBackend";
import styles from "./page.module.css";

export default function Page() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  // 初期一覧の読み込み
  const fetchTodos = async () => {
    console.log("[READ] Fetching todos...");
    const result = await getTodos();
    if (result.success) {
      console.log("[READ Success] Fetched:", result.data);
      setTodos(result.data);
    } else {
      console.error("[READ Error]:", result.error);
      alert(`取得に失敗しました: ${result.error}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  // 追加 (Create) ハンドラー
  const handleCreate = async (formData) => {
    const title = formData.get("title");
    console.log("[CREATE] Sending data:", { title });

    const result = await createTodo(formData);

    if (result.success) {
      console.log("[CREATE Success] Added:", result.data);
      alert("タスクを追加しました！");
      await fetchTodos();
    } else {
      console.error("[CREATE Error]:", result.error);
      alert(`追加に失敗しました: ${result.error}`);
    }
  };

  // 更新 (Update) ハンドラー
  const handleUpdate = async (formData) => {
    const id = formData.get("id");
    const title = formData.get("title");
    console.log("[UPDATE] Sending data:", { id, title });

    const result = await updateTodo(formData);

    if (result.success) {
      console.log("[UPDATE Success] ID:", id);
      alert("タスクを更新しました！");
      await fetchTodos();
    } else {
      console.error("[UPDATE Error]:", result.error);
      alert(`更新に失敗しました: ${result.error}`);
    }
  };

  // 削除 (Delete) ハンドラー
  const handleDelete = async (formData) => {
    const id = formData.get("id");

    // 削除前の確認アラート
    if (!confirm("本当にこのタスクを削除しますか？")) {
      console.log("[DELETE Cancelled] ID:", id);
      return;
    }

    console.log("[DELETE] Deleting ID:", id);
    const result = await deleteTodo(formData);

    if (result.success) {
      console.log("[DELETE Success] ID:", id);
      alert("タスクを削除しました！");
      await fetchTodos();
    } else {
      console.error("[DELETE Error]:", result.error);
      alert(`削除に失敗しました: ${result.error}`);
    }
  };

  if (loading) {
    return <main className={styles.container}><p>読み込み中...</p></main>;
  }

  return (
    <main className={styles.container}>
      <h2 className={styles.heading}>Todo リスト</h2>

      {/* CREATE */}
      <form action={handleCreate} className={styles.createForm}>
        <input
          name="title"
          placeholder="新しいタスク名"
          required
          className={styles.input}
        />
        <button type="submit" className={styles.addButton}>
          追加
        </button>
      </form>

      {/* READ, UPDATE, DELETE */}
      <ul className={styles.todoList}>
        {todos.map((todo) => (
          <li key={todo.id} className={styles.todoItem}>
            {/* UPDATE */}
            <form action={handleUpdate} className={styles.updateForm}>
              <input type="hidden" name="id" value={todo.id} />
              <input
                defaultValue={todo.title}
                name="title"
                required
                className={styles.input}
              />
              <button type="submit" className={styles.saveButton}>
                保存
              </button>
            </form>

            {/* DELETE */}
            <form action={handleDelete}>
              <input type="hidden" name="id" value={todo.id} />
              <button type="submit" className={styles.deleteButton}>
                削除
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}