"use server";

import { createClient } from "@/lib/supabase/server";
import { validateWordData } from "@/lib/validations/word";
import { revalidatePath } from "next/cache";

/**
 * Fetch all words with optional search filter.
 * @param {string} [searchQuery=""]
 */
export async function getWords(searchQuery = "") {
  const supabase = await createClient();
  let query = supabase
    .from("words")
    .select("*")
    .order("created_at", { ascending: false });

  if (searchQuery.trim()) {
    query = query.or(
      `word.ilike.%${searchQuery}%,meaning.ilike.%${searchQuery}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching words:", error);
    return [];
  }

  return data || [];
}

/**
 * Fetch a single word card by ID.
 * @param {string} id
 */
export async function getWordById(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("words")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching word:", error);
    return null;
  }

  return data;
}

/**
 * Create a new word card.
 * @param {Object} prevState
 * @param {FormData} formData
 */
export async function createWord(prevState, formData) {
  const rawData = {
    word: formData.get("word"),
    meaning: formData.get("meaning"),
    example: formData.get("example"),
    notes: formData.get("notes"),
  };

  const validation = validateWordData(rawData);
  if (!validation.success) {
    return { errors: validation.errors, success: false };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("words")
    .insert([validation.data])
    .select()
    .single();

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath("/words");
  return { success: true, word: data };
}

/**
 * Update an existing word card.
 * @param {string} id
 * @param {Object} prevState
 * @param {FormData} formData
 */
export async function updateWord(id, prevState, formData) {
  const rawData = {
    word: formData.get("word"),
    meaning: formData.get("meaning"),
    example: formData.get("example"),
    notes: formData.get("notes"),
  };

  const validation = validateWordData(rawData);
  if (!validation.success) {
    return { errors: validation.errors, success: false };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("words")
    .update(validation.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath("/words");
  revalidatePath(`/words/${id}`);
  return { success: true, word: data };
}

/**
 * Delete a word card by ID.
 * @param {string} id
 */
export async function deleteWord(id) {
  const supabase = await createClient();
  const { error } = await supabase.from("words").delete().eq("id", id);

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath("/words");
  return { success: true };
}
