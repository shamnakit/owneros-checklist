// src/pages/api/sources/index.ts — list/register (kept), accepts OPTIONS; orgId from header/body/query
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type SourceRow = {
  id: string; org_id: string; code: string; name: string; kind: string;
  credentials: any; active: boolean; created_at: string;
};

function parseOrgId(req: NextApiRequest) {
  return (
    String(req.headers["x-org-id"] || "") ||
    (req.method === "POST" ? String((req.body as any)?.orgId || "") : "") ||
    String((req.query.orgId as string) || "")
  );
}

async function listSources(orgId: string) {
  const { data, error } = await supabaseAdmin
    .from("data_sources")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

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
    if (req.method === "OPTIONS" || req.method === "HEAD") return res.status(200).end();

    const orgId = parseOrgId(req);
    if (!orgId) return res.status(400).json({ error: "missing orgId" });

    if (req.method === "GET") {
      const sources = await listSources(orgId);
      return res.json({ ok: true, sources });
    }

    if (req.method === "POST") {
      const { code, name, kind } = (req.body as any) || {};
      let { credentials, active } = (req.body as any) || {};
      if (!code || !name || !kind) return res.status(400).json({ error: "missing code/name/kind" });

      if (kind === "bitrix" && credentials?.webhookUrl) {
        const url = String(credentials.webhookUrl).trim();
        const base = url.match(/^https?:\/\/[^/]+/i)?.[0] || "";
        const after = url.split("/rest/")[1]?.replace(/\/+$/,"") || "";
        const [userId, webhook] = after.split("/");
        credentials = { mode: "webhook", baseUrl: base, userId, webhook };
      }

      const payload = { org_id: orgId, code, name, kind, credentials: credentials || {}, active: active ?? true };
      const { data, error } = await supabaseAdmin
        .from("data_sources")
        .upsert(payload, { onConflict: "org_id,code" })
        .select()
        .maybeSingle();
      if (error) throw error;

      return res.json({ ok: true, source: data });
    }

    return res.status(405).json({ error: "method_not_allowed" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "sources_index_failed" });
  }
}
