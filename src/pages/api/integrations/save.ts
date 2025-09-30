// src/pages/api/integrations/save.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabaseServer";

// --- helpers ---
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function resolveOrgId(orgIdOrKey: string): Promise<string> {
  if (UUID_RE.test(orgIdOrKey)) return orgIdOrKey;
  // ถ้าเป็น key ให้ map เป็น UUID จากตาราง organizations
  const { data, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("key", orgIdOrKey)
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error("ไม่พบองค์กรจาก key ที่ส่งมา");
  return data.id as string;
}

// ตัดให้เหลือโดเมนหลัก เช่น https://synergysoft.bitrix24.com/
function normalizeBaseUrl(webhookUrl: string): string {
  try {
    const u = new URL(webhookUrl);
    return `${u.protocol}//${u.host}/`;
  } catch {
    return "";
  }
}

// ดึง user id จาก path /rest/{user}/{code}/
function extractUserId(webhookUrl: string): string | null {
  try {
    const u = new URL(webhookUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    const i = parts.findIndex((p) => p === "rest");
    if (i >= 0 && parts[i + 1]) return parts[i + 1];
    return null;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Method Not Allowed" });
    }

    const orgIdRaw = (req.query.orgId as string) || "";
    if (!orgIdRaw) return res.status(400).json({ success: false, error: "missing orgId" });

    const orgId = await resolveOrgId(orgIdRaw);

    const body = req.body || {};
    if (body?.kind !== "bitrix24_webhook") {
      return res.status(400).json({ success: false, error: "unsupported kind" });
    }

    const webhook_url: string | undefined = body?.config?.webhook_url;
    if (
      !webhook_url ||
      !/^https:\/\/.+bitrix24\..+\/rest\/\d+\/[A-Za-z0-9]+\/$/.test(webhook_url)
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Webhook URL ไม่ถูกต้อง (ต้องลงท้ายด้วย /)" });
    }

    const base_url = normalizeBaseUrl(webhook_url);
    const user_id = body?.config?.user_id || extractUserId(webhook_url) || "";
    const name =
      body?.name || `Bitrix24 (${base_url.replace("https://", "").replace(/\/$/, "")})`;
    const kind = "bitrix24_webhook";

    // เก็บลงคอลัมน์ credentials (jsonb)
    const credentials = {
      webhook_url,
      base_url,
      user_id,
    };

    // upsert แบบ select ก่อน
    const { data: existed, error: selErr } = await supabase
      .from("data_sources")
      .select("id")
      .eq("org_id", orgId)
      .eq("kind", kind)
      .maybeSingle();
    if (selErr) throw selErr;

    if (existed?.id) {
      const { error: upErr } = await supabase
        .from("data_sources")
        .update({ name, credentials, active: true })
        .eq("id", existed.id as string);
      if (upErr) throw upErr;
      return res.status(200).json({ success: true, message: "updated", id: existed.id });
    } else {
      const code = "bitrix24";
      const { data: ins, error: insErr } = await supabase
        .from("data_sources")
        .insert([{ org_id: orgId, code, name, kind, credentials, active: true }])
        .select("id")
        .single();
      if (insErr) throw insErr;
      return res.status(200).json({ success: true, message: "created", id: ins?.id });
    }
  } catch (e: any) {
    console.error("save integration failed:", e);
    return res.status(500).json({ success: false, error: e?.message || "internal error" });
  }
}
