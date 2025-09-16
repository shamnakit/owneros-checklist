// src/lib/kpis.ts
// Helper ดึง KPI ผ่าน Supabase RPC (ใช้ฝั่ง client ได้)
// ต้องมีฟังก์ชันใน DB: fn_sales_mtd, fn_ar_over_30, fn_nps_score (เราใส่ใน migration แล้ว)

import { supabase } from "@/utils/supabaseClient";

function iso(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

/** Sales MTD (รวมทุก channel) */
export async function getSalesMtd(orgId: string, ref: Date = new Date()): Promise<number> {
  const p_ref = iso(ref);
  const { data, error } = await supabase.rpc("fn_sales_mtd", { p_org: orgId, p_ref });
  if (error) throw error;
  return Number(data || 0);
}

/** AR > 30 ณ วันที่กำหนด */
export async function getArOver30(orgId: string, asOf: Date = new Date()): Promise<number> {
  const p_as_of = iso(asOf);
  const { data, error } = await supabase.rpc("fn_ar_over_30", { p_org: orgId, p_as_of });
  if (error) throw error;
  return Number(data || 0);
}

/** NPS ของเดือนปัจจุบัน (Promoters - Detractors) / Responses */
export async function getNpsThisMonth(orgId: string, ref: Date = new Date()): Promise<number> {
  const from = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const { data, error } = await supabase.rpc("fn_nps_score", {
    p_org: orgId,
    p_from: iso(from),
    p_to: iso(ref),
  });
  if (error) throw error;
  return Number(data || 0);
}
