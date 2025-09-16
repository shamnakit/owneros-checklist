// src/pages/api/sources/sync.ts — accept OPTIONS/GET + POST; orgId from header/body/query
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { pullDealsWonDaily } from "@/connectors/bitrix/deals";
import { upsertSalesDaily } from "@/connectors/persist";
import type { BitrixCreds } from "@/connectors/bitrix/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "OPTIONS" || req.method === "HEAD") return res.status(200).end();

    const isPost = req.method === "POST";
    if (!isPost && req.method !== "GET") return res.status(405).json({ error: "use POST (or GET for quick test)" });

    const orgId =
      String(req.headers["x-org-id"] || "") ||
      (isPost ? String((req.body as any)?.orgId || "") : String((req.query.orgId as string) || ""));
    if (!orgId) return res.status(400).json({ error: "missing orgId" });

    const sourceId = isPost ? (req.body as any)?.sourceId : (req.query.sourceId as string);
    if (!sourceId) return res.status(400).json({ error: "missing sourceId" });

    const dateFrom =
      (isPost ? (req.body as any)?.from : (req.query.from as string)) ||
      new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const dateTo =
      (isPost ? (req.body as any)?.to : (req.query.to as string)) ||
      new Date().toISOString().slice(0, 10);

    const { data: source, error } = await supabaseAdmin
      .from("data_sources")
      .select("*")
      .eq("org_id", orgId)
      .eq("id", sourceId)
      .maybeSingle();
    if (error || !source) return res.status(404).json({ error: "source_not_found" });

    const { data: job } = await supabaseAdmin
      .from("sync_jobs")
      .insert({ org_id: orgId, source_id: sourceId, status: "running", message: `start ${source.kind}` })
      .select()
      .maybeSingle();

    try {
      if (source.kind === "bitrix") {
        const creds = source.credentials as BitrixCreds;
        const rows = await pullDealsWonDaily(creds, dateFrom, dateTo);
        await upsertSalesDaily(orgId, rows);
      } else if (source.kind === "csv") {
        // Manual upload only
      } else {
        // other connectors in future
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
