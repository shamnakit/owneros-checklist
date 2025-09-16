// src/pages/api/sources/test.ts — accept OPTIONS/GET (quick test) + POST; orgId from header/body/query
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { BitrixClient } from "@/connectors/bitrix/client";

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

    const { data: source, error } = await supabaseAdmin
      .from("data_sources")
      .select("*")
      .eq("org_id", orgId)
      .eq("id", sourceId)
      .maybeSingle();

    if (error || !source) return res.status(404).json({ error: "source_not_found" });

    if (source.kind === "bitrix") {
      const creds = source.credentials as
        | { mode: "webhook"; baseUrl: string; userId: string; webhook: string }
        | { mode: "oauth"; baseUrl: string; accessToken: string };

      const cli = new BitrixClient(creds as any);
      const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const to = new Date().toISOString().slice(0, 10);
      const j = await cli.call("crm.deal.list", {
        filter: { "STAGE_SEMANTIC_ID": "S", ">=CLOSEDATE": from, "<=CLOSEDATE": to },
        select: ["ID"],
        order: { ID: "DESC" },
      });
      return res.json({ ok: true, kind: "bitrix", sample: Math.min(Array.isArray(j) ? j.length : 0, 50) });
    }

    if (source.kind === "csv") return res.json({ ok: true, kind: "csv" });
    return res.json({ ok: true, kind: source.kind, note: "no specific tester implemented yet" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "test_failed" });
  }
}
