import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a browser-side Supabase client instance.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
