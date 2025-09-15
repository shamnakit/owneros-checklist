import type { NextApiRequest, NextApiResponse } from "next";
import { pullDealsWonDaily } from "@/connectors/bitrix/deals";
import { upsertSalesDaily } from "@/connectors/persist";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).end();

    const orgId = String(req.headers["x-org-id"] || "");
    if (!orgId) return res.status(400).json({ error: "missing x-org-id" });

    const { from, to, creds } = req.body as {
      from: string; to: string;
      creds:
        | { mode: "webhook"; baseUrl: string; userId: string; webhook: string }
        | { mode: "oauth"; baseUrl: string; accessToken: string };
    };

    if (!from || !to || !creds) return res.status(400).json({ error: "missing params (from/to/creds)" });

    const rows = await pullDealsWonDaily(creds, from, to);
    await upsertSalesDaily(orgId, rows);
    res.json({ ok: true, inserted: rows.length });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "bitrix_sync_failed" });
  }
}
