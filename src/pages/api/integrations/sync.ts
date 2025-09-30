// src/pages/api/integrations/sync.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabaseServer";

const bad = (res: NextApiResponse, msg: string, code = 400) =>
  res.status(code).json({ ok: false, error: msg });

const isUuid = (s?: string | null) =>
  !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s as string);

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

const fetchWithTimeout = async (url: string, ms = 8000) => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    const r = await fetch(url, { signal: controller.signal });
    const text = await r.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch {}
    return { ok: r.ok, status: r.status, text, json };
  } finally {
    clearTimeout(t);
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return bad(res, "Method Not Allowed", 405);

  const rawOrg = (req.query.orgId as string) || "";
  const sourceId = (req.query.sourceId as string) || "";
  if (!rawOrg.trim()) return bad(res, "Missing orgId in query");
  if (!isUuid(sourceId)) return bad(res, "Missing or invalid sourceId (UUID required)");

  let orgUuid: string;
  try {
    orgUuid = await resolveOrg(rawOrg);
  } catch (e: any) {
    return bad(res, e?.message || "Invalid org identifier");
  }

  try {
    const { data: src, error } = await supabase
      .from("data_sources")
      .select("id, org_id, kind, name, code, active, credentials")
      .eq("org_id", orgUuid)
      .eq("id", sourceId)
      .single();

    if (error || !src) {
      console.error("load source error:", error);
      return bad(res, "Source not found for this org", 404);
    }

    const jobId = crypto.randomUUID?.() || Math.random().toString(36).slice(2);

    if (src.kind === "bitrix24_webhook") {
      const webhook = (src.credentials as any)?.webhook_url;
      if (typeof webhook === "string" && webhook.endsWith("/")) {
        try {
          const result = await fetchWithTimeout(`${webhook}user.current.json`, 8000);
          if (!result.ok) {
            return res.status(200).json({
              ok: false,
              job_id: jobId,
              source_id: src.id,
              kind: src.kind,
              status: "failed",
              reason: `Bitrix returned ${result.status}`,
              raw: result.text?.slice(0, 500),
            });
          }
          return res.status(200).json({
            ok: true,
            job_id: jobId,
            source_id: src.id,
            kind: src.kind,
            status: "started",
            probe: {
              bitrix_user: {
                id: result?.json?.result?.ID,
                name: [result?.json?.result?.NAME, result?.json?.result?.LAST_NAME].filter(Boolean).join(" ") || undefined,
                email: result?.json?.result?.EMAIL,
              },
            },
            message: "Sync started (MVP mock).",
          });
        } catch (e: any) {
          return bad(res, "Probe to Bitrix failed: " + (e?.message || "unknown"), 500);
        }
      }
    }

    // default mock
    return res.status(200).json({
      ok: true,
      job_id: jobId,
      source_id: src.id,
      kind: src.kind,
      status: "started",
      message: "Sync started (MVP mock).",
    });
  } catch (e: any) {
    console.error("sync handler failed:", e);
    return bad(res, "Unexpected error: " + (e?.message || "unknown"), 500);
  }
}
