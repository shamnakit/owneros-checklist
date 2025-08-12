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
      Accept: "application/json",
    },
    // ⛑️ บังคับย้ำอีกชั้น: ถ้า header หาย จะเติมให้ทุกครั้ง
    fetch: (url, options) => {
      const h = new Headers(options?.headers || {});
      if (!h.has("Accept")) h.set("Accept", "application/json");
      return fetch(url, { ...options, headers: h });
    },
  },
});

// DEBUG
if (typeof window !== "undefined") {
  (window as any).supabase = supabase;
}
