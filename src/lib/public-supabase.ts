import { createClient } from "@supabase/supabase-js";

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, supabaseKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
