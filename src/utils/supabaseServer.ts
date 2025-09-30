// src/utils/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";
if (typeof window !== "undefined") throw new Error("Do not import supabaseServer on the client.");
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (!supabaseUrl || !serviceRole) {
  const miss = [];
  if (!supabaseUrl) miss.push("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRole) miss.push("SUPABASE_SERVICE_ROLE_KEY");
  throw new Error("[supabaseServer] Missing env: " + miss.join(" & "));
}
export const supabase = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});
