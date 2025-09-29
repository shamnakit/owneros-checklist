// src/utils/supabaseServer.ts

import { createClient } from "@supabase/supabase-js";

// ตรวจสอบและดึงค่า Environment Variables สำหรับ Supabase
// **สำคัญ:** ค่าเหล่านี้ถูกอ่านจากไฟล์ .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  // หากตั้งค่าไม่ครบ ให้แสดงข้อความแจ้งเตือนที่ชัดเจน
  // ใน production ระบบจะแจ้งเตือน (throw) ตรงนี้ทันที
  throw new Error("Missing Supabase environment variables for server-side connection. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
}

// สร้าง Supabase Client สำหรับฝั่ง Server
// ใช้ 'Service Role Key' เพื่อให้มีสิทธิ์ในการเขียนข้อมูล (upsert)
export const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false, // ไม่ต้องเก็บ session เพราะใช้ในฝั่ง server API
    },
  }
);