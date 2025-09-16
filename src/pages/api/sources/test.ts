import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { BitrixClient } from "@/connectors/bitrix/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).end();
    const orgId = String(req.headers["x-org-id"] || "");
    if (!orgId) return res.status(400).json({ error: "missing x-org-id" });

    const { sourceId } = req.body as { sourceId: string };
    if (!sourceId) return res.status(400).json({ error: "missing sourceId" });

    const { data: source, error } = await supabaseAdmin
      .from("data_sources")
      .select("*")
      .eq("org_id", orgId)
      .eq("id", sourceId)
      .maybeSingle();

    if (error || !source) return res.status(404).json({ error: "source_not_found" });

    // Branch by kind
    if (source.kind === "bitrix") {
      const creds = source.credentials as
        | { mode: "webhook"; baseUrl: string; userId: string; webhook: string }
        | { mode: "oauth"; baseUrl: string; accessToken: string };

      const cli = new BitrixClient(creds as any);
      // เบาที่สุด: ลองอ่านดีลสำเร็จช่วง 7 วันล่าสุด
      const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const to = new Date().toISOString().slice(0, 10);
      const j = await cli.call("crm.deal.list", {
        filter: { "STAGE_SEMANTIC_ID": "S", ">=CLOSEDATE": from, "<=CLOSEDATE": to },
        select: ["ID"],
        order: { ID: "DESC" },
      });
      return res.json({ ok: true, kind: "bitrix", sample: Math.min(Array.isArray(j) ? j.length : 0, 50) });
    }

    if (source.kind === "csv") {
      // CSV ไม่ต้องเทสต์ต่อ API ภายนอก
      return res.json({ ok: true, kind: "csv" });
    }

    return res.json({ ok: true, kind: source.kind, note: "no specific tester implemented yet" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "test_failed" });
  }
}
