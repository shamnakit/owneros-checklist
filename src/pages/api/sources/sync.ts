import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { pullDealsWonDaily } from "@/connectors/bitrix/deals";
import { upsertSalesDaily } from "@/connectors/persist";
import { BitrixClient, BitrixCreds } from "@/connectors/bitrix/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).end();
    const orgId = String(req.headers["x-org-id"] || "");
    if (!orgId) return res.status(400).json({ error: "missing x-org-id" });

    const { sourceId, from, to } = req.body as { sourceId: string; from?: string; to?: string };
    if (!sourceId) return res.status(400).json({ error: "missing sourceId" });

    // อ่าน source
    const { data: source, error } = await supabaseAdmin
      .from("data_sources")
      .select("*")
      .eq("org_id", orgId)
      .eq("id", sourceId)
      .maybeSingle();
    if (error || !source) return res.status(404).json({ error: "source_not_found" });

    // ลง log sync_jobs
    const { data: job } = await supabaseAdmin
      .from("sync_jobs")
      .insert({ org_id: orgId, source_id: sourceId, status: "running", message: "started" })
      .select()
      .maybeSingle();

    const dateTo = to || new Date().toISOString().slice(0, 10);
    const dateFrom = from || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    try {
      if (source.kind === "bitrix") {
        const creds = source.credentials as BitrixCreds;
        // ใช้ client ตรง ๆ เพื่อลด overhead
        const rows = await pullDealsWonDaily(creds, dateFrom, dateTo);
        await upsertSalesDaily(orgId, rows);
      } else if (source.kind === "csv") {
        // CSV เป็น manual upload ผ่าน endpoints import/* จึงไม่มีซิงก์อัตโนมัติ
      } else {
        // รองรับ kind อื่น ๆ ในอนาคต (odoo/shopify/woo/...)
      }

      await supabaseAdmin
        .from("sync_jobs")
        .update({ status: "success", finished_at: new Date().toISOString(), message: `ok ${source.kind}` })
        .eq("id", job?.id || "");

      return res.json({ ok: true, kind: source.kind, from: dateFrom, to: dateTo });
    } catch (err: any) {
      await supabaseAdmin
        .from("sync_jobs")
        .update({ status: "error", finished_at: new Date().toISOString(), message: err?.message || String(err) })
        .eq("id", job?.id || "");
      throw err;
    }
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "sync_failed" });
  }
}
