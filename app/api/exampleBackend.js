"use server";

import { revalidatePath } from "next/cache";

/**
 * @typedef {Object} Todo
 * @property {string} id
 * @property {string} title
 */

/**
 * @typedef {Object} ActionResponse
 * @property {boolean} success - 処理の成否
 * @property {any} [data] - 成功時の返却データ
 * @property {string} [error] - 失敗時のエラーメッセージ
 */

/**
 * Todo 一覧を取得する
 * @returns {Promise<ActionResponse>}
 */
export async function getTodos() {
  // バックエンド担当が後から Supabase 処理に差し替える
  return {
    success: true,
    data: [
      { id: "1", title: "モックTodo 1" },
      { id: "2", title: "モックTodo 2" },
    ],
  };
}

/**
 * 新規 Todo を作成する
 * @param {FormData} formData - フォームデータ (title)
 * @returns {Promise<ActionResponse>}
 */
export async function createTodo(formData) {
  const title = formData.get("title");

  // 入力チェック（仕様の合意）
  if (!title || typeof title !== "string" || !title.trim()) {
    return { success: false, error: "タイトルを入力してください" };
  }

  // TODO: Supabase insert 処理
  revalidatePath("/");
  return { success: true, data: { id: "new-id" } };
}

/**
 * Todo を更新する
 * @param {FormData} formData - フォームデータ (id, title)
 * @returns {Promise<ActionResponse>}
 */
export async function updateTodo(formData) {
  const id = formData.get("id");
  const title = formData.get("title");

  if (!id || !title) {
    return { success: false, error: "IDとタイトルは必須です" };
  }

  // TODO: Supabase update 処理
  revalidatePath("/");
  return { success: true };
}

/**
 * Todo を削除する
 * @param {FormData} formData - フォームデータ (id)
 * @returns {Promise<ActionResponse>}
 */
export async function deleteTodo(formData) {
  const id = formData.get("id");

  if (!id) {
    return { success: false, error: "IDは必須です" };
  }

  // TODO: Supabase delete 処理
  revalidatePath("/");
  return { success: true };
}
