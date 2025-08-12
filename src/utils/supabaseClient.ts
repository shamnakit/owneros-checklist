// src/utils/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// ✅ DEBUG ONLY: ทำให้เรียก supabase จากหน้าต่าง Console ได้ (เฉพาะฝั่งเบราว์เซอร์)
if (typeof window !== "undefined") {
  // @ts-ignore
  (window as any).supabase = supabase;
}
