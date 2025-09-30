// src/pages/api/integrations/save.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabaseServer";

// ---------- helpers ----------
const bad = (res: NextApiResponse, msg: string, code = 400) =>
  res.status(code).json({ success: false, error: msg });

const isUuid = (s?: string | null) =>
  !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s as string);

// orgIdOrKey: UUID หรือ key (text) -> คืน UUID ของ organizations.id
async function resolveOrg(orgIdOrKey: string): Promise<string> {
  if (isUuid(orgIdOrKey)) return orgIdOrKey;
  const { data, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("key", orgIdOrKey)
    .single();
  if (error || !data) throw new Error("Invalid org identifier (not UUID and key not found)");
  return data.id as string;
}

const isWebhookUrl = (u: unknown): u is string => {
  if (typeof u !== "string") return false;
  try {
    const url = new URL(u);
    return (
      url.protocol === "https:" &&
      /bitrix24\./i.test(url.hostname) &&
      url.pathname.toLowerCase().startsWith("/rest/") &&
      u.endsWith("/")
    );
  } catch {
    return false;
  }
};

// 兼容: ดึง webhook จาก credentials (ใหม่) หรือ config (เก่า)
function deriveWebhookUrl(body: any): string | null {
  if (body?.credentials?.webhook_url) return String(body.credentials.webhook_url).trim();
  if (body?.config?.webhook_url) return String(body.config.webhook_url).trim();
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return bad(res, "Method Not Allowed (Expected POST)", 405);

  const rawOrg = (req.query.orgId as string) || "";
  if (!rawOrg.trim()) return bad(res, "Missing orgId in query");

  // ✅ รองรับ orgId เป็น UUID หรือ key
  let orgUuid: string;
  try {
    orgUuid = await resolveOrg(rawOrg);
  } catch (e: any) {
    return bad(res, e?.message || "Invalid org identifier");
  }

  const payload = req.body as any;
  if (!payload?.kind) return bad(res, "Missing kind in body");
  if (payload.kind !== "bitrix24_webhook") return bad(res, "Unsupported kind. Use 'bitrix24_webhook' only");

  const webhookUrl = deriveWebhookUrl(payload);
  if (!isWebhookUrl(webhookUrl)) {
    return bad(
      res,
      "Invalid webhook_url. ใช้ URL เต็มของ Bitrix และลงท้ายด้วย '/' เช่น https://{portal}.bitrix24.com/rest/{user}/{code}/"
    );
  }

  const host = new URL(webhookUrl).hostname;
  const name = (payload.name || `Bitrix24 (${host})`).trim();
  const code = (payload.code || "bitrix24").trim();

  try {
    const { data, error } = await supabase
      .from("data_sources")
      .upsert(
        {
          org_id: orgUuid,                  // ✅ ใช้ UUID ที่ resolve มา
          kind: "bitrix24_webhook",
          name,
          code,
          credentials: { webhook_url: webhookUrl }, // jsonb ตามสคีมา
          active: payload.active ?? true,
        },
        { onConflict: "org_id,kind", ignoreDuplicates: false }
      )
      .select()
      .single();

    if (error) {
      console.error("Supabase upsert error:", error);
      return bad(res, `Database save failed: ${error.message}`, 500);
    }

    return res.status(200).json({ success: true, message: "Integration saved successfully", data });
  } catch (e: any) {
    console.error("Database save failed:", e);
    return bad(res, "Database save failed: " + (e?.message || "unknown"), 500);
  }
}
