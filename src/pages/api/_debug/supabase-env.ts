// src/pages/api/_debug/supabase-env.ts
import type { NextApiRequest, NextApiResponse } from "next";
export default function handler(_: NextApiRequest, res: NextApiResponse) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const srv = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  res.status(200).json({
    ok: !!url && !!srv,
    supabase_url_present: !!url,
    service_role_present: !!srv,
    url_prefix: url.slice(0, 30),
    service_role_prefix: srv.slice(0, 12),
  });
}
