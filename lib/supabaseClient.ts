import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mlavvwnhzxkundihpaxb.supabase.co";
const supabaseAnonKey = "sb_publishable_2jlh3UZMJJKuBanCmPQRIA_qGt3uWpB";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);