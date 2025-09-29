import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabaseServer";

type IntegrationKind = "bitrix24_webhook";

interface BitrixCredentials {
  webhook_url: string; // https://{portal}.bitrix24.{tld}/rest/{user}/{code}/ (ต้องลงท้ายด้วย '/')
}

interface SavePayload {
  kind: IntegrationKind;      // 'bitrix24_webhook'
  name?: string;              // ชื่อที่จะแสดง เช่น "Bitrix24 (synergysoft.bitrix24.com)"
  code?: string | null;       // โค้ดสั้นๆ ถ้าต้องการ เช่น "bitrix24"
  credentials: BitrixCredentials;
  active?: boolean;
}

const bad = (res: NextApiResponse, msg: string, code = 400) =>
  res.status(code).json({ success: false, error: msg });

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

function isWebhookUrl(u: unknown): u is string {
  if (typeof u !== "string") return false;
  try {
    const url = new URL(u);
    const okProto = url.protocol === "https:";
    const okHost = /bitrix24\./i.test(url.hostname);
    const okPath = url.pathname.toLowerCase().startsWith("/rest/");
    const endSlash = u.endsWith("/");
    return okProto && okHost && okPath && endSlash;
  } catch {
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return bad(res, "Method Not Allowed (Expected POST)", 405);

  const orgId = (req.query.orgId as string) || "";
  if (!orgId.trim()) return bad(res, "Missing orgId in query");
  if (!isUuid(orgId)) return bad(res, "orgId must be a valid UUID");

  const payload = req.body as Partial<SavePayload> | undefined;
  if (!payload || !payload.kind || !payload.credentials) {
    return bad(res, "Missing kind or credentials in body");
  }
  if (payload.kind !== "bitrix24_webhook") {
    return bad(res, "Unsupported kind. Use 'bitrix24_webhook' only");
  }

  const { webhook_url } = payload.credentials as BitrixCredentials;
  if (!isWebhookUrl(webhook_url)) {
    return bad(
      res,
      "Invalid credentials.webhook_url. ใช้ URL เต็มของ Bitrix และลงท้ายด้วย '/' เช่น https://{portal}.bitrix24.com/rest/{user}/{code}/"
    );
  }

  // สร้างค่าเริ่มต้นให้ name / code
  const host = new URL(webhook_url).hostname;
  const name = (payload.name || `Bitrix24 (${host})`).trim();
  const code = (payload.code || "bitrix24").trim();

  try {
    // upsert โดยยึดคู่คีย์ (org_id, kind) — ถ้าตารางคุณมี unique index คู่คีย์นี้จะสมบูรณ์
    const { data, error } = await supabase
      .from("data_sources")
      .upsert(
        {
          org_id: orgId,
          kind: payload.kind,
          name,
          code,
          credentials: { webhook_url },
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

    return res.status(200).json({
      success: true,
      message: "Integration saved successfully",
      data,
    });
  } catch (e: any) {
    console.error("Database save failed:", e?.message || e);
    return bad(res, "Database save failed: " + (e?.message || "unknown"), 500);
  }
}
