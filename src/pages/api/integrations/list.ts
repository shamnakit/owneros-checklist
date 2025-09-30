// src/pages/api/integrations/list.ts

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return bad(res, "Method Not Allowed", 405);

  const rawOrg = (req.query.orgId as string) || "";
  if (!rawOrg.trim()) return bad(res, "Missing orgId in query");

  let orgUuid: string;
  try {
    orgUuid = await resolveOrg(rawOrg);
  } catch (e: any) {
    return bad(res, e?.message || "Invalid org identifier");
  }

  try {
    const { data, error } = await supabase
      .from("data_sources")
      .select("id, code, name, kind, active, created_at")
      .eq("org_id", orgUuid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("list data_sources error:", error);
      return bad(res, `Database error: ${error.message}`, 500);
    }

    const sources = (data || []).map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      kind: r.kind,
      active: r.active,
      created_at: r.created_at,
      last_sync: null as any, // MVP
    }));

    return res.status(200).json({ ok: true, sources });
  } catch (e: any) {
    console.error("list handler failed:", e);
    return bad(res, "Unexpected error: " + (e?.message || "unknown"), 500);
  }
}
