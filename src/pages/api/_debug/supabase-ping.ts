// src/pages/api/_debug/supabase-ping.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabaseServer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // โจทย์ง่ายสุด: list ตารางระบบ (ถ้าเปิด PostgREST introspection)
    // ถ้าโปรเจ็กต์ปิดไว้ ให้เปลี่ยนไป select จากตารางของคุณแทน
    const { data, error } = await supabase
      .from("data_sources")
      .select("id")
      .limit(1);

    if (error) {
      return res.status(200).json({ ok: false, stage: "query", error: error.message });
    }
    return res.status(200).json({ ok: true, sample: data });
  } catch (e: any) {
    return res.status(200).json({ ok: false, stage: "catch", error: e?.message || "unknown" });
  }
}
