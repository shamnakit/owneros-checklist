// src/pages/api/integrations/list.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabaseServer";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function resolveOrgId(orgIdOrKey: string): Promise<string> {
  if (UUID_RE.test(orgIdOrKey)) return orgIdOrKey;
  const { data, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("key", orgIdOrKey)
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error("ไม่พบองค์กรจาก key ที่ส่งมา");
  return data.id as string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const orgIdRaw = (req.query.orgId as string) || "";
    if (!orgIdRaw) return res.status(400).json({ success: false, error: "missing orgId" });

    const orgId = await resolveOrgId(orgIdRaw);

    const { data, error } = await supabase
      .from("data_sources")
      .select("id, code, name, kind, active, credentials")
      .eq("org_id", orgId)
      .order("name", { ascending: true });

    if (error) throw error;

    const sources = (data || []).map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      kind: r.kind,
      active: !!r.active,
      created_at: "", // ตารางนี้ยังไม่มี created_at
      last_sync: null, // ไว้ต่อกับ sync_jobs ภายหลัง
    }));

    return res.status(200).json({ success: true, sources });
  } catch (e: any) {
    console.error("list integrations failed:", e);
    return res.status(500).json({ success: false, error: e?.message || "internal error" });
  }
}
