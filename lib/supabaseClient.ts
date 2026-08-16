import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mlavvwnhzxkundihpaxb.supabase.co";
const supabaseAnonKey = "sb_publishable_2jlh3UZMJJKuBanCmPQRIA_qGt3uWpB";

declare global {
  var __supabaseInstance: SupabaseClient | undefined;
}

export const supabase: SupabaseClient =
  globalThis.__supabaseInstance ??
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__supabaseInstance = supabase;
}