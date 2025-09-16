import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type SourceRow = {
  id: string;
  org_id: string;
  code: string;
  name: string;
  kind: string; // 'csv' | 'bitrix' | 'odoo' | ...
  credentials: any;
  active: boolean;
  created_at: string;
};

async function listSources(orgId: string) {
  const { data, error } = await supabaseAdmin
    .from("data_sources")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  // enrich: last sync
  const rows = (data as SourceRow[]) || [];
  const withSync = await Promise.all(
    rows.map(async (r) => {
      const { data: sj } = await supabaseAdmin
        .from("sync_jobs")
        .select("status, started_at, finished_at, message")
        .eq("source_id", r.id)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return { ...r, last_sync: sj || null };
    })
  );
  return withSync;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const orgId = String(req.headers["x-org-id"] || "");
    if (!orgId) return res.status(400).json({ error: "missing x-org-id" });

    if (req.method === "GET") {
      const sources = await listSources(orgId);
      return res.json({ ok: true, sources });
    }

    if (req.method === "POST") {
      const { code, name, kind, credentials, active = true } = req.body || {};
      if (!code || !name || !kind) return res.status(400).json({ error: "missing code/name/kind" });

      const payload = { org_id: orgId, code, name, kind, credentials: credentials || {}, active };
      const { data, error } = await supabaseAdmin
        .from("data_sources")
        .upsert(payload, { onConflict: "org_id,code" })
        .select()
        .maybeSingle();
      if (error) throw error;

      return res.json({ ok: true, source: data });
    }

    return res.status(405).end();
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "sources_index_failed" });
  }
}
