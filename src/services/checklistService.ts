// src/services/checklistService.ts
import { supabase } from "@/utils/supabaseClient";

// 📌 ชนิดข้อมูลพื้นฐานของ checklist (ปรับเพิ่ม field ตามจริงที่มีใน DB)
export interface Checklist {
  id: string;
  title: string;
  description?: string | null;
  user_id: string;          // ✅ ใช้ user_id ตาม RLS
  created_at: string;       // timestamp in DB
  updated_at?: string | null;
  // ... เพิ่มฟิลด์อื่นๆ ที่มีจริง เช่น status, year, template_id ฯลฯ
}

// ดึง user id ของผู้ล็อกอินปัจจุบัน
export async function getAuthUid() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) {
    throw new Error("ไม่พบผู้ใช้ (auth.uid) — โปรดล็อกอิน");
  }
  return data.user.id;
}

// โหลดรายการ checklist ของผู้ใช้ (ตาม RLS: user_id = auth.uid())
export async function getChecklists(): Promise<Checklist[]> {
  const uid = await getAuthUid();

  const { data, error } = await supabase
    .from("checklists")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("โหลด checklists ผิดพลาด:", error);
    throw error;
  }
  return (data as Checklist[]) || [];
}

// สร้าง checklist ใหม่ (ต้องส่ง user_id ให้ผ่าน WITH CHECK)
export async function createChecklist(payload: {
  title: string;
  description?: string;
  // ... field อื่นๆ ที่ต้องการ
}): Promise<Checklist> {
  const uid = await getAuthUid();

  const insertData = { ...payload, user_id: uid };

  const { data, error } = await supabase
    .from("checklists")
    .insert([insertData])
    .select("*")
    .single();

  if (error) {
    console.error("สร้าง checklist ผิดพลาด:", error);
    throw error;
  }
  return data as Checklist;
}

// แก้ไข checklist ของตัวเอง (RLS คุมสิทธิ์อยู่แล้ว)
export async function updateChecklist(
  id: string,
  patch: Partial<Omit<Checklist, "id" | "user_id" | "created_at">>
): Promise<Checklist> {
  // ไม่จำเป็นต้องตรวจ uid ที่นี่ เพราะ RLS จะบังคับผ่าน user_id = auth.uid()
  const { data, error } = await supabase
    .from("checklists")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("อัปเดต checklist ผิดพลาด:", error);
    throw error;
  }
  return data as Checklist;
}

// ลบ checklist ของตัวเอง (ถ้ามีนโยบาย DELETE จะอิง RLS เหมือนกัน)
export async function deleteChecklist(id: string): Promise<void> {
  const { error } = await supabase
    .from("checklists")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("ลบ checklist ผิดพลาด:", error);
    throw error;
  }
}
