// src/utils/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";

// ✅ กันการนำไปใช้ฝั่ง client โดยไม่ตั้งใจ
if (typeof window !== "undefined") {
  throw new Error("Do not import supabaseServer on the client.");
}

// ✅ รองรับทั้ง SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_URL (แต่ควรตั้ง SUPABASE_URL ให้ตรง)
const supabaseUrl =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? // fallback เผื่อ dev ลืมตั้ง
  "";

const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""; // ต้องเป็น Service Role เท่านั้น

// ✅ Fail fast พร้อมบอกตัวแปรที่หายไป
if (!supabaseUrl || !serviceRole) {
  const missing: string[] = [];
  if (!supabaseUrl) missing.push("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRole) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  throw new Error("[supabaseServer] Missing env: " + missing.join(" & "));
}

// ✅ สร้าง client แบบ server-side เท่านั้น
export const supabase = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});
