// src/services/checklistService.ts
import { supabase } from "@/utils/supabaseClient";

export interface Checklist {
  id: string;
  title: string;
  description?: string | null;
  user_id: string;      // ตรง RLS
  created_at: string;
  updated_at?: string | null;
}

async function getAuthUid() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) {
    throw new Error("ไม่พบผู้ใช้ (auth.uid) — โปรดล็อกอิน");
  }
  return data.user.id;
}

/** โหลดรายการ checklist ของผู้ใช้ปัจจุบัน */
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

/** สร้าง checklist ใหม่ (แนบ user_id ให้ผ่าน WITH CHECK ของ RLS) */
export async function createChecklist(payload: {
  title: string;
  description?: string;
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

/** ปรับปรุง checklist ของตนเอง */
export async function updateChecklist(
  id: string,
  patch: Partial<Omit<Checklist, "id" | "user_id" | "created_at">>
): Promise<Checklist> {
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

/** ลบ checklist ของตนเอง */
export async function deleteChecklist(id: string): Promise<void> {
  const { error } = await supabase.from("checklists").delete().eq("id", id);
  if (error) {
    console.error("ลบ checklist ผิดพลาด:", error);
    throw error;
  }
}
