// src/utils/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      Accept: "application/json", // 👈 กัน 406
    },
  },
});

// ✅ DEBUG ONLY: เรียก supabase ได้จาก Console (เฉพาะฝั่งเบราว์เซอร์)
if (typeof window !== "undefined") {
  (window as any).supabase = supabase;
}
