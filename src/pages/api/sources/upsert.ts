// src/pages/api/sources/upsert.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function getOrgId(req: NextApiRequest) {
  return (
    String(req.headers["x-org-id"] || "") ||
    (req.method === "POST" ? String((req.body as any)?.orgId || "") : "") ||
    String((req.query.orgId as string) || "")
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST" && req.method !== "GET") {
      return res.status(405).json({ error: "method_not_allowed" });
    }

    const orgId = getOrgId(req);
    if (!orgId) return res.status(400).json({ error: "missing orgId" });

    // รับพารามิเตอร์ได้ทั้งจาก body และ query (สำหรับเทสแบบ GET)
    const src =
      req.method === "POST" ? (req.body as any) : (req.query as any);

    const code = src.code || "bitrix_main";
    const name = src.name || "Bitrix24 (Deals)";
    const kind = src.kind || "bitrix";
    let credentials = src.credentials || {};

    // อนุญาตให้วาง webhook URL เดียว ระบบแยกให้เอง
    // ตัวอย่าง: https://YOUR.bitrix24.com/rest/1/xxxxxxxxxxxxxxxxxxxx/
    if (kind === "bitrix" && credentials?.webhookUrl) {
      const url = String(credentials.webhookUrl).trim();
      const baseUrl = url.match(/^https?:\/\/[^/]+/i)?.[0] || "";
      const restPart = url.split("/rest/")[1]?.replace(/\/+$/,"") || "";
      const [userId, webhook] = restPart.split("/");
      credentials = { mode: "webhook", baseUrl, userId, webhook };
    }

    // upsert
    const payload = {
      org_id: orgId,
      code,
      name,
      kind,
      credentials: credentials || {},
      active: src.active ?? true,
    };

    const { data, error } = await supabaseAdmin
      .from("data_sources")
      .upsert(payload, { onConflict: "org_id,code" })
      .select()
      .maybeSingle();

    if (error) throw error;

    return res.json({ ok: true, source: data });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "sources_upsert_failed" });
  }
}
